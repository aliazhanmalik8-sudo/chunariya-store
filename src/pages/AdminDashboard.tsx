import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgePercent,
  Boxes,
  Check,
  Eye,
  EyeOff,
  FolderTree,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  PhoneCall,
  RefreshCw,
  Settings,
  ShoppingCart,
  Tag,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type {
  AdminAuthStatus,
  AdminUserSummary,
  Category,
  ContactMessage,
  CustomerSummary,
  Order,
  Product,
  StoreSettings,
} from '../types';
import { adminFetch, clearAdminToken, setAdminToken } from '../lib/adminApi';
import {
  BulkCatalogEditorPanel,
  ManageCategoriesPanel,
  ManageProductsPanel,
} from '../components/admin/AdminCatalogPanels';
import {
  AdminOverviewPanel,
  AdminTeamPanel,
  ContactInfoPanel,
  ManageCustomersPanel,
  ManageOrdersPanel,
  WebsiteSettingsPanel,
} from '../components/admin/AdminOperationsPanels';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'prices'
  | 'discounts'
  | 'stock'
  | 'settings'
  | 'contact'
  | 'team';

export function AdminDashboard() {
  const { navigate, refreshStorefront } = useStore();

  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [addSecondAdminOnSetup, setAddSecondAdminOnSetup] = useState(false);
  const [secondName, setSecondName] = useState('');
  const [secondEmail, setSecondEmail] = useState('');
  const [secondPassword, setSecondPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminUserSummary[]>([]);
  const [adminSettings, setAdminSettings] = useState<StoreSettings | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadAuthStatus = useCallback(async () => {
    try {
      const data = await adminFetch<AdminAuthStatus>('/api/admin/auth-status');
      setAuthStatus(data);
    } catch {
      setAuthStatus({
        configured: false,
        authenticated: false,
        adminEmail: null,
        adminName: null,
        usesEnvCredentials: false,
      });
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await adminFetch<{
        categories: Category[];
        products: Product[];
        orders: Order[];
        customers: CustomerSummary[];
        contactMessages: ContactMessage[];
        adminAccounts: AdminUserSummary[];
        settings: StoreSettings;
      }>('/api/admin/bootstrap');
      setCategories(data.categories);
      setProducts(data.products);
      setOrders(data.orders);
      setCustomers(data.customers);
      setContactMessages(data.contactMessages || []);
      setAdminAccounts(data.adminAccounts || []);
      setAdminSettings(data.settings);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Session expired. Please sign in again.');
      await loadAuthStatus();
    } finally {
      setLoadingData(false);
    }
  }, [loadAuthStatus]);

  useEffect(() => {
    void loadAuthStatus();
  }, [loadAuthStatus]);

  useEffect(() => {
    if (authStatus?.authenticated) {
      void loadAdminData();
    }
  }, [authStatus?.authenticated, loadAdminData]);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadAdminData(), refreshStorefront()]);
  }, [loadAdminData, refreshStorefront]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authStatus) return;
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const endpoint = authStatus.configured ? '/api/admin/login' : '/api/admin/setup';
      const payload = authStatus.configured
        ? { email: email.trim(), password }
        : {
            email: email.trim(),
            password,
            ...(addSecondAdminOnSetup && (secondEmail.trim() || secondPassword)
              ? {
                  secondName: secondName.trim() || 'Co-Admin',
                  secondEmail: secondEmail.trim(),
                  secondPassword,
                }
              : {}),
          };

      const data = await adminFetch<{
        authenticated: boolean;
        adminEmail: string;
        adminName?: string;
        token?: string;
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data.token) {
        setAdminToken(data.token);
      }
      setPassword('');
      setSecondPassword('');
      setAuthStatus({
        configured: true,
        authenticated: true,
        adminEmail: data.adminEmail,
        adminName: data.adminName ?? null,
        usesEnvCredentials: authStatus.usesEnvCredentials,
      });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
      if (!authStatus.configured) {
        await loadAuthStatus();
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } finally {
      clearAdminToken();
      await loadAuthStatus();
    }
  };

  if (!authStatus) {
    return (
      <div className="min-h-screen bg-[#FCF9F6] flex items-center justify-center p-6 text-sm text-[#6E5D60]">
        Loading Admin Portal...
      </div>
    );
  }

  // Auth Gate (First-Time Store Owner Setup or Login)
  if (!authStatus.authenticated) {
    return (
      <div className="min-h-screen bg-[#FCF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E7DCD5] p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-11 h-11 bg-[#FAF0EE] border border-[#E7DCD5] flex items-center justify-center mx-auto mb-3 text-[#6B1D2F]">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs tracking-[0.2em] uppercase text-[#6B1D2F]">CHUNARIYA</p>
            <h1 className="font-display text-3xl font-semibold text-[#23191B] mt-1">
              {authStatus.configured ? 'Admin Dashboard Login' : 'Create Store Admin Account'}
            </h1>
            <p className="text-xs text-[#6E5D60] mt-2">
              {authStatus.configured
                ? 'Sign in with your administrator email and password to manage products, categories, orders, and settings.'
                : 'Welcome! Create your administrator email and password below to lock and access your CHUNARIYA dashboard.'}
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@chunariya.pk"
                className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                {authStatus.configured ? 'Password' : 'Create Password (min 6 characters)'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={authStatus.configured ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#6B1D2F]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E5D60] hover:text-[#23191B] p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!authStatus.configured && !authStatus.usesEnvCredentials && (
              <div className="pt-1 border-t border-[#F6EFEA]">
                <button
                  type="button"
                  onClick={() => setAddSecondAdminOnSetup((prev) => !prev)}
                  className="text-xs font-medium text-[#6B1D2F] hover:underline inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    {addSecondAdminOnSetup
                      ? 'Hide 2nd Admin Account Fields'
                      : '+ Also add a 2nd admin login now (for 2 people at once)'}
                  </span>
                </button>

                {addSecondAdminOnSetup && (
                  <div className="mt-3 p-3.5 bg-[#FAF0EE] border border-[#E7DCD5] space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B1D2F]">
                      2nd Admin Login (Co-Admin)
                    </p>
                    <input
                      type="text"
                      value={secondName}
                      onChange={(e) => setSecondName(e.target.value)}
                      placeholder="Partner / Manager Name (optional)"
                      className="w-full border border-[#E7DCD5] bg-white px-3 py-2 text-xs focus:outline-none focus:border-[#6B1D2F]"
                    />
                    <input
                      type="email"
                      required={addSecondAdminOnSetup}
                      value={secondEmail}
                      onChange={(e) => setSecondEmail(e.target.value)}
                      placeholder="partner@chunariya.pk"
                      className="w-full border border-[#E7DCD5] bg-white px-3 py-2 text-xs focus:outline-none focus:border-[#6B1D2F]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={addSecondAdminOnSetup}
                      minLength={6}
                      value={secondPassword}
                      onChange={(e) => setSecondPassword(e.target.value)}
                      placeholder="2nd Admin Password (min 6 chars)"
                      className="w-full border border-[#E7DCD5] bg-white px-3 py-2 text-xs focus:outline-none focus:border-[#6B1D2F]"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#4F1321] transition-colors disabled:opacity-60"
            >
              {authSubmitting
                ? 'Please wait...'
                : authStatus.configured
                  ? 'Sign In to Dashboard'
                  : 'Create Admin & Open Dashboard'}
            </button>

            <p className="text-[11px] text-center text-[#6E5D60]">
              Two or more people can stay logged into the dashboard at the same time from different
              devices.
            </p>
          </form>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 w-full text-center text-xs text-[#6E5D60] hover:text-[#6B1D2F] inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Storefront</span>
          </button>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Manage Products', icon: Package },
    { id: 'categories', label: 'Manage Categories', icon: FolderTree },
    { id: 'orders', label: 'Manage Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Manage Customers', icon: Users },
    { id: 'prices', label: 'Manage Prices', icon: Tag },
    { id: 'discounts', label: 'Manage Discounts', icon: BadgePercent },
    { id: 'stock', label: 'Manage Stock', icon: Boxes },
    { id: 'settings', label: 'Website Settings', icon: Settings },
    { id: 'contact', label: 'Contact Information', icon: PhoneCall },
    { id: 'team', label: 'Admin Logins (Team)', icon: UserPlus },
  ];

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FCF9F6] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#23191B] text-[#FCF9F6] flex-col border-r border-[#3B2C2F]">
        <div className="p-6 border-b border-[#3B2C2F]">
          <p className="font-display text-2xl font-semibold tracking-[0.14em] text-white">
            CHUNARIYA
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#DFC394] mt-1">
            Admin Console
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium transition-colors text-left ${
                  active
                    ? 'bg-[#6B1D2F] text-white'
                    : 'text-[#D6C9CB] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#3B2C2F] space-y-2 text-xs">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2 px-3 border border-white/20 text-[#FCF9F6] hover:bg-white/10 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Live Store</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 text-[#D6C9CB] hover:text-white flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-72 bg-[#23191B] text-white h-full flex flex-col">
            <div className="p-5 border-b border-[#3B2C2F] flex items-center justify-between">
              <span className="font-display text-2xl font-semibold tracking-wider">CHUNARIYA</span>
              <button type="button" onClick={() => setMobileSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium text-left ${
                      activeTab === item.id ? 'bg-[#6B1D2F] text-white' : 'text-[#D6C9CB]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#3B2C2F] space-y-2 text-xs">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-2 border border-white/20"
              >
                View Live Store
              </button>
              <button type="button" onClick={handleLogout} className="w-full py-2 text-[#D6C9CB]">
                Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-[#E7DCD5] px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2 -ml-2 text-[#23191B]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs text-[#6E5D60]">
              Admin /{' '}
              <strong className="text-[#23191B]">
                {navItems.find((n) => n.id === activeTab)?.label}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <button
              type="button"
              onClick={() => void reloadAll()}
              disabled={loadingData}
              className="px-2.5 py-1.5 border border-[#E7DCD5] text-[#23191B] hover:border-[#6B1D2F] inline-flex items-center gap-1.5 disabled:opacity-60"
              title="Sync latest orders and catalog updates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <span className="hidden sm:inline text-[#6E5D60]">
              {authStatus.adminName ? `${authStatus.adminName} (${authStatus.adminEmail})` : authStatus.adminEmail}
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="lg:hidden text-[#6B1D2F] font-medium"
            >
              Storefront
            </button>
          </div>
        </header>

        {toast && (
          <div className="mx-4 sm:mx-8 mt-4 p-3 bg-[#1E7E45] text-white text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toast}</span>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-[1200px] w-full">
          {loadingData && !adminSettings ? (
            <p className="text-sm text-[#6E5D60]">Loading store management data...</p>
          ) : (
            adminSettings && (
              <>
                {activeTab === 'overview' && (
                  <AdminOverviewPanel
                    products={products}
                    orders={orders}
                    customers={customers}
                    currency={adminSettings.currency}
                    onNavigateTab={(t) => setActiveTab(t as AdminTab)}
                  />
                )}
                {activeTab === 'products' && (
                  <ManageProductsPanel
                    products={products}
                    categories={categories}
                    currency={adminSettings.currency}
                    onReload={reloadAll}
                    notify={notify}
                  />
                )}
                {activeTab === 'categories' && (
                  <ManageCategoriesPanel
                    categories={categories}
                    products={products}
                    onReload={reloadAll}
                    notify={notify}
                  />
                )}
                {activeTab === 'orders' && (
                  <ManageOrdersPanel orders={orders} onReload={reloadAll} notify={notify} />
                )}
                {activeTab === 'customers' && (
                  <ManageCustomersPanel
                    customers={customers}
                    currency={adminSettings.currency}
                  />
                )}
                {activeTab === 'prices' && (
                  <BulkCatalogEditorPanel
                    mode="prices"
                    products={products}
                    currency={adminSettings.currency}
                    onReload={reloadAll}
                    notify={notify}
                  />
                )}
                {activeTab === 'discounts' && (
                  <BulkCatalogEditorPanel
                    mode="discounts"
                    products={products}
                    currency={adminSettings.currency}
                    onReload={reloadAll}
                    notify={notify}
                  />
                )}
                {activeTab === 'stock' && (
                  <BulkCatalogEditorPanel
                    mode="stock"
                    products={products}
                    currency={adminSettings.currency}
                    onReload={reloadAll}
                    notify={notify}
                  />
                )}
                {activeTab === 'settings' && (
                  <WebsiteSettingsPanel
                    settings={adminSettings}
                    onReload={reloadAll}
                    notify={notify}
                    usesEnvCredentials={authStatus.usesEnvCredentials}
                  />
                )}
                {activeTab === 'contact' && (
                  <ContactInfoPanel
                    settings={adminSettings}
                    messages={contactMessages}
                    onReload={reloadAll}
                    notify={notify}
                  />
                )}
                {activeTab === 'team' && (
                  <AdminTeamPanel
                    adminAccounts={adminAccounts}
                    currentAdminEmail={authStatus.adminEmail}
                    usesEnvCredentials={authStatus.usesEnvCredentials}
                    onReload={reloadAll}
                    notify={notify}
                  />
                )}
              </>
            )
          )}
        </main>
      </div>
    </div>
  );
}
