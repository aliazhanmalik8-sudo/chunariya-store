import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  ContactMessage,
  CustomerSummary,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
} from '../../types';
import { buildWhatsappChatUrl, formatPrice } from '../../lib/format';
import { adminFetch, setAdminToken, uploadAdminImage } from '../../lib/adminApi';
import { SmartImage } from '../SmartImage';

export function AdminOverviewPanel({
  products,
  orders,
  customers,
  currency,
  onNavigateTab,
}: {
  products: Product[];
  orders: Order[];
  customers: CustomerSummary[];
  currency: string;
  onNavigateTab: (tab: string) => void;
}) {
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-[#23191B]">Dashboard Overview</h2>
        <p className="text-xs text-[#6E5D60] mt-1">
          Live snapshot of your CHUNARIYA store catalog, orders, and inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Order Value', value: formatPrice(totalRevenue, currency) },
          { label: 'Total Orders', value: String(orders.length) },
          { label: 'Pending Orders', value: String(pendingOrders) },
          { label: 'Active Products', value: String(products.filter((p) => p.isAvailable).length) },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-[#E7DCD5] p-5">
            <p className="text-xs uppercase tracking-wider text-[#6E5D60]">{kpi.label}</p>
            <p className="font-display text-3xl font-semibold text-[#23191B] mt-2 tabular-nums">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E7DCD5] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl font-semibold text-[#23191B]">Recent Orders</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-[#6B1D2F] hover:underline"
            >
              View All Orders
            </button>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-[#6E5D60] py-6">
              No website orders submitted yet. Orders placed via WhatsApp checkout appear here
              automatically.
            </p>
          ) : (
            <div className="divide-y divide-[#E7DCD5]">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-[#23191B]">
                      {o.orderNumber} · {o.customerName}
                    </p>
                    <p className="text-xs text-[#6E5D60]">
                      {o.city} · {o.status}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(o.totalAmount, o.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E7DCD5] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-semibold text-[#23191B]">Quick Actions</h3>
            <span className="text-xs text-[#6E5D60] tabular-nums">
              {customers.length} customers
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="p-3.5 border border-[#E7DCD5] text-left hover:border-[#6B1D2F] transition-colors"
            >
              <Package className="w-4 h-4 text-[#6B1D2F] mb-1.5" />
              <p className="text-xs font-semibold text-[#23191B]">Add / Edit Suits</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('categories')}
              className="p-3.5 border border-[#E7DCD5] text-left hover:border-[#6B1D2F] transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[#6B1D2F] mb-1.5" />
              <p className="text-xs font-semibold text-[#23191B]">Manage Categories</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('contact')}
              className="p-3.5 border border-[#E7DCD5] text-left hover:border-[#6B1D2F] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#6B1D2F] mb-1.5" />
              <p className="text-xs font-semibold text-[#23191B]">Update WhatsApp & Contact</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className="p-3.5 border border-[#E7DCD5] text-left hover:border-[#6B1D2F] transition-colors"
            >
              <Upload className="w-4 h-4 text-[#6B1D2F] mb-1.5" />
              <p className="text-xs font-semibold text-[#23191B]">Change Banner & Logo</p>
            </button>
          </div>

          {lowStock.length > 0 && (
            <div className="p-3.5 bg-[#FAF0EE] border border-[#E7DCD5] flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-[#6B1D2F] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#23191B]">
                  {lowStock.length} product(s) running low on stock
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab('stock')}
                  className="text-[#6B1D2F] underline mt-0.5"
                >
                  Review inventory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ManageOrdersPanel({
  orders,
  onReload,
  notify,
}: {
  orders: Order[];
  onReload: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setError(null);
    try {
      await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await onReload();
      notify(`Order marked as ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Delete order ${orderNumber}?`)) return;
    setError(null);
    try {
      await adminFetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      await onReload();
      notify('Order deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order.');
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'All' && o.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-[#23191B]">Manage Orders</h2>
        <p className="text-xs text-[#6E5D60] mt-1">
          Orders submitted through the CHUNARIYA checkout form are saved here. Update statuses once
          confirmed on WhatsApp.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 text-xs font-medium border ${
                statusFilter === st
                  ? 'bg-[#6B1D2F] text-white border-[#6B1D2F]'
                  : 'bg-white text-[#23191B] border-[#E7DCD5]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#E7DCD5] px-3 py-1.5 w-full sm:w-64">
          <Search className="w-4 h-4 text-[#6E5D60]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order # or customer..."
            className="flex-1 text-xs bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E7DCD5] p-12 text-center text-sm text-[#6E5D60]">
          No orders match your current filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white border border-[#E7DCD5] p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#F6EFEA] pb-4">
                <div>
                  <p className="font-display text-xl font-semibold text-[#23191B]">
                    {order.orderNumber} — {order.customerName}
                  </p>
                  <p className="text-xs text-[#6E5D60] mt-1">
                    {new Date(order.createdAt).toLocaleString()} · Phone: {order.phone}
                    {order.whatsappNumber && order.whatsappNumber !== order.phone
                      ? ` · WhatsApp: ${order.whatsappNumber}`
                      : ''}
                  </p>
                  <p className="text-xs text-[#23191B] mt-1">
                    {order.address}, {order.city}
                    {order.postalCode ? ` (${order.postalCode})` : ''}
                  </p>
                  {order.notes && (
                    <p className="text-xs text-[#6B1D2F] mt-1">Notes: {order.notes}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                    className="border border-[#E7DCD5] bg-[#FCF9F6] px-3 py-1.5 text-xs font-medium"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>

                  <a
                    href={buildWhatsappChatUrl(
                      order.whatsappNumber || order.phone,
                      `Assalam-o-Alaikum ${order.customerName}, regarding your CHUNARIYA order ${order.orderNumber} (${order.status}).`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 border border-[#1E7E45]/40 text-[#1E7E45] text-xs font-medium inline-flex items-center gap-1 hover:bg-[#1E7E45]/10"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => deleteOrder(order.id, order.orderNumber)}
                    className="p-1.5 text-[#6E5D60] hover:text-red-700"
                    title="Delete order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-[#23191B]">
                      {item.quantity} × <strong>{item.name}</strong> ({item.size}, {item.color})
                    </span>
                    <span className="tabular-nums text-[#23191B]">
                      {formatPrice(item.lineTotal, order.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#F6EFEA] flex flex-wrap justify-between text-xs text-[#6E5D60]">
                <span>
                  Subtotal: {formatPrice(order.subtotal, order.currency)} · Delivery:{' '}
                  {order.deliveryCharges === 0
                    ? 'FREE'
                    : formatPrice(order.deliveryCharges, order.currency)}
                </span>
                <span className="text-sm font-semibold text-[#23191B] tabular-nums">
                  Total: {formatPrice(order.totalAmount, order.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ManageCustomersPanel({
  customers,
  currency,
}: {
  customers: CustomerSummary[];
  currency: string;
}) {
  const [search, setSearch] = useState('');

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    const headers = ['Name', 'Phone', 'WhatsApp', 'City', 'Address', 'Orders', 'Total Spent'];
    const rows = filtered.map((c) => [
      c.name,
      c.phone,
      c.whatsappNumber,
      c.city,
      c.address.replace(/"/g, '""'),
      String(c.orderCount),
      String(c.totalSpent),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chunariya-customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-[#23191B]">Manage Customers</h2>
          <p className="text-xs text-[#6E5D60] mt-1">
            Customer directory automatically recorded from website orders.
          </p>
        </div>
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 border border-[#23191B] text-xs font-medium uppercase inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white border border-[#E7DCD5] px-3.5 py-2 max-w-md">
        <Search className="w-4 h-4 text-[#6E5D60]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or city..."
          className="flex-1 text-sm bg-transparent focus:outline-none"
        />
      </div>

      <div className="bg-white border border-[#E7DCD5] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF0EE] border-b border-[#E7DCD5] text-xs uppercase tracking-wider text-[#6E5D60]">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Phone / WhatsApp</th>
              <th className="py-3 px-4">City & Address</th>
              <th className="py-3 px-4 text-right">Orders</th>
              <th className="py-3 px-4 text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7DCD5]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-[#6E5D60]">
                  No customers recorded yet.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.key}>
                  <td className="py-3 px-4 font-medium text-[#23191B]">{c.name}</td>
                  <td className="py-3 px-4 text-xs text-[#6E5D60]">
                    {c.phone}
                    {c.whatsappNumber && c.whatsappNumber !== c.phone && (
                      <span className="block">WA: {c.whatsappNumber}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#6E5D60]">
                    <span className="font-medium text-[#23191B]">{c.city}</span> — {c.address}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">{c.orderCount}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold">
                    {formatPrice(c.totalSpent, currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WebsiteSettingsPanel({
  settings,
  onReload,
  notify,
  usesEnvCredentials,
}: {
  settings: StoreSettings;
  onReload: () => Promise<void>;
  notify: (msg: string) => void;
  usesEnvCredentials: boolean;
}) {
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      await onReload();
      notify('Website settings saved and published live!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save website settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (
    field: 'logoUrl' | 'heroBannerUrl' | 'craftsmanshipBannerUrl',
    file: File,
  ) => {
    setUploadingField(field);
    setError(null);
    try {
      const url = await uploadAdminImage(file);
      setForm((prev) => ({ ...prev, [field]: url }));
      notify('Image uploaded — click Save Website Settings to publish.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploadingField(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    try {
      const data = await adminFetch<{ token?: string }>('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (data.token) setAdminToken(data.token);
      setCurrentPassword('');
      setNewPassword('');
      setPwdMessage('Admin password updated successfully.');
    } catch (err) {
      setPwdMessage(err instanceof Error ? err.message : 'Could not update password.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-display text-3xl font-semibold text-[#23191B]">Website Settings</h2>
        <p className="text-xs text-[#6E5D60] mt-1">
          Customize your store name, logo, homepage banner, currency, delivery rates, and About Us
          story without editing code.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-[#E7DCD5] p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Store Name
            </label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Brand Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        {/* Store Logo & Hero Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-[#F6EFEA] pt-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider">Store Logo</label>
              <label className="px-3 py-1.5 bg-[#6B1D2F] text-white text-xs cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === 'logoUrl' ? 'Uploading...' : 'Upload Logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload('logoUrl', f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="Optional logo URL (leave blank for wordmark)"
              className="w-full border border-[#E7DCD5] px-3 py-2 text-xs"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider">
                Homepage Hero Banner
              </label>
              <label className="px-3 py-1.5 bg-[#6B1D2F] text-white text-xs cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {uploadingField === 'heroBannerUrl' ? 'Uploading...' : 'Upload Banner'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload('heroBannerUrl', f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <div className="h-24 border border-[#E7DCD5] overflow-hidden bg-[#F6EFEA]">
              <SmartImage
                src={form.heroBannerUrl}
                alt="Hero banner preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Craftsmanship Image */}
        <div className="space-y-2 border-t border-[#F6EFEA] pt-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider">
              Atelier Craftsmanship / About Banner
            </label>
            <label className="px-3 py-1.5 bg-[#6B1D2F] text-white text-xs cursor-pointer inline-flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>
                {uploadingField === 'craftsmanshipBannerUrl' ? 'Uploading...' : 'Upload Photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload('craftsmanshipBannerUrl', f);
                }}
                className="hidden"
              />
            </label>
          </div>
          <div className="h-24 w-48 border border-[#E7DCD5] overflow-hidden bg-[#F6EFEA]">
            <SmartImage
              src={form.craftsmanshipBannerUrl}
              alt="Craftsmanship preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Hero Headline
            </label>
            <input
              type="text"
              value={form.heroHeadline}
              onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Hero Subheadline
            </label>
            <input
              type="text"
              value={form.heroSubheadline}
              onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#F6EFEA] pt-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm bg-white"
            >
              <option value="PKR">PKR (Pakistani Rupee)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED</option>
              <option value="SAR">SAR</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Delivery Charges ({form.currency})
            </label>
            <input
              type="number"
              min={0}
              value={form.deliveryCharges}
              onChange={(e) => setForm({ ...form, deliveryCharges: Number(e.target.value) })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Free Delivery Over (0 = off)
            </label>
            <input
              type="number"
              min={0}
              value={form.freeDeliveryThreshold}
              onChange={(e) => setForm({ ...form, freeDeliveryThreshold: Number(e.target.value) })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
            About Us Page Content
          </label>
          <textarea
            rows={5}
            value={form.aboutUsContent}
            onChange={(e) => setForm({ ...form, aboutUsContent: e.target.value })}
            className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving || Boolean(uploadingField)}
          className="px-7 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#4F1321] inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Website Settings'}</span>
        </button>
      </form>

      {!usesEnvCredentials && (
        <form
          onSubmit={handlePasswordChange}
          className="bg-white border border-[#E7DCD5] p-6 sm:p-8 space-y-4"
        >
          <h3 className="font-display text-2xl font-semibold text-[#23191B]">
            Change Admin Password
          </h3>
          {pwdMessage && <p className="text-xs text-[#6B1D2F]">{pwdMessage}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="password"
              required
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 border border-[#23191B] text-xs font-medium uppercase hover:bg-[#FAF0EE]"
          >
            Update Password
          </button>
        </form>
      )}
    </div>
  );
}

export function ContactInfoPanel({
  settings,
  messages,
  onReload,
  notify,
}: {
  settings: StoreSettings;
  messages: ContactMessage[];
  onReload: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    whatsappNumber: settings.whatsappNumber,
    phoneNumber: settings.phoneNumber,
    emailAddress: settings.emailAddress,
    storeAddress: settings.storeAddress,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      whatsappNumber: settings.whatsappNumber,
      phoneNumber: settings.phoneNumber,
      emailAddress: settings.emailAddress,
      storeAddress: settings.storeAddress,
      instagramUrl: settings.instagramUrl,
      facebookUrl: settings.facebookUrl,
    });
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      await onReload();
      notify('Footer & WhatsApp contact details updated on live site!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save contact details.');
    } finally {
      setSaving(false);
    }
  };

  const testLink = buildWhatsappChatUrl(
    form.whatsappNumber,
    `Test order link from ${settings.storeName} Admin Dashboard.`,
  );

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-display text-3xl font-semibold text-[#23191B]">
          Contact & WhatsApp Information
        </h2>
        <p className="text-xs text-[#6E5D60] mt-1">
          Changes saved here immediately update your website footer, Contact Us page, and WhatsApp
          checkout number.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-[#E7DCD5] p-6 sm:p-8 space-y-5">
        <div className="p-4 bg-[#FAF0EE] border border-[#E7DCD5] space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B1D2F]">
            Store WhatsApp Number (Used for Checkout Orders) *
          </label>
          <input
            type="text"
            required
            value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            placeholder="e.g. 923001234567"
            className="w-full border border-[#E7DCD5] bg-white px-3.5 py-2.5 text-sm font-medium"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E5D60]">
            <span>
              Include country code without + (for Pakistan: 92 followed by 3001234567).
            </span>
            <a
              href={testLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E7E45] font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Test WhatsApp Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Display Phone Number (Footer & Contact Page)
            </label>
            <input
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Email Address (Footer & Contact Page)
            </label>
            <input
              type="email"
              value={form.emailAddress}
              onChange={(e) => setForm({ ...form, emailAddress: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
            Store / Boutique Address (Footer & Contact Page)
          </label>
          <input
            type="text"
            value={form.storeAddress}
            onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
            className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Instagram Link
            </label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Facebook Link
            </label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
              className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-7 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#4F1321] disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Contact Information'}
        </button>
      </form>

      {messages.length > 0 && (
        <div className="bg-white border border-[#E7DCD5] p-6 space-y-4">
          <h3 className="font-display text-2xl font-semibold text-[#23191B]">
            Customer Contact Messages ({messages.length})
          </h3>
          <div className="divide-y divide-[#E7DCD5]">
            {messages.map((m) => (
              <div key={m.id} className="py-3 text-sm">
                <p className="font-semibold text-[#23191B]">
                  {m.name} {m.phone ? `· ${m.phone}` : ''} {m.email ? `· ${m.email}` : ''}
                </p>
                <p className="text-xs text-[#6E5D60] mt-1">{m.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
