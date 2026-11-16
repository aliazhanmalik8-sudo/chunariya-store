import { useEffect, useMemo, useState } from 'react';
import { Check, Heart, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import {
  buildWhatsappChatUrl,
  formatPrice,
  getDiscountPercent,
  getEffectivePrice,
} from '../lib/format';

interface ProductDetailPageProps {
  slug: string;
}

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const {
    products,
    categories,
    settings,
    navigate,
    addToCart,
    setCartOpen,
    toggleWishlist,
    isWishlisted,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === slug || p.id === slug) || null,
    [products, slug],
  );

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImageIdx(0);
      setSelectedSize(product.sizes[0] || 'Standard');
      setSelectedColor(product.colors[0] || 'Default');
      setQuantity(1);
      setAddedFeedback(false);
    }
  }, [product]);

  // Dynamic SEO title, meta & Product Schema.org JSON-LD
  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} | ${settings.storeName}`;
    const effPrice = getEffectivePrice(product.price, product.discountPrice);
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images,
      brand: { '@type': 'Brand', name: settings.storeName },
      offers: {
        '@type': 'Offer',
        priceCurrency: settings.currency,
        price: effPrice,
        availability:
          product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    };
    let scriptEl = document.getElementById('chunariya-product-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'chunariya-product-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);

    return () => {
      scriptEl?.remove();
    };
  }, [product, settings.currency, settings.storeName]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (p) =>
          p.id !== product.id &&
          p.categoryIds.some((cid) => product.categoryIds.includes(cid)),
      )
      .slice(0, 4);
  }, [product, products]);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-semibold text-[#23191B]">Suit Not Found</h1>
        <p className="text-sm text-[#6E5D60] mt-3">
          This piece may have been archived or moved to a new seasonal collection.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 px-6 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase"
        >
          Return to All Products
        </button>
      </div>
    );
  }

  const productCategories = categories.filter((c) => product.categoryIds.includes(c.id));
  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const discountPercent = getDiscountPercent(product.price, product.discountPrice);
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedFeedback(true);
    setCartOpen(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    navigate('/checkout');
  };

  const quickWhatsappMessage = [
    `Assalam-o-Alaikum ${settings.storeName}, I would like to order:`,
    `Product: ${product.name}`,
    `Size: ${selectedSize}`,
    `Color: ${selectedColor}`,
    `Quantity: ${quantity}`,
    `Price: ${formatPrice(effectivePrice * quantity, settings.currency)}`,
    ``,
    `Please guide me on delivery confirmation.`,
  ].join('\n');

  const whatsappDirectLink = buildWhatsappChatUrl(settings.whatsappNumber, quickWhatsappMessage);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#6E5D60] mb-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => navigate('/')} className="hover:text-[#6B1D2F]">
          Home
        </button>
        <span>/</span>
        {productCategories[0] && (
          <>
            <button
              type="button"
              onClick={() => navigate(`/collections/${productCategories[0].slug}`)}
              className="hover:text-[#6B1D2F]"
            >
              {productCategories[0].name}
            </button>
            <span>/</span>
          </>
        )}
        <span className="text-[#23191B] truncate">{product.name}</span>
      </nav>

      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Sticky Gallery */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
          <div className="aspect-[3/4] w-full bg-[#F6EFEA] border border-[#E7DCD5] overflow-hidden">
            <SmartImage
              src={product.images[selectedImageIdx] || product.images[0]}
              alt={product.name}
              fallbackTitle={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`aspect-[3/4] overflow-hidden border transition-all ${
                    selectedImageIdx === idx
                      ? 'border-[#6B1D2F] ring-1 ring-[#6B1D2F]'
                      : 'border-[#E7DCD5] opacity-75 hover:opacity-100'
                  }`}
                >
                  <SmartImage
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Sticky Purchase Controls */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-[#E7DCD5] p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-[#6B1D2F]">
              {productCategories.map((c) => c.name).join(' · ') || 'CHUNARIYA Collection'}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#23191B] mt-1.5 leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-semibold text-[#23191B]">
                {formatPrice(effectivePrice, settings.currency)}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="text-base text-[#6E5D60] line-through">
                    {formatPrice(product.price, settings.currency)}
                  </span>
                  <span className="text-xs font-semibold text-[#6B1D2F] uppercase tracking-wider">
                    Save {discountPercent}%
                  </span>
                </>
              )}
            </div>

            <p className="text-xs text-[#6E5D60] mt-2 tabular-nums">
              {outOfStock
                ? 'Currently Out of Stock'
                : `In Stock · ${product.stock} ${product.stock === 1 ? 'piece' : 'pieces'} available`}
            </p>
          </div>

          <p className="text-sm text-[#23191B]/90 leading-relaxed border-t border-[#F6EFEA] pt-5">
            {product.description}
          </p>

          {/* Size Selector */}
          {product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-semibold uppercase tracking-wider text-[#23191B]">
                  Select Size
                </span>
                <span className="text-[#6E5D60]">{selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 text-xs font-medium border transition-colors ${
                      selectedSize === size
                        ? 'bg-[#6B1D2F] text-white border-[#6B1D2F]'
                        : 'bg-[#FCF9F6] text-[#23191B] border-[#E7DCD5] hover:border-[#6B1D2F]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {product.colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-semibold uppercase tracking-wider text-[#23191B]">
                  Available Color
                </span>
                <span className="text-[#6E5D60]">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 text-xs font-medium border transition-colors ${
                      selectedColor === color
                        ? 'bg-[#23191B] text-white border-[#23191B]'
                        : 'bg-[#FCF9F6] text-[#23191B] border-[#E7DCD5] hover:border-[#23191B]'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#23191B]">
              Quantity
            </span>
            <div className="inline-flex items-center border border-[#E7DCD5] bg-[#FCF9F6]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="p-2.5 text-[#23191B] hover:bg-[#FAF0EE]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-5 text-sm font-medium tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                aria-label="Increase quantity"
                className="p-2.5 text-[#23191B] hover:bg-[#FAF0EE]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAddToCart}
                className="py-3.5 px-5 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#4F1321] disabled:bg-[#6E5D60] transition-colors flex items-center justify-center gap-2"
              >
                {addedFeedback ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{outOfStock ? 'Out of Stock' : addedFeedback ? 'Added to Bag' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                disabled={outOfStock}
                onClick={handleBuyNow}
                className="py-3.5 px-5 bg-[#23191B] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-black disabled:bg-[#6E5D60] transition-colors"
              >
                Buy Now
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={whatsappDirectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 border border-[#25D366]/60 bg-[#25D366]/10 text-[#125B2E] text-xs font-semibold tracking-wider uppercase hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Order</span>
              </a>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className="py-3 px-4 border border-[#E7DCD5] bg-[#FCF9F6] text-[#23191B] text-xs font-medium tracking-wider uppercase hover:border-[#6B1D2F] transition-colors flex items-center justify-center gap-2"
              >
                <Heart
                  className="w-4 h-4 text-[#6B1D2F]"
                  fill={wishlisted ? 'currentColor' : 'none'}
                />
                <span>{wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>
          </div>

          {/* Fabric & Care Details */}
          {product.fabricDetails && (
            <div className="border-t border-[#E7DCD5] pt-5 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#23191B]">
                Fabric & Outfit Details
              </h2>
              <p className="text-xs sm:text-sm text-[#6E5D60] leading-relaxed">
                {product.fabricDetails}
              </p>
            </div>
          )}

          {/* Delivery & Authenticity Assurances */}
          <div className="border-t border-[#E7DCD5] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#6E5D60]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#6B1D2F] shrink-0" />
              <span>
                Delivery: {formatPrice(settings.deliveryCharges, settings.currency)}
                {settings.freeDeliveryThreshold > 0 &&
                  ` (Free over ${formatPrice(settings.freeDeliveryThreshold, settings.currency)})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#6B1D2F] shrink-0" />
              <span>Original {settings.storeName} craftsmanship</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-14 border-t border-[#E7DCD5]">
          <h2 className="font-display text-3xl font-semibold text-[#23191B] mb-8">
            You May Also Love
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
