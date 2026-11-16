import { useMemo, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { formatPrice, getDiscountPercent } from '../lib/format';

export function HomePage() {
  const { categories, products, settings, reviews, loading, navigate } = useStore();
  const [showcaseTab, setShowcaseTab] = useState<'best-sellers' | 'trending'>('best-sellers');

  const newArrivals = useMemo(
    () => products.filter((p) => p.isNewArrival).slice(0, 8),
    [products],
  );

  const bestSellers = useMemo(
    () => products.filter((p) => p.isBestSeller).slice(0, 8),
    [products],
  );

  const trendingProducts = useMemo(
    () => products.filter((p) => p.isTrending).slice(0, 8),
    [products],
  );

  const saleProducts = useMemo(
    () => products.filter((p) => getDiscountPercent(p.price, p.discountPrice) > 0),
    [products],
  );

  const featuredCategories = useMemo(() => categories.slice(0, 12), [categories]);

  const activeShowcase = showcaseTab === 'best-sellers' ? bestSellers : trendingProducts;

  return (
    <div>
      {/* 1. Hero Fashion Banner */}
      <section className="relative w-full min-h-[520px] lg:min-h-[640px] bg-[#23191B] overflow-hidden flex items-end lg:items-center">
        <SmartImage
          src={settings.heroBannerUrl}
          alt={settings.heroHeadline}
          fallbackTitle={settings.storeName}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15 lg:bg-gradient-to-r lg:from-black/75 lg:via-black/40 lg:to-transparent" />

        <div className="relative z-10 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 lg:py-24">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.26em] uppercase text-[#DFC394] mb-3">
              {settings.tagline}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.08] text-balance">
              {settings.heroHeadline}
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#F6EFEA]/90 leading-relaxed max-w-lg">
              {settings.heroSubheadline}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-7 py-3.5 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.18em] uppercase border border-[#C59B5F]/50 hover:bg-[#4F1321] transition-colors inline-flex items-center gap-2.5 whitespace-nowrap"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/new-arrivals')}
                className="px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white text-xs font-medium tracking-[0.18em] uppercase border border-white/40 hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                New Arrivals
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Collections (Customizable Categories) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">Curated Wardrobes</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#23191B] mt-1">
              Featured Collections
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="text-xs font-medium tracking-[0.16em] uppercase text-[#6B1D2F] hover:text-[#4F1321] inline-flex items-center gap-1.5 border-b border-[#C59B5F] pb-1 self-start sm:self-auto"
          >
            <span>Explore All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[4/3] bg-[#F6EFEA] animate-pulse border border-[#E7DCD5]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/collections/${cat.slug}`)}
                className="group relative aspect-[4/3] overflow-hidden bg-[#F6EFEA] border border-[#E7DCD5] text-left"
              >
                <SmartImage
                  src={cat.image}
                  alt={cat.name}
                  fallbackTitle={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-white">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] tracking-[0.18em] uppercase text-[#DFC394] inline-flex items-center gap-1 mt-1">
                    Shop Collection
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 3. New Arrivals */}
      <section className="bg-[#F6EFEA]/70 border-y border-[#E7DCD5] py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">Just Arrived</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#23191B] mt-1">
                New Arrivals
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/new-arrivals')}
              className="text-xs font-medium tracking-[0.16em] uppercase text-[#6B1D2F] hover:text-[#4F1321] inline-flex items-center gap-1.5 border-b border-[#C59B5F] pb-1 self-start sm:self-auto"
            >
              <span>View All New Arrivals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Special Offers & Atelier Craftsmanship Split */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 border border-[#E7DCD5] bg-white items-stretch">
          <div className="relative min-h-[320px] lg:min-h-[440px] bg-[#FAF0EE]">
            <SmartImage
              src={
                settings.craftsmanshipBannerUrl ||
                '/src/assets/images/banner_heritage_craftsmanship_1794844745278.jpg'
              }
              alt={`${settings.storeName} artisanal embroidery and Pakistani silk lawn fabrics`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-[#FAF0EE]/60">
            <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">
              Special Offers · Limited-Time Savings
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#23191B] mt-2 leading-tight text-balance">
              Artisanal Lawn, Chiffon & Festive Suites at Seasonal Prices
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D60] mt-4 leading-relaxed">
              {saleProducts.length > 0
                ? `Discover ${saleProducts.length} handcrafted ensembles currently on seasonal offer, with complimentary delivery on orders above ${formatPrice(settings.freeDeliveryThreshold, settings.currency)}.`
                : 'Every CHUNARIYA suit is woven from breathable natural cottons, fine Swiss lawn, and pure chiffon with heirloom embroidery.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/sale')}
                className="px-6 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#4F1321] transition-colors"
              >
                Shop Special Offers
              </button>
              <button
                type="button"
                onClick={() => navigate('/about')}
                className="px-6 py-3 border border-[#23191B] text-[#23191B] text-xs font-medium tracking-[0.16em] uppercase hover:bg-white transition-colors"
              >
                Our Story
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Best Sellers & Trending Products */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">Most Loved</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#23191B] mt-1">
              {showcaseTab === 'best-sellers' ? 'Best Sellers' : 'Trending Now'}
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F6EFEA] border border-[#E7DCD5] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowcaseTab('best-sellers')}
              className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                showcaseTab === 'best-sellers'
                  ? 'bg-[#6B1D2F] text-white'
                  : 'text-[#23191B] hover:text-[#6B1D2F]'
              }`}
            >
              Best Sellers
            </button>
            <button
              type="button"
              onClick={() => setShowcaseTab('trending')}
              className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                showcaseTab === 'trending'
                  ? 'bg-[#6B1D2F] text-white'
                  : 'text-[#23191B] hover:text-[#6B1D2F]'
              }`}
            >
              Trending Now
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeShowcase.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Customer Reviews (Adjacent to Best Sellers) */}
      {reviews.length > 0 && (
        <section className="bg-[#FAF0EE] border-t border-[#E7DCD5] py-16 lg:py-20">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">
                Client Reflections
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#23191B] mt-1">
                Worn & Cherished Across Pakistan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="bg-white border border-[#E7DCD5] p-6 sm:p-7 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-[#C59B5F] mb-4">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-[#23191B] leading-relaxed">“{rev.comment}”</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#F6EFEA]">
                    <p className="font-display text-lg font-semibold text-[#23191B]">
                      {rev.customerName}
                    </p>
                    <p className="text-xs text-[#6E5D60] mt-0.5">
                      {rev.city} · {rev.productName}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
