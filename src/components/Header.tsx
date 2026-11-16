import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';

export function Header() {
  const {
    categories,
    settings,
    currentPath,
    navigate,
    cartCount,
    setCartOpen,
    wishlistIds,
  } = useStore();

  const [bannerVisible, setBannerVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    setCategoriesOpen(false);
    navigate(path);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setMobileMenuOpen(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/shop');
  };

  const cleanPath = currentPath.split('?')[0];
  const isActive = (path: string) =>
    cleanPath === path
      ? 'text-[#6B1D2F] border-b border-[#C59B5F]'
      : 'text-[#23191B] hover:text-[#6B1D2F]';

  return (
    <header className="sticky top-0 z-40 bg-[#FCF9F6]/95 backdrop-blur-md border-b border-[#E7DCD5]">
      {bannerVisible && (
        <div className="bg-[#6B1D2F] text-[#FCF9F6] text-xs px-4 py-1.5 flex items-center justify-between gap-4">
          <div className="w-4 hidden sm:block" />
          <p className="text-center truncate tracking-wide">
            {settings.freeDeliveryThreshold > 0
              ? `Complimentary nationwide delivery on orders over ${formatPrice(settings.freeDeliveryThreshold, settings.currency)} · Direct WhatsApp checkout`
              : `${settings.tagline} · Direct WhatsApp checkout`}
          </p>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            aria-label="Dismiss announcement"
            className="text-[#FCF9F6]/80 hover:text-white p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Mobile Menu Trigger + Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 -ml-2 text-[#23191B] hover:text-[#6B1D2F] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/');
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#6B1D2F]"
          >
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt={settings.storeName}
                referrerPolicy="no-referrer"
                className="h-8 w-8 object-contain"
              />
            )}
            <span className="font-display text-2xl sm:text-[28px] font-semibold tracking-[0.14em] text-[#23191B]">
              {settings.storeName}
            </span>
          </a>
        </div>

        {/* Desktop Single-Line Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6 text-[13px] font-medium tracking-wide"
        >
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${isActive('/')}`}
          >
            Home
          </a>
          <a
            href="/new-arrivals"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/new-arrivals');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${isActive('/new-arrivals')}`}
          >
            New Arrivals
          </a>
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/shop');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${isActive('/shop')}`}
          >
            All Products
          </a>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCategoriesOpen((prev) => !prev)}
              aria-expanded={categoriesOpen}
              className="py-1 flex items-center gap-1 text-[#23191B] hover:text-[#6B1D2F] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Categories</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${categoriesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {categoriesOpen && (
              <div className="absolute left-0 top-full mt-3 w-72 bg-white border border-[#E7DCD5] shadow-xl py-3 z-50">
                <div className="px-4 pb-2 mb-2 border-b border-[#E7DCD5] flex items-center justify-between">
                  <span className="font-display text-base font-semibold text-[#23191B]">
                    Shop by Category
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNav('/shop')}
                    className="text-xs text-[#6B1D2F] hover:underline whitespace-nowrap"
                  >
                    View All
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#F6EFEA]">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleNav(`/collections/${cat.slug}`)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#23191B] hover:bg-[#FAF0EE] hover:text-[#6B1D2F] transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a
            href="/best-sellers"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/best-sellers');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${isActive('/best-sellers')}`}
          >
            Best Sellers
          </a>
          <a
            href="/sale"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/sale');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              cleanPath === '/sale'
                ? 'text-[#6B1D2F] border-b border-[#C59B5F]'
                : 'text-[#6B1D2F] hover:text-[#4F1321]'
            }`}
          >
            Sale
          </a>
          <a
            href="/about"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/about');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${isActive('/about')}`}
          >
            About Us
          </a>
          <a
            href="/contact"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/contact');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${isActive('/contact')}`}
          >
            Contact Us
          </a>
        </nav>

        {/* Actions: Search, Wishlist, Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Search products"
            className="p-2.5 text-[#23191B] hover:text-[#6B1D2F] transition-colors"
          >
            <Search className="w-5 h-5" strokeWidth={1.6} />
          </button>

          <a
            href="/wishlist"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/wishlist');
            }}
            aria-label="Wishlist"
            className="relative p-2.5 text-[#23191B] hover:text-[#6B1D2F] transition-colors"
          >
            <Heart className="w-5 h-5" strokeWidth={1.6} />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1.5 right-1 min-w-[16px] h-4 px-1 bg-[#6B1D2F] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                {wishlistIds.length}
              </span>
            )}
          </a>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping bag"
            className="relative flex items-center gap-2 pl-2.5 pr-3 py-2 text-[#23191B] hover:text-[#6B1D2F] transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.6} />
            <span className="hidden sm:inline text-xs font-medium tracking-wide">Bag</span>
            <span className="min-w-[20px] h-5 px-1.5 bg-[#6B1D2F] text-white text-[11px] font-semibold flex items-center justify-center tabular-nums">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-[#E7DCD5] bg-white">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3"
          >
            <Search className="w-4 h-4 text-[#6E5D60] shrink-0" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lawn suits, chiffon formals, embroidered 3-piece..."
              className="flex-1 bg-transparent text-sm text-[#23191B] placeholder:text-[#6E5D60] focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#6B1D2F] text-white text-xs font-medium hover:bg-[#4F1321] transition-colors whitespace-nowrap shrink-0"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="p-1.5 text-[#6E5D60] hover:text-[#23191B]"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/45"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-[#FCF9F6] h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-[#E7DCD5] flex items-center justify-between">
              <span className="font-display text-2xl font-semibold tracking-[0.12em] text-[#23191B]">
                {settings.storeName}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 text-[#23191B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-[#E7DCD5]">
              <div className="flex items-center border border-[#E7DCD5] bg-white px-3 py-2 gap-2">
                <Search className="w-4 h-4 text-[#6E5D60]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search suits..."
                  className="flex-1 text-sm bg-transparent focus:outline-none"
                />
              </div>
            </form>

            <nav className="p-4 space-y-1 text-sm font-medium">
              {[
                { label: 'Home', path: '/' },
                { label: 'New Arrivals', path: '/new-arrivals' },
                { label: 'All Products', path: '/shop' },
                { label: 'Best Sellers', path: '/best-sellers' },
                { label: 'Sale', path: '/sale' },
                { label: 'Wishlist', path: '/wishlist' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact Us', path: '/contact' },
              ].map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => handleNav(link.path)}
                  className="w-full text-left px-3 py-2.5 text-[#23191B] hover:bg-[#FAF0EE] hover:text-[#6B1D2F] transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="px-4 py-3 border-t border-[#E7DCD5]">
              <p className="px-3 pb-2 text-xs font-semibold tracking-wider uppercase text-[#6E5D60]">
                Categories
              </p>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleNav(`/collections/${cat.slug}`)}
                    className="w-full text-left px-3 py-2 text-sm text-[#23191B] hover:bg-[#FAF0EE] hover:text-[#6B1D2F] transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto p-4 border-t border-[#E7DCD5]">
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className="w-full py-2.5 px-4 border border-[#E7DCD5] text-xs font-medium text-[#6E5D60] hover:text-[#23191B] hover:border-[#23191B] transition-colors"
              >
                Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
