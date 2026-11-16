import { Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

export function WishlistPage() {
  const { products, wishlistIds, navigate } = useStore();
  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="border-b border-[#E7DCD5] pb-6 mb-8">
        <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">Saved Selection</p>
        <h1 className="font-display text-4xl font-semibold text-[#23191B] mt-1">Your Wishlist</h1>
      </div>

      {savedProducts.length === 0 ? (
        <div className="bg-white border border-[#E7DCD5] py-20 px-6 text-center">
          <Heart className="w-10 h-10 text-[#C59B5F] mx-auto mb-3" strokeWidth={1.3} />
          <h2 className="font-display text-3xl text-[#23191B]">No saved suits yet</h2>
          <p className="text-sm text-[#6E5D60] mt-2">
            Tap the heart icon on any suit to keep your favourites in one place.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="mt-6 px-7 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#4F1321] transition-colors"
          >
            Discover Collections
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
