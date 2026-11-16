import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';
import { SmartImage } from '../components/SmartImage';

export function CartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    subtotal,
    deliveryFee,
    totalAmount,
    settings,
    navigate,
  } = useStore();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="border-b border-[#E7DCD5] pb-6 mb-8">
        <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">CHUNARIYA Bag</p>
        <h1 className="font-display text-4xl font-semibold text-[#23191B] mt-1">Shopping Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-[#E7DCD5] py-20 px-6 text-center">
          <ShoppingBag className="w-10 h-10 text-[#C59B5F] mx-auto mb-3" strokeWidth={1.3} />
          <h2 className="font-display text-3xl text-[#23191B]">Your shopping cart is empty</h2>
          <p className="text-sm text-[#6E5D60] mt-2">
            Browse our collections to add Pakistani lawn, cotton, or chiffon suits to your bag.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="mt-6 px-7 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#4F1321] transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white border border-[#E7DCD5] divide-y divide-[#E7DCD5]">
            {cart.map((item) => (
              <div key={item.cartKey} className="p-5 sm:p-6 flex gap-5">
                <div
                  onClick={() => navigate(`/product/${item.slug}`)}
                  className="w-24 h-32 bg-[#F6EFEA] border border-[#E7DCD5] shrink-0 overflow-hidden cursor-pointer"
                >
                  <SmartImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${item.slug}`)}
                        className="text-left font-display text-xl font-semibold text-[#23191B] hover:text-[#6B1D2F]"
                      >
                        {item.name}
                      </button>
                      <p className="text-xs text-[#6E5D60] mt-1">
                        Size: {item.size} · Color: {item.color}
                      </p>
                      <p className="text-xs text-[#6E5D60] mt-1 tabular-nums">
                        Unit Price: {formatPrice(item.unitPrice, settings.currency)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartKey)}
                      aria-label={`Remove ${item.name}`}
                      className="text-[#6E5D60] hover:text-[#6B1D2F] p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="inline-flex items-center border border-[#E7DCD5]">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartKey, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="p-2 hover:bg-[#FAF0EE]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-4 text-sm font-medium tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartKey, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="p-2 hover:bg-[#FAF0EE]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-base font-semibold text-[#23191B] tabular-nums">
                      {formatPrice(item.unitPrice * item.quantity, settings.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4 bg-white border border-[#E7DCD5] p-6 space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#23191B] border-b border-[#E7DCD5] pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
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
              <div className="flex justify-between pt-3 border-t border-[#E7DCD5] text-base font-semibold text-[#23191B]">
                <span>Final Total</span>
                <span className="tabular-nums">{formatPrice(totalAmount, settings.currency)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 px-5 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#4F1321] transition-colors flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
