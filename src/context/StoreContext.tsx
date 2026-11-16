import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  CartItem,
  Category,
  CustomerReview,
  Product,
  StoreSettings,
} from '../types';
import { getEffectivePrice } from '../lib/format';

interface StoreContextValue {
  categories: Category[];
  products: Product[];
  settings: StoreSettings;
  reviews: CustomerReview[];
  loading: boolean;
  error: string | null;
  refreshStorefront: () => Promise<void>;

  // Navigation & SEO
  currentPath: string;
  navigate: (path: string) => void;

  // Cart
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (cartKey: string) => void;
  updateCartQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const DEFAULT_SETTINGS: StoreSettings = {
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
  heroBannerUrl: '',
  heroHeadline: 'Discover Your Elegance with CHUNARIYA.',
  heroSubheadline:
    'Timeless Pakistani lawn, delicate chiffon, and heirloom embroidery tailored for modern grace.',
  aboutUsContent: '',
};

const CART_STORAGE_KEY = 'chunariya_cart_v1';
const WISHLIST_STORAGE_KEY = 'chunariya_wishlist_v1';

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPath, setCurrentPath] = useState<string>(
    () => window.location.pathname + window.location.search,
  );
  const [cartOpen, setCartOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const refreshStorefront = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/storefront?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load store catalog.');
      const data = (await res.json()) as {
        categories: Category[];
        products: Product[];
        settings: StoreSettings;
        reviews: CustomerReview[];
      };
      setCategories(data.categories || []);
      setProducts(data.products || []);
      if (data.settings) setSettings(data.settings);
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load store.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStorefront();
  }, [refreshStorefront]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    if (nextPath !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', nextPath);
      setCurrentPath(nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addToCart = useCallback(
    (product: Product, size: string, color: string, quantity = 1) => {
      const chosenSize = size || product.sizes[0] || 'Standard';
      const chosenColor = color || product.colors[0] || 'Default';
      const cartKey = `${product.id}__${chosenSize}__${chosenColor}`;
      const unitPrice = getEffectivePrice(product.price, product.discountPrice);

      setCart((prev) => {
        const existing = prev.find((i) => i.cartKey === cartKey);
        if (existing) {
          return prev.map((i) =>
            i.cartKey === cartKey
              ? {
                  ...i,
                  quantity: Math.min(Math.max(1, product.stock || 20), i.quantity + quantity),
                  unitPrice,
                  originalPrice: product.price,
                }
              : i,
          );
        }
        return [
          ...prev,
          {
            cartKey,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images[0] || '',
            size: chosenSize,
            color: chosenColor,
            unitPrice,
            originalPrice: product.price,
            quantity: Math.max(1, quantity),
            maxStock: Math.max(1, product.stock || 20),
          },
        ];
      });
    },
    [],
  );

  const removeFromCart = useCallback((cartKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  }, []);

  const updateCartQuantity = useCallback((cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: Math.min(Math.max(1, item.maxStock), quantity) }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );

  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (settings.freeDeliveryThreshold > 0 && subtotal >= settings.freeDeliveryThreshold) {
      return 0;
    }
    return settings.deliveryCharges;
  }, [cart.length, settings.deliveryCharges, settings.freeDeliveryThreshold, subtotal]);

  const totalAmount = subtotal + deliveryFee;

  const value: StoreContextValue = {
    categories,
    products,
    settings,
    reviews,
    loading,
    error,
    refreshStorefront,
    currentPath,
    navigate,
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartCount,
    subtotal,
    deliveryFee,
    totalAmount,
    wishlistIds,
    toggleWishlist,
    isWishlisted,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
