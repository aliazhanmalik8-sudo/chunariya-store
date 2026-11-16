import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import {
  UPLOADS_DIR,
  hashPassword,
  readDb,
  slugify,
  verifyPassword,
  writeDb,
} from './server/db.ts';
import type { AdminAccount, DatabaseSchema } from './server/db.ts';
import type {
  AdminUserSummary,
  Category,
  CustomerSummary,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  StoreSettings,
} from './src/types.ts';

const PORT = 3000;
const SESSION_COOKIE_NAME = 'chunariya_admin_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(process.cwd() + '_chunariya_secret').digest('hex');

const VALID_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      result[key] = val;
    }
  }
  return result;
}

function signSessionToken(email: string, sessionId: string): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ email, sid: sessionId, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): { email: string; sid: string } | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email: string;
      sid?: string;
      exp: number;
    };
    if (!decoded.email || !decoded.sid || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    return { email: decoded.email, sid: decoded.sid };
  } catch {
    return null;
  }
}

function getAdminSession(req: Request): { email: string; sid: string } | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    const verified = verifySessionToken(bearerToken);
    if (verified) return verified;
  }
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[SESSION_COOKIE_NAME]);
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const isHttps =
    req.secure ||
    String(req.headers['x-forwarded-proto'] || '').includes('https') ||
    process.env.NODE_ENV === 'production';

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function toAdminSummaries(accounts: AdminAccount[]): AdminUserSummary[] {
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    createdAt: a.createdAt,
  }));
}

function inspectAdminSession(
  req: Request,
  db: DatabaseSchema,
): { session: { email: string; name: string; sid: string } | null; sessionReplaced: boolean } {
  const tokenData = getAdminSession(req);
  if (!tokenData) {
    return { session: null, sessionReplaced: false };
  }

  // Only one person/session can be active at a time
  if (!db.activeAdminSession || db.activeAdminSession.sessionId !== tokenData.sid) {
    const replaced = Boolean(db.activeAdminSession && db.activeAdminSession.sessionId !== tokenData.sid);
    return { session: null, sessionReplaced: replaced };
  }

  if (process.env.ADMIN_PASSWORD) {
    const envEmail = (process.env.ADMIN_EMAIL || 'admin@chunariya.com').trim().toLowerCase();
    if (tokenData.email === envEmail) {
      return {
        session: { email: tokenData.email, name: 'Primary Admin', sid: tokenData.sid },
        sessionReplaced: false,
      };
    }
    return { session: null, sessionReplaced: false };
  }

  const account = db.adminAccounts.find((a) => a.email === tokenData.email);
  if (!account) {
    return { session: null, sessionReplaced: false };
  }
  return {
    session: { email: account.email, name: account.name, sid: tokenData.sid },
    sessionReplaced: false,
  };
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const db = readDb();
  const { session, sessionReplaced } = inspectAdminSession(req, db);
  if (!session) {
    res.status(401).json({
      error: sessionReplaced
        ? 'You were signed out because another person logged in. Only one person can be logged in at one time.'
        : 'Admin session expired or unauthorized. Please sign in again.',
    });
    return;
  }
  res.locals.adminSession = session;
  next();
}

function sanitizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return '92' + digits.slice(1);
  }
  return digits;
}

