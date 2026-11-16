export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  visible: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  fabricDetails: string;
  price: number;
  discountPrice: number | null;
  images: string[];
  categoryIds: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl: string;
  whatsappNumber: string;
  phoneNumber: string;
  emailAddress: string;
  storeAddress: string;
  instagramUrl: string;
  facebookUrl: string;
  deliveryCharges: number;
  freeDeliveryThreshold: number;
  currency: string;
  heroBannerUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  craftsmanshipBannerUrl?: string;
  aboutUsContent: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharges: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  whatsappMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  key: string;
  name: string;
  phone: string;
  whatsappNumber: string;
  city: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface CustomerReview {
  id: string;
  customerName: string;
  city: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  cartKey: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  maxStock: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: 'Primary Admin' | 'Co-Admin';
  createdAt: string;
}

export interface AdminAuthStatus {
  configured: boolean;
  authenticated: boolean;
  adminEmail: string | null;
  adminName?: string | null;
  usesEnvCredentials: boolean;
  sessionReplaced?: boolean;
}
