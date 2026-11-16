import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';
import { SmartImage } from './SmartImage';

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
    subtotal,
    deliveryFee,
    totalAmount,
    settings,
    navigate,
  } = useStore();

  if (!cartOpen) return null;

  const remainingForFree =
    settings.freeDeliveryThreshold > 0 ? Math.max(0, settings.freeDeliveryThreshold - subtotal) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/45 transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      <aside
        aria-label="Shopping Bag"
        className="relative w-full max-w-md bg-[#FCF9F6] h-full shadow-2xl flex flex-col border-l border-[#E7DCD5]"
      >
        <div className="px-6 py-4 border-b border-[#E7DCD5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#6B1D2F]" />
            <h2 className="font-display text-2xl font-semibold text-[#23191B]">Your Shopping Bag</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
            className="p-2 text-[#6E5D60] hover:text-[#23191B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {settings.freeDeliveryThreshold > 0 && cart.length > 0 && (
          <div className="px-6 py-2.5 bg-[#FAF0EE] border-b border-[#E7DCD5] text-xs text-[#23191B]">
            {remainingForFree === 0
              ? 'Your order qualifies for complimentary nationwide delivery.'
              : `Add ${formatPrice(remainingForFree, settings.currency)} more for complimentary delivery.`}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-[#C59B5F] mb-3" strokeWidth={1.3} />
              <p className="font-display text-2xl text-[#23191B]">Your bag is currently empty</p>
              <p className="text-sm text-[#6E5D60] mt-2 max-w-xs">
                Explore our new arrivals in Swiss lawn, cotton cambric, and embroidered chiffon.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/shop');
                }}
                className="mt-6 px-6 py-2.5 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#4F1321] transition-colors"
              >
                Explore Collections
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartKey}
                className="flex gap-4 pb-5 border-b border-[#E7DCD5] last:border-b-0"
              >
                <div
                  onClick={() => {
                    setCartOpen(false);
                    navigate(`/product/${item.slug}`);
                  }}
                  className="w-20 h-28 bg-[#F6EFEA] shrink-0 overflow-hidden cursor-pointer border border-[#E7DCD5]"
                >
                  <SmartImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCartOpen(false);
                          navigate(`/product/${item.slug}`);
                        }}
                        className="text-left font-display text-base font-semibold text-[#23191B] hover:text-[#6B1D2F] line-clamp-2"
                      >
                        {item.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartKey)}
                        aria-label={`Remove ${item.name}`}
                        className="text-[#6E5D60] hover:text-[#6B1D2F] p-1 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#6E5D60] mt-1">
                      Size: {item.size} · Color: {item.color}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-[#E7DCD5] bg-white">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartKey, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="p-1.5 text-[#23191B] hover:bg-[#FAF0EE]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-medium tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartKey, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="p-1.5 text-[#23191B] hover:bg-[#FAF0EE]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-[#23191B] tabular-nums">
                      {formatPrice(item.unitPrice * item.quantity, settings.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-[#E7DCD5] space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#6E5D60]">
                <span>Subtotal</span>
                <span className="tabular-nums text-[#23191B]">
                  {formatPrice(subtotal, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#6E5D60]">
                <span>Delivery Charges</span>
                <span className="tabular-nums text-[#23191B]">
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E7DCD5] text-base font-semibold text-[#23191B]">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(totalAmount, settings.currency)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/cart');
                }}
                className="py-3 px-4 border border-[#23191B] text-xs font-medium tracking-wider uppercase text-[#23191B] hover:bg-[#FAF0EE] transition-colors"
              >
                View Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/checkout');
                }}
                className="py-3 px-4 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#4F1321] transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
