import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { getDiscountPercent, getEffectivePrice } from '../lib/format';

interface CatalogPageProps {
  mode: 'all' | 'new-arrivals' | 'best-sellers' | 'sale' | 'category' | 'search';
  categorySlug?: string;
}

export function CatalogPage({ mode, categorySlug }: CatalogPageProps) {
  const { categories, products, currentPath, navigate } = useStore();

  const urlQuery = useMemo(() => {
    const idx = currentPath.indexOf('?');
    if (idx === -1) return '';
    return new URLSearchParams(currentPath.slice(idx + 1)).get('q') || '';
  }, [currentPath]);

  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

  useEffect(() => {
    setSearchTerm(urlQuery);
  }, [urlQuery]);

  const activeCategory = useMemo(() => {
    if (mode === 'category' && categorySlug) {
      return categories.find((c) => c.slug === categorySlug) || null;
    }
    return null;
  }, [categories, categorySlug, mode]);

  useEffect(() => {
    if (mode === 'category' && activeCategory) {
      setSelectedCategoryId(activeCategory.id);
    } else if (mode !== 'category') {
      setSelectedCategoryId('all');
    }
  }, [activeCategory, mode]);

  const pageMeta = useMemo(() => {
    if (mode === 'new-arrivals') {
      return {
        title: 'New Arrivals',
        subtitle: 'Freshly released seasonal Pakistani lawn, cambric, and festive embroidered ensembles.',
      };
    }
    if (mode === 'best-sellers') {
      return {
        title: 'Best Sellers',
        subtitle: 'Our signature CHUNARIYA suits most loved by women across Pakistan.',
      };
    }
    if (mode === 'sale') {
      return {
        title: 'Special Offers & Sale',
        subtitle: 'Limited-time savings on curated stitched and unstitched collections.',
      };
    }
    if (mode === 'search') {
      return {
        title: searchTerm ? `Search: "${searchTerm}"` : 'Search Catalog',
        subtitle: 'Filter by category, fabric, or price to find your ideal suit.',
      };
    }
    if (mode === 'category' && activeCategory) {
      return {
        title: activeCategory.name,
        subtitle:
          activeCategory.description ||
          `Explore our curated ${activeCategory.name} wardrobe tailored with modern grace.`,
      };
    }
    return {
      title: 'All Products',
      subtitle: 'Complete CHUNARIYA collection across lawn, cotton, chiffon, formal, and casual wear.',
    };
  }, [activeCategory, mode, searchTerm]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (mode === 'new-arrivals') list = list.filter((p) => p.isNewArrival);
    if (mode === 'best-sellers') list = list.filter((p) => p.isBestSeller);
    if (mode === 'sale') list = list.filter((p) => getDiscountPercent(p.price, p.discountPrice) > 0);

    if (selectedCategoryId !== 'all') {
      list = list.filter((p) => p.categoryIds.includes(selectedCategoryId));
    }

    if (onlyInStock) {
      list = list.filter((p) => p.stock > 0);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.fabricDetails.toLowerCase().includes(q) ||
          p.colors.some((c) => c.toLowerCase().includes(q)),
      );
    }

    if (sortBy === 'price-asc') {
      list.sort(
        (a, b) =>
          getEffectivePrice(a.price, a.discountPrice) - getEffectivePrice(b.price, b.discountPrice),
      );
    } else if (sortBy === 'price-desc') {
      list.sort(
        (a, b) =>
          getEffectivePrice(b.price, b.discountPrice) - getEffectivePrice(a.price, a.discountPrice),
      );
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return list;
  }, [mode, onlyInStock, products, searchTerm, selectedCategoryId, sortBy]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="border-b border-[#E7DCD5] pb-8 mb-8">
        <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">CHUNARIYA Boutique</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#23191B] mt-1">
          {pageMeta.title}
        </h1>
        <p className="text-sm sm:text-base text-[#6E5D60] mt-2 max-w-2xl">{pageMeta.subtitle}</p>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => {
            setSelectedCategoryId('all');
            if (mode === 'category') navigate('/shop');
          }}
          className={`px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap ${
            selectedCategoryId === 'all'
              ? 'bg-[#6B1D2F] text-white border-[#6B1D2F]'
              : 'bg-white text-[#23191B] border-[#E7DCD5] hover:border-[#6B1D2F]'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setSelectedCategoryId(cat.id);
              if (mode === 'category') {
                navigate(`/collections/${cat.slug}`);
              }
            }}
            className={`px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap ${
              selectedCategoryId === cat.id
                ? 'bg-[#6B1D2F] text-white border-[#6B1D2F]'
                : 'bg-white text-[#23191B] border-[#E7DCD5] hover:border-[#6B1D2F]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search, In-Stock & Sort Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-4 bg-white border border-[#E7DCD5] mb-8">
        <div className="flex items-center gap-2.5 flex-1 max-w-md border border-[#E7DCD5] px-3 py-2 bg-[#FCF9F6]">
          <Search className="w-4 h-4 text-[#6E5D60] shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by suit name, fabric, or color..."
            className="w-full text-sm bg-transparent focus:outline-none text-[#23191B]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Clear filter"
              className="text-[#6E5D60] hover:text-[#23191B]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer text-[#23191B]">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="accent-[#6B1D2F]"
            />
            <span>In Stock Only</span>
          </label>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#6E5D60]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort products"
              className="border border-[#E7DCD5] bg-[#FCF9F6] px-3 py-1.5 text-xs text-[#23191B] focus:outline-none focus:border-[#6B1D2F]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <span className="text-[#6E5D60] tabular-nums">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'suit' : 'suits'}
          </span>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#E7DCD5] py-16 px-6 text-center">
          <p className="font-display text-2xl text-[#23191B]">No matching suits found</p>
          <p className="text-sm text-[#6E5D60] mt-2">
            Try clearing your search or selecting a different category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategoryId('all');
              setOnlyInStock(false);
              navigate('/shop');
            }}
            className="mt-6 px-6 py-2.5 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#4F1321] transition-colors"
          >
            View All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
