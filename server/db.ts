import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  Category,
  ContactMessage,
  CustomerReview,
  Order,
  Product,
  StoreSettings,
} from '../src/types.ts';

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: 'Primary Admin' | 'Co-Admin';
  salt: string;
  passwordHash: string;
  createdAt: string;
}

export interface ActiveAdminSession {
  sessionId: string;
  email: string;
  name: string;
  loggedInAt: string;
}

export interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  orders: Order[];
  reviews: CustomerReview[];
  contactMessages: ContactMessage[];
  settings: StoreSettings;
  adminAccount: AdminAccount | null;
  adminAccounts: AdminAccount[];
  activeAdminSession: ActiveAdminSession | null;
  orderCounter: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'store-db.json');

const IMG_HERO = '/src/assets/images/hero_chunariya_editorial_1794844742164.jpg';
const IMG_BLUSH_LAWN = '/src/assets/images/prod_blush_lawn_suit_1794844742453.jpg';
const IMG_MAROON_CHIFFON = '/src/assets/images/prod_maroon_chiffon_formal_1794844743208.jpg';
const IMG_IVORY_LUXURY = '/src/assets/images/prod_ivory_embroidered_luxury_1794844743579.jpg';
const IMG_CREAM_COTTON = '/src/assets/images/prod_cream_cotton_casual_1794844744152.jpg';
const IMG_ATELIER = '/src/assets/images/banner_heritage_craftsmanship_1794844745278.jpg';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function createInitialData(): DatabaseSchema {
  const now = new Date().toISOString();

  const categories: Category[] = [
    {
      id: 'cat-lawn',
      name: 'Lawn Suits',
      slug: 'lawn-suits',
      description: 'Breathable pure Pakistani lawn adorned with botanical prints and fine resham embroidery.',
      image: IMG_BLUSH_LAWN,
      displayOrder: 1,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-cotton',
      name: 'Cotton Suits',
      slug: 'cotton-suits',
      description: 'Crisp cotton cambric ensembles crafted for effortless everyday poise.',
      image: IMG_CREAM_COTTON,
      displayOrder: 2,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-chiffon',
      name: 'Chiffon Suits',
      slug: 'chiffon-suits',
      description: 'Flowing pure crinkle chiffon silhouettes enriched with antique tilla and sequin work.',
      image: IMG_MAROON_CHIFFON,
      displayOrder: 3,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-embroidered',
      name: 'Embroidered Suits',
      slug: 'embroidered-suits',
      description: 'Intricate threadwork, zari, and scalloped organza borders finished by master artisans.',
      image: IMG_IVORY_LUXURY,
      displayOrder: 4,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-2piece',
      name: '2 Piece Suits',
      slug: '2-piece-suits',
      description: 'Coordinated shirt and trouser pairings designed for refined daily elegance.',
      image: IMG_CREAM_COTTON,
      displayOrder: 5,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-3piece',
      name: '3 Piece Suits',
      slug: '3-piece-suits',
      description: 'Complete signature ensembles featuring shirt, trouser, and statement dupatta.',
      image: IMG_BLUSH_LAWN,
      displayOrder: 6,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-unstitched',
      name: 'Unstitched Suits',
      slug: 'unstitched-suits',
      description: 'Generous yardage with embroidered panels and borders for bespoke tailoring.',
      image: IMG_ATELIER,
      displayOrder: 7,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-stitched',
      name: 'Stitched Suits',
      slug: 'stitched-suits',
      description: 'Ready-to-wear silhouettes tailored with precision finishing and pearl accents.',
      image: IMG_IVORY_LUXURY,
      displayOrder: 8,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-luxury',
      name: 'Luxury Collection',
      slug: 'luxury-collection',
      description: 'Heirloom-inspired festive couture in ivory, blush, and deep maroon.',
      image: IMG_HERO,
      displayOrder: 9,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-casual',
      name: 'Casual Wear',
      slug: 'casual-wear',
      description: 'Light, graceful daytime attire crafted in soft breathable natural weaves.',
      image: IMG_CREAM_COTTON,
      displayOrder: 10,
      visible: true,
      createdAt: now,
    },
    {
      id: 'cat-formal',
      name: 'Formal Wear',
      slug: 'formal-wear',
      description: 'Regal evening and wedding ensembles radiating timeless Pakistani artistry.',
      image: IMG_MAROON_CHIFFON,
      displayOrder: 11,
      visible: true,
      createdAt: now,
    },
  ];

  const products: Product[] = [
    {
      id: 'prod-gulbahar-blush',
      name: 'Gulbahar Blush Embroidered 3-Piece Lawn Suit',
      slug: 'gulbahar-blush-embroidered-3-piece-lawn-suit',
      description:
        'A luminous pastel blush ensemble crafted on high-count Swiss voile lawn. Detailed with delicate botanical resham embroidery across the neckline and daman, paired with an airy scalloped chiffon dupatta and dyed cambric trousers.',
      fabricDetails:
        'Shirt: 100% Pure Swiss Lawn (3.0m) · Dupatta: Embroidered Crinkle Chiffon (2.5m) · Trouser: Fine Cotton Cambric (2.5m)',
      price: 8950,
      discountPrice: 7450,
      images: [IMG_BLUSH_LAWN, IMG_ATELIER],
      categoryIds: ['cat-lawn', 'cat-embroidered', 'cat-3piece', 'cat-unstitched', 'cat-stitched'],
      sizes: ['Unstitched', 'XS', 'S', 'M', 'L', 'XL'],
      colors: ['Blush Pink', 'Dusty Rose'],
      stock: 24,
      isAvailable: true,
      isBestSeller: true,
      isNewArrival: true,
      isFeatured: true,
      isTrending: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-mehrunnisa-maroon',
      name: 'Mehrunnisa Deep Maroon Zari Chiffon Suit',
      slug: 'mehrunnisa-deep-maroon-zari-chiffon-suit',
      description:
        'Commanding festive elegance in rich deep maroon pure chiffon. Hand-finished with antique gold tilla, delicate sitara highlights, and a sweeping scalloped dupatta bordered with heritage Mughal motifs.',
      fabricDetails:
        'Shirt: Pure Crinkle Chiffon with Silk Slip · Dupatta: Heavy Scalloped Embroidered Chiffon · Trouser: Raw Silk',
      price: 18500,
      discountPrice: 15900,
      images: [IMG_MAROON_CHIFFON, IMG_ATELIER],
      categoryIds: ['cat-chiffon', 'cat-embroidered', 'cat-3piece', 'cat-luxury', 'cat-formal', 'cat-stitched'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Deep Maroon', 'Antique Gold'],
      stock: 14,
      isAvailable: true,
      isBestSeller: true,
      isNewArrival: true,
      isFeatured: true,
      isTrending: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-noor-ivory',
      name: 'Noor-e-Jahan Ivory Pearl Luxury 3-Piece',
      slug: 'noor-e-jahan-ivory-pearl-luxury-3-piece',
      description:
        'Ethereal ivory white cotton-net couture woven with champagne gold zari motifs and hand-tacked pearl edging along the neckline, sleeves, and trailing organza dupatta.',
      fabricDetails:
        'Shirt: Embroidered Cotton-Net with Organza Borders · Dupatta: Pearl-Edged Pure Organza · Trouser: Jamawar',
      price: 22000,
      discountPrice: null,
      images: [IMG_IVORY_LUXURY, IMG_HERO],
      categoryIds: ['cat-embroidered', 'cat-3piece', 'cat-luxury', 'cat-formal', 'cat-stitched'],
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Ivory White', 'Champagne Gold'],
      stock: 10,
      isAvailable: true,
      isBestSeller: true,
      isNewArrival: false,
      isFeatured: true,
      isTrending: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-chandni-cream',
      name: 'Chandni Cream & Rose 2-Piece Cotton Suit',
      slug: 'chandni-cream-rose-2-piece-cotton-suit',
      description:
        'Refined daytime dressing in breathable warm cream cotton cambric. Features classic paisley threadwork in dusty rose and olive tones across the front panel, cuffs, and trouser hem.',
      fabricDetails:
        'Shirt: Fine Combed Cotton Cambric · Trouser: Embroidered Straight Cotton Pants',
      price: 5400,
      discountPrice: 4650,
      images: [IMG_CREAM_COTTON, IMG_ATELIER],
      categoryIds: ['cat-cotton', 'cat-2piece', 'cat-casual', 'cat-stitched'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Warm Cream', 'Ivory'],
      stock: 32,
      isAvailable: true,
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: true,
      isTrending: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-zoya-blush-couture',
      name: 'Zoya Signature Blush Zari Organza Ensemble',
      slug: 'zoya-signature-blush-zari-organza-ensemble',
      description:
        'Our signature campaign silhouette uniting blush pink silk-lawn with delicate champagne gold borders and a statement jaal-embroidered dupatta designed for sunlit celebrations.',
      fabricDetails:
        'Shirt: Silk-Finish Lawn & Organza · Dupatta: Gold Zari Bordered Net · Trouser: Cotton Silk',
      price: 16800,
      discountPrice: 14500,
      images: [IMG_HERO, IMG_BLUSH_LAWN],
      categoryIds: ['cat-lawn', 'cat-embroidered', 'cat-3piece', 'cat-luxury', 'cat-formal'],
      sizes: ['Unstitched', 'S', 'M', 'L'],
      colors: ['Blush Pink', 'Soft Gold'],
      stock: 18,
      isAvailable: true,
      isBestSeller: true,
      isNewArrival: true,
      isFeatured: true,
      isTrending: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-mahnoor-unstitched',
      name: 'Mahnoor Heirloom Unstitched 3-Piece Lawn',
      slug: 'mahnoor-heirloom-unstitched-3-piece-lawn',
      description:
        'Generously cut unstitched luxury lawn fabric complete with embroidered front yoke, organza sleeve laces, dyed cotton trouser, and floral printed silk-chiffon dupatta for custom tailoring.',
      fabricDetails:
        'Unstitched 3-Piece · Lawn Shirt (3.0m) · Silk Chiffon Dupatta (2.5m) · Cambric Trouser (2.5m)',
      price: 7200,
      discountPrice: null,
      images: [IMG_ATELIER, IMG_BLUSH_LAWN],
      categoryIds: ['cat-lawn', 'cat-3piece', 'cat-unstitched', 'cat-casual'],
      sizes: ['Unstitched'],
      colors: ['Blush Pink', 'Ivory', 'Deep Maroon'],
      stock: 28,
      isAvailable: true,
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: false,
      isTrending: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const reviews: CustomerReview[] = [
    {
      id: 'rev-1',
      customerName: 'Ayesha Siddiqui',
      city: 'Lahore',
      productName: 'Gulbahar Blush Embroidered 3-Piece Lawn Suit',
      rating: 5,
      comment:
        'The Swiss lawn feels wonderfully airy and the blush embroidery looks even finer in person than in the photos. Ordering on WhatsApp took less than two minutes.',
      createdAt: now,
    },
    {
      id: 'rev-2',
      customerName: 'Hira Mansoor',
      city: 'Islamabad',
      productName: 'Mehrunnisa Deep Maroon Zari Chiffon Suit',
      rating: 5,
      comment:
        'Wore the deep maroon chiffon suit to my sister-in-law’s dholki. The scalloped dupatta drape and antique gold tilla work drew compliments all evening.',
      createdAt: now,
    },
    {
      id: 'rev-3',
      customerName: 'Zainab Tariq',
      city: 'Karachi',
      productName: 'Chandni Cream & Rose 2-Piece Cotton Suit',
      rating: 5,
      comment:
        'Neat stitching, true-to-size tailoring, and prompt delivery right to DHA Karachi. The cotton fabric holds its crisp fall even after washing.',
      createdAt: now,
    },
  ];

  const settings: StoreSettings = {
    storeName: 'CHUNARIYA',
    tagline: 'Your Style, Your Elegance.',
    logoUrl: '',
    whatsappNumber: '923249660603',
    phoneNumber: '03249660603',
    emailAddress: 'care@chunariya.pk',
    storeAddress: '',
    instagramUrl: 'https://instagram.com',
    facebookUrl: 'https://facebook.com',
    deliveryCharges: 250,
    freeDeliveryThreshold: 5000,
    currency: 'PKR',
    heroBannerUrl: IMG_HERO,
    heroHeadline: 'Discover Your Elegance with CHUNARIYA.',
    heroSubheadline:
      'Timeless Pakistani lawn, delicate chiffon, and heirloom embroidery tailored for modern grace.',
    craftsmanshipBannerUrl: IMG_ATELIER,
    aboutUsContent:
      'Founded in Lahore with a deep reverence for Pakistani textile heritage, CHUNARIYA crafts women’s ensembles that balance artisanal embroidery with contemporary, wearable elegance.\n\nEvery collection—from breathable summer Swiss lawn to hand-finished formal chiffon—is thoughtfully designed in blush pinks, warm ivories, creams, and rich maroons accented with antique gold zari. Whether you prefer bespoke unstitched yardage or ready-to-wear silhouettes, our atelier delivers effortless luxury directly to your doorstep.',
  };

  return {
    categories,
    products,
    orders: [],
    reviews,
    contactMessages: [],
    settings,
    adminAccount: null,
    adminAccounts: [],
    activeAdminSession: null,
    orderCounter: 1001,
  };
}

function ensureDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function readDb(): DatabaseSchema {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialData();
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    const defaults = createInitialData();
    const rawAccounts = Array.isArray(parsed.adminAccounts) ? parsed.adminAccounts : [];
    const migratedAccounts: AdminAccount[] = rawAccounts.map((acc, idx) => ({
      id: acc.id || `adm-${idx + 1}`,
      name: acc.name || (idx === 0 ? 'Primary Admin' : `Admin ${idx + 1}`),
      email: String(acc.email || '').trim().toLowerCase(),
      role: acc.role || (idx === 0 ? 'Primary Admin' : 'Co-Admin'),
      salt: acc.salt,
      passwordHash: acc.passwordHash,
      createdAt: acc.createdAt || new Date().toISOString(),
    }));
    if (migratedAccounts.length === 0 && parsed.adminAccount && parsed.adminAccount.email) {
      migratedAccounts.push({
        id: parsed.adminAccount.id || 'adm-1',
        name: parsed.adminAccount.name || 'Primary Admin',
        email: String(parsed.adminAccount.email).trim().toLowerCase(),
        role: parsed.adminAccount.role || 'Primary Admin',
        salt: parsed.adminAccount.salt,
        passwordHash: parsed.adminAccount.passwordHash,
        createdAt: parsed.adminAccount.createdAt || new Date().toISOString(),
      });
    }
    return {
      categories: parsed.categories ?? defaults.categories,
      products: parsed.products ?? defaults.products,
      orders: parsed.orders ?? [],
      reviews: parsed.reviews ?? defaults.reviews,
      contactMessages: parsed.contactMessages ?? [],
      settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
      adminAccount: migratedAccounts[0] ?? null,
      adminAccounts: migratedAccounts,
      activeAdminSession: parsed.activeAdminSession ?? null,
      orderCounter: typeof parsed.orderCounter === 'number' ? parsed.orderCounter : 1001,
    };
  } catch {
    const initial = createInitialData();
    writeDb(initial);
    return initial;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDirectories();
  const tempFile = `${DB_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DB_FILE);
}

export function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