function buildWhatsappMessage(order: Omit<Order, 'whatsappMessage'>): string {
  const lines = [
    `*New Order — ${order.orderNumber}*`,
    `Store: CHUNARIYA`,
    ``,
    `*Customer Details*`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    order.whatsappNumber && order.whatsappNumber !== order.phone
      ? `WhatsApp: ${order.whatsappNumber}`
      : '',
    `Address: ${order.address}`,
    `City: ${order.city}${order.postalCode ? ` (${order.postalCode})` : ''}`,
    order.notes ? `Notes: ${order.notes}` : '',
    ``,
    `*Ordered Items*`,
    ...order.items.map(
      (item, idx) =>
        `${idx + 1}. ${item.name} — Size: ${item.size}, Color: ${item.color}, Qty: ${item.quantity} x ${order.currency} ${item.unitPrice.toLocaleString()} = ${order.currency} ${item.lineTotal.toLocaleString()}`,
    ),
    ``,
    `Subtotal: ${order.currency} ${order.subtotal.toLocaleString()}`,
    `Delivery Charges: ${order.deliveryCharges === 0 ? 'FREE' : `${order.currency} ${order.deliveryCharges.toLocaleString()}`}`,
    `*Total Amount: ${order.currency} ${order.totalAmount.toLocaleString()}*`,
  ].filter((line) => line !== '');

  return lines.join('\n');
}

