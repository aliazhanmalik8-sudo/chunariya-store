import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatPrice, getDiscountPercent, getEffectivePrice } from '../lib/format';
import { SmartImage } from './SmartImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { categories, settings, navigate, addToCart, setCartOpen, toggleWishlist, isWishlisted } =
    useStore();

  const primaryCategory = categories.find((c) => product.categoryIds.includes(c.id));
  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const discountPercent = getDiscountPercent(product.price, product.discountPrice);
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock <= 0;

  const editorialLabel =
    discountPercent > 0
      ? `Save ${discountPercent}%`
      : product.isNewArrival
        ? 'New Arrival'
        : product.isBestSeller
          ? 'Best Seller'
          : '';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product, product.sizes[0] || 'Standard', product.colors[0] || 'Default', 1);
    setCartOpen(true);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product, product.sizes[0] || 'Standard', product.colors[0] || 'Default', 1);
    navigate('/checkout');
  };

  return (
    <article className="group flex flex-col bg-white border border-[#E7DCD5] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div
        onClick={() => navigate(`/product/${product.slug}`)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F6EFEA] cursor-pointer"
      >
        <SmartImage
          src={product.images[0]}
          alt={product.name}
          fallbackTitle={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={`${product.name} alternate view`}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}

        {editorialLabel && (
          <span className="absolute top-3 left-3 bg-[#FCF9F6]/95 text-[#6B1D2F] border border-[#E7DCD5] px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase">
            {editorialLabel}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={`absolute top-3 right-3 p-2 bg-[#FCF9F6]/90 border border-[#E7DCD5] transition-colors ${
            wishlisted ? 'text-[#6B1D2F]' : 'text-[#23191B] hover:text-[#6B1D2F]'
          }`}
        >
          <Heart className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hidden sm:block">
          <button
            type="button"
            disabled={outOfStock}
            onClick={handleQuickAdd}
            className="w-full py-2.5 px-4 bg-[#23191B] text-white text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-black disabled:bg-[#6E5D60] transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{outOfStock ? 'Out of Stock' : 'Quick Add to Bag'}</span>
          </button>
        </div>
      </div>

      <div
        onClick={() => navigate(`/product/${product.slug}`)}
        className="p-4 flex-1 flex flex-col justify-between cursor-pointer"
      >
        <div>
          <p className="text-[11px] tracking-wider uppercase text-[#6E5D60] truncate">
            {primaryCategory ? primaryCategory.name : 'CHUNARIYA'}
            {product.sizes.includes('Unstitched') ? ' · Unstitched & Stitched' : ''}
          </p>
          <h3 className="font-display text-lg font-semibold text-[#23191B] mt-1 leading-snug line-clamp-2 group-hover:text-[#6B1D2F] transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F6EFEA] space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-sm font-semibold text-[#23191B]">
                {formatPrice(effectivePrice, settings.currency)}
              </span>
              {discountPercent > 0 && (
                <span className="text-xs text-[#6E5D60] line-through">
                  {formatPrice(product.price, settings.currency)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#6E5D60] whitespace-nowrap">
              {outOfStock ? 'Sold Out' : 'In Stock'}
            </span>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={handleOrderNow}
            className="w-full py-2.5 px-4 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.14em] uppercase hover:bg-[#4F1321] disabled:bg-[#6E5D60] transition-colors"
          >
            {outOfStock ? 'Out of Stock' : 'Order Now'}
          </button>
        </div>
      </div>
    </article>
  );
}