function deriveCustomers(orders: Order[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const order of orders) {
    const normalizedPhone = order.phone.replace(/\s+/g, '');
    const key = `${normalizedPhone}|${order.customerName.trim().toLowerCase()}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        name: order.customerName,
        phone: order.phone,
        whatsappNumber: order.whatsappNumber || order.phone,
        city: order.city,
        address: order.address,
        orderCount: 1,
        totalSpent: order.totalAmount,
        lastOrderDate: order.createdAt,
      });
    } else {
      existing.orderCount += 1;
      existing.totalSpent += order.totalAmount;
      if (order.createdAt > existing.lastOrderDate) {
        existing.lastOrderDate = order.createdAt;
        existing.city = order.city;
        existing.address = order.address;
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    b.lastOrderDate.localeCompare(a.lastOrderDate),
  );
}

async function startServer(): Promise<void> {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '50mb' }));

  // Ensure DB is initialized on startup
  readDb();

  // Disable caching on all API routes so storefront always reflects latest admin edits
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Serve uploaded images statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // SEO: robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`,
    );
  });

  // SEO: dynamic sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const db = readDb();
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const staticRoutes = [
      '/',
      '/shop',
      '/new-arrivals',
      '/best-sellers',
      '/sale',
      '/about',
      '/contact',
      '/faq',
      '/shipping-policy',
      '/return-policy',
      '/privacy-policy',
      '/terms',
    ];
    const categoryRoutes = db.categories
      .filter((c) => c.visible)
      .map((c) => `/collections/${c.slug}`);
    const productRoutes = db.products
      .filter((p) => p.isAvailable)
      .map((p) => `/product/${p.slug}`);

    const allUrls = [...staticRoutes, ...categoryRoutes, ...productRoutes];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls
      .map((u) => `  <url><loc>${baseUrl}${u}</loc></url>`)
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  });

  // Public Storefront API
  app.get('/api/storefront', (_req, res) => {
    const db = readDb();
    const visibleCategories = [...db.categories]
      .filter((c) => c.visible)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const availableProducts = db.products.filter((p) => p.isAvailable);
    res.json({
      categories: visibleCategories,
      products: availableProducts,
      settings: db.settings,
      reviews: db.reviews,
    });
  });

  app.get('/api/products/:slug', (req, res) => {
    const db = readDb();
    const product = db.products.find(
      (p) => (p.slug === req.params.slug || p.id === req.params.slug) && p.isAvailable,
    );
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const related = db.products
      .filter(
        (p) =>
          p.id !== product.id &&
          p.isAvailable &&
          p.categoryIds.some((cid) => product.categoryIds.includes(cid)),
      )
      .slice(0, 4);
    res.json({ product, related });
  });

  // Customer Order Creation (Checkout + WhatsApp Link Generator)
  app.post('/api/orders', (req, res) => {
    const body = req.body as {
      customerName?: string;
      phone?: string;
      whatsappNumber?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      notes?: string;
      items?: Array<{
        productId: string;
        size: string;
        color: string;
        quantity: number;
      }>;
    };

    const customerName = String(body.customerName || '').trim();
    const phone = String(body.phone || '').trim();
    const whatsappNumber = String(body.whatsappNumber || '').trim() || phone;
    const address = String(body.address || '').trim();
    const city = String(body.city || '').trim();
    const postalCode = String(body.postalCode || '').trim();
    const notes = String(body.notes || '').trim();

    if (!customerName || !phone || !address || !city) {
      res.status(400).json({
        error: 'Please provide your Full Name, Phone Number, Delivery Address, and City.',
      });
      return;
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Your shopping cart is empty.' });
      return;
    }

    const db = readDb();
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const reqItem of body.items) {
      const product = db.products.find((p) => p.id === reqItem.productId && p.isAvailable);
      if (!product) {
        res.status(400).json({ error: 'One of the selected items is no longer available.' });
        return;
      }
      const qty = Math.max(1, Math.min(20, Math.floor(Number(reqItem.quantity) || 1)));
      const unitPrice =
        product.discountPrice !== null && product.discountPrice < product.price
          ? product.discountPrice
          : product.price;
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] || '',
        size: String(reqItem.size || product.sizes[0] || 'Standard'),
        color: String(reqItem.color || product.colors[0] || 'Default'),
        quantity: qty,
        unitPrice,
        lineTotal,
      });

      if (product.stock > 0) {
        product.stock = Math.max(0, product.stock - qty);
      }
    }

    const freeThreshold = db.settings.freeDeliveryThreshold || 0;
    const deliveryCharges =
      freeThreshold > 0 && subtotal >= freeThreshold ? 0 : db.settings.deliveryCharges;
    const totalAmount = subtotal + deliveryCharges;

    const orderNum = db.orderCounter++;
    const now = new Date().toISOString();
    const orderBase: Omit<Order, 'whatsappMessage'> = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      orderNumber: `CHU-${orderNum}`,
      customerName,
      phone,
      whatsappNumber,
      address,
      city,
      postalCode,
      notes,
      items: orderItems,
      subtotal,
      deliveryCharges,
      totalAmount,
      currency: db.settings.currency,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    const whatsappMessage = buildWhatsappMessage(orderBase);
    const fullOrder: Order = { ...orderBase, whatsappMessage };
    db.orders.unshift(fullOrder);
    writeDb(db);

    const storeWa = sanitizeWhatsappNumber(db.settings.whatsappNumber);
    const whatsappUrl = `https://wa.me/${storeWa}?text=${encodeURIComponent(whatsappMessage)}`;

    res.status(201).json({
      order: fullOrder,
      whatsappUrl,
    });
  });

  // Customer Contact Form Submission
  app.post('/api/contact', (req, res) => {
    const body = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !message) {
      res.status(400).json({ error: 'Please provide your name and message.' });
      return;
    }

    const db = readDb();
    db.contactMessages.unshift({
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      phone,
      message,
      createdAt: new Date().toISOString(),
    });
    writeDb(db);
    res.status(201).json({ ok: true });
  });

  // Admin Authentication Endpoints
  app.get('/api/admin/auth-status', (req, res) => {
    const db = readDb();
    const envPassword = process.env.ADMIN_PASSWORD;
    const configured = Boolean(envPassword || db.adminAccounts.length > 0);
    const { session, sessionReplaced } = inspectAdminSession(req, db);
    res.json({
      configured,
      authenticated: Boolean(session),
      adminEmail: session?.email ?? null,
      adminName: session?.name ?? null,
      usesEnvCredentials: Boolean(envPassword),
      sessionReplaced,
    });
  });

  app.post('/api/admin/setup', (req, res) => {
    const db = readDb();
    if (process.env.ADMIN_PASSWORD || db.adminAccounts.length > 0) {
      res.status(400).json({ error: 'Admin account is already configured. Please log in.' });
      return;
    }
    const body = req.body as { email?: string; password?: string };
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid admin email address.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const now = new Date().toISOString();
    const primaryCreds = hashPassword(password);
    const primaryAccount: AdminAccount = {
      id: `adm-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Admin',
      email,
      role: 'Primary Admin',
      salt: primaryCreds.salt,
      passwordHash: primaryCreds.hash,
      createdAt: now,
    };

    const sessionId = crypto.randomUUID();
    db.adminAccounts = [primaryAccount];
    db.adminAccount = primaryAccount;
    db.activeAdminSession = {
      sessionId,
      email,
      name: primaryAccount.name,
      loggedInAt: now,
    };
    writeDb(db);

    const token = signSessionToken(email, sessionId);
    setSessionCookie(req, res, token);
    res.status(201).json({
      authenticated: true,
      adminEmail: email,
      adminName: primaryAccount.name,
      token,
    });
  });

  app.post('/api/admin/login', (req, res) => {
    const db = readDb();
    const body = req.body as { email?: string; password?: string };
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    const envPassword = process.env.ADMIN_PASSWORD;
    const envEmail = (process.env.ADMIN_EMAIL || 'admin@chunariya.com').trim().toLowerCase();

    if (envPassword) {
      if (email === envEmail && password === envPassword) {
        const sessionId = crypto.randomUUID();
        db.activeAdminSession = {
          sessionId,
          email,
          name: 'Primary Admin',
          loggedInAt: new Date().toISOString(),
        };
        writeDb(db);
        const token = signSessionToken(email, sessionId);
        setSessionCookie(req, res, token);
        res.json({
          authenticated: true,
          adminEmail: email,
          adminName: 'Primary Admin',
          token,
        });
        return;
      }
      res.status(401).json({ error: 'Invalid admin email or password.' });
      return;
    }

    if (db.adminAccounts.length === 0) {
      res.status(400).json({ error: 'No admin account configured yet.' });
      return;
    }

    const account = db.adminAccounts.find((a) => a.email === email);
    if (account && verifyPassword(password, account.salt, account.passwordHash)) {
      const sessionId = crypto.randomUUID();
      db.activeAdminSession = {
        sessionId,
        email: account.email,
        name: account.name,
        loggedInAt: new Date().toISOString(),
      };
      writeDb(db);
      const token = signSessionToken(account.email, sessionId);
      setSessionCookie(req, res, token);
      res.json({
        authenticated: true,
        adminEmail: account.email,
        adminName: account.name,
        token,
      });
      return;
    }

    res.status(401).json({ error: 'Invalid admin email or password.' });
  });

  app.post('/api/admin/logout', (req, res) => {
    const db = readDb();
    const tokenData = getAdminSession(req);
    if (tokenData && db.activeAdminSession?.sessionId === tokenData.sid) {
      db.activeAdminSession = null;
      writeDb(db);
    }
    const isHttps =
      req.secure ||
      String(req.headers['x-forwarded-proto'] || '').includes('https') ||
      process.env.NODE_ENV === 'production';
    res.clearCookie(SESSION_COOKIE_NAME, {
      path: '/',
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
    });
    res.json({ ok: true });
  });

  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    if (process.env.ADMIN_PASSWORD) {
      res.status(400).json({
        error: 'Password is managed via ADMIN_PASSWORD environment variable.',
      });
      return;
    }
    const body = req.body as {
      currentPassword?: string;
      newPassword?: string;
      newEmail?: string;
    };
    const session = res.locals.adminSession as { email: string; name: string; sid: string };
    const db = readDb();
    const account = db.adminAccounts.find((a) => a.email === session.email) ?? db.adminAccounts[0];
    if (!account) {
      res.status(400).json({ error: 'Admin account not found.' });
      return;
    }
    if (!verifyPassword(String(body.currentPassword || ''), account.salt, account.passwordHash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    const { salt, hash } = hashPassword(newPassword);
    account.salt = salt;
    account.passwordHash = hash;
    if (body.newEmail && body.newEmail.includes('@')) {
      account.email = body.newEmail.trim().toLowerCase();
    }
    const newSessionId = crypto.randomUUID();
    db.adminAccounts = [account];
    db.adminAccount = account;
    db.activeAdminSession = {
      sessionId: newSessionId,
      email: account.email,
      name: account.name,
      loggedInAt: new Date().toISOString(),
    };
    writeDb(db);
    const token = signSessionToken(account.email, newSessionId);
    setSessionCookie(req, res, token);
    res.json({ ok: true, adminEmail: account.email, adminName: account.name, token });
  });

  // Protected Admin Bootstrap
  app.get('/api/admin/bootstrap', requireAdmin, (_req, res) => {
    const db = readDb();
    const categories = [...db.categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const customers = deriveCustomers(db.orders);
    res.json({
      categories,
      products: db.products,
      orders: db.orders,
      customers,
      reviews: db.reviews,
      contactMessages: db.contactMessages,
      settings: db.settings,
      adminAccounts: toAdminSummaries(db.adminAccounts),
    });
  });

  // Protected Image Upload (Base64 Data URL -> saved image file under /uploads)
  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const body = req.body as { dataUrl?: string; fileName?: string };
    const dataUrl = String(body.dataUrl || '');
    const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/i);
    if (!match) {
      res.status(400).json({ error: 'Please upload a valid PNG, JPG, GIF, or WEBP image.' });
      return;
    }
    const mime = match[1].toLowerCase();
    const ext =
      mime === 'image/png'
        ? 'png'
        : mime === 'image/webp'
          ? 'webp'
          : mime === 'image/gif'
            ? 'gif'
            : 'jpg';
    const buffer = Buffer.from(match[3], 'base64');
    if (buffer.length > 15 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size must be 15 MB or less.' });
      return;
    }
    const baseName = slugify((body.fileName || 'image').replace(/\.[^.]+$/, '')).slice(0, 32);
    const finalName = `${baseName}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, finalName), buffer);
    res.status(201).json({ url: `/uploads/${finalName}` });
  });

  // Protected Category Management
  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    const body = req.body as Partial<Category>;
    const name = String(body.name || '').trim();
    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const db = readDb();
    const baseSlug = slugify(body.slug || name);
    let slug = baseSlug;
    let counter = 2;
    while (db.categories.some((c) => c.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    const maxOrder = db.categories.reduce((max, c) => Math.max(max, c.displayOrder), 0);
    const category: Category = {
      id: `cat-${crypto.randomUUID().slice(0, 8)}`,
      name,
      slug,
      description: String(body.description || '').trim(),
      image: String(body.image || ''),
      displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : maxOrder + 1,
      visible: body.visible !== undefined ? Boolean(body.visible) : true,
      createdAt: new Date().toISOString(),
    };
    db.categories.push(category);
    writeDb(db);
    res.status(201).json({ category });
  });

  app.post('/api/admin/categories/reorder', requireAdmin, (req, res) => {
    const body = req.body as { orderedIds?: string[] };
    if (!Array.isArray(body.orderedIds)) {
      res.status(400).json({ error: 'orderedIds array is required.' });
      return;
    }
    const db = readDb();
    body.orderedIds.forEach((id, idx) => {
      const cat = db.categories.find((c) => c.id === id);
      if (cat) {
        cat.displayOrder = idx + 1;
      }
    });
    writeDb(db);
    const categories = [...db.categories].sort((a, b) => a.displayOrder - b.displayOrder);
    res.json({ categories });
  });

  app.patch('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const category = db.categories.find((c) => c.id === req.params.id);
    if (!category) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    const body = req.body as Partial<Category>;
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        res.status(400).json({ error: 'Category name cannot be empty.' });
        return;
      }
      category.name = name;
    }
    if (body.slug !== undefined) {
      const nextSlug = slugify(String(body.slug));
      if (nextSlug && !db.categories.some((c) => c.slug === nextSlug && c.id !== category.id)) {
        category.slug = nextSlug;
      }
    }
    if (body.description !== undefined) category.description = String(body.description).trim();
    if (body.image !== undefined) category.image = String(body.image);
    if (body.displayOrder !== undefined) category.displayOrder = Number(body.displayOrder);
    if (body.visible !== undefined) category.visible = Boolean(body.visible);

    writeDb(db);
    res.json({ category });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const id = String(req.params.id);
    db.categories = db.categories.filter((c) => c.id !== id);
    db.products = db.products.map((p) => ({
      ...p,
      categoryIds: p.categoryIds.filter((cid) => cid !== id),
    }));
    writeDb(db);
    res.json({ ok: true });
  });

  // Protected Product Management
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const body = req.body as Partial<Product>;
    const name = String(body.name || '').trim();
    if (!name) {
      res.status(400).json({ error: 'Product name is required.' });
      return;
    }
    const db = readDb();
    const baseSlug = slugify(body.slug || name);
    let slug = baseSlug;
    let counter = 2;
    while (db.products.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    const now = new Date().toISOString();
    const price = Math.max(0, Number(body.price) || 0);
    const rawDiscount =
      body.discountPrice !== null && body.discountPrice !== undefined && Number(body.discountPrice) > 0
        ? Number(body.discountPrice)
        : null;

    const product: Product = {
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      name,
      slug,
      description: String(body.description || '').trim(),
      fabricDetails: String(body.fabricDetails || '').trim(),
      price,
      discountPrice: rawDiscount,
      images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : [],
      sizes:
        Array.isArray(body.sizes) && body.sizes.length > 0
          ? body.sizes
          : ['Unstitched', 'S', 'M', 'L'],
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : ['Ivory'],
      stock: Math.max(0, Math.floor(Number(body.stock) || 0)),
      isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
      isBestSeller: Boolean(body.isBestSeller),
      isNewArrival: Boolean(body.isNewArrival),
      isFeatured: Boolean(body.isFeatured),
      isTrending: Boolean(body.isTrending),
      createdAt: now,
      updatedAt: now,
    };
    db.products.unshift(product);
    writeDb(db);
    res.status(201).json({ product });
  });

  app.patch('/api/admin/products/bulk-update', requireAdmin, (req, res) => {
    const body = req.body as {
      updates?: Array<{
        id: string;
        price?: number;
        discountPrice?: number | null;
        stock?: number;
        isAvailable?: boolean;
      }>;
    };
    if (!Array.isArray(body.updates)) {
      res.status(400).json({ error: 'updates array is required.' });
      return;
    }
    const db = readDb();
    const now = new Date().toISOString();
    for (const u of body.updates) {
      const p = db.products.find((item) => item.id === u.id);
      if (!p) continue;
      if (u.price !== undefined) p.price = Math.max(0, Number(u.price) || 0);
      if (u.discountPrice !== undefined) {
        p.discountPrice =
          u.discountPrice !== null && Number(u.discountPrice) > 0 ? Number(u.discountPrice) : null;
      }
      if (u.stock !== undefined) p.stock = Math.max(0, Math.floor(Number(u.stock) || 0));
      if (u.isAvailable !== undefined) p.isAvailable = Boolean(u.isAvailable);
      p.updatedAt = now;
    }
    writeDb(db);
    res.json({ products: db.products });
  });

  app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const body = req.body as Partial<Product>;
    if (body.name !== undefined) product.name = String(body.name).trim() || product.name;
    if (body.description !== undefined) product.description = String(body.description).trim();
    if (body.fabricDetails !== undefined) product.fabricDetails = String(body.fabricDetails).trim();
    if (body.price !== undefined) product.price = Math.max(0, Number(body.price) || 0);
    if (body.discountPrice !== undefined) {
      product.discountPrice =
        body.discountPrice !== null && Number(body.discountPrice) > 0
          ? Number(body.discountPrice)
          : null;
    }
    if (Array.isArray(body.images)) product.images = body.images.filter(Boolean);
    if (Array.isArray(body.categoryIds)) product.categoryIds = body.categoryIds;
    if (Array.isArray(body.sizes)) product.sizes = body.sizes.filter(Boolean);
    if (Array.isArray(body.colors)) product.colors = body.colors.filter(Boolean);
    if (body.stock !== undefined) product.stock = Math.max(0, Math.floor(Number(body.stock) || 0));
    if (body.isAvailable !== undefined) product.isAvailable = Boolean(body.isAvailable);
    if (body.isBestSeller !== undefined) product.isBestSeller = Boolean(body.isBestSeller);
    if (body.isNewArrival !== undefined) product.isNewArrival = Boolean(body.isNewArrival);
    if (body.isFeatured !== undefined) product.isFeatured = Boolean(body.isFeatured);
    if (body.isTrending !== undefined) product.isTrending = Boolean(body.isTrending);
    product.updatedAt = new Date().toISOString();

    writeDb(db);
    res.json({ product });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.products = db.products.filter((p) => p.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  // Protected Order Management
  app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
    const body = req.body as { status?: OrderStatus };
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const db = readDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    order.status = body.status;
    order.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json({ order });
  });

  app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.orders = db.orders.filter((o) => o.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  // Protected Website & Contact Settings
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const body = req.body as Partial<StoreSettings>;
    const db = readDb();
    db.settings = {
      ...db.settings,
      ...(body.storeName !== undefined ? { storeName: String(body.storeName).trim() || 'CHUNARIYA' } : {}),
      ...(body.tagline !== undefined ? { tagline: String(body.tagline).trim() } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: String(body.logoUrl) } : {}),
      ...(body.whatsappNumber !== undefined
        ? { whatsappNumber: String(body.whatsappNumber).trim() }
        : {}),
      ...(body.phoneNumber !== undefined ? { phoneNumber: String(body.phoneNumber).trim() } : {}),
      ...(body.emailAddress !== undefined ? { emailAddress: String(body.emailAddress).trim() } : {}),
      ...(body.storeAddress !== undefined ? { storeAddress: String(body.storeAddress).trim() } : {}),
      ...(body.instagramUrl !== undefined ? { instagramUrl: String(body.instagramUrl).trim() } : {}),
      ...(body.facebookUrl !== undefined ? { facebookUrl: String(body.facebookUrl).trim() } : {}),
      ...(body.deliveryCharges !== undefined
        ? { deliveryCharges: Math.max(0, Number(body.deliveryCharges) || 0) }
        : {}),
      ...(body.freeDeliveryThreshold !== undefined
        ? { freeDeliveryThreshold: Math.max(0, Number(body.freeDeliveryThreshold) || 0) }
        : {}),
      ...(body.currency !== undefined ? { currency: String(body.currency).trim() || 'PKR' } : {}),
      ...(body.heroBannerUrl !== undefined ? { heroBannerUrl: String(body.heroBannerUrl) } : {}),
      ...(body.heroHeadline !== undefined ? { heroHeadline: String(body.heroHeadline).trim() } : {}),
      ...(body.heroSubheadline !== undefined
        ? { heroSubheadline: String(body.heroSubheadline).trim() }
        : {}),
      ...(body.craftsmanshipBannerUrl !== undefined
        ? { craftsmanshipBannerUrl: String(body.craftsmanshipBannerUrl) }
        : {}),
      ...(body.aboutUsContent !== undefined
        ? { aboutUsContent: String(body.aboutUsContent).trim() }
        : {}),
    };
    writeDb(db);
    res.json({ settings: db.settings });
  });

  // Vite dev middleware or production static build serving
  const isDev = process.env.VITE_DEV === 'true';
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CHUNARIYA storefront & admin server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
