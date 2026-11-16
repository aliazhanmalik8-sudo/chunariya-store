import React, { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';
import { resolveApiUrl } from '../lib/adminApi';
import { SmartImage } from '../components/SmartImage';
import type { Order } from '../types';

export function CheckoutPage() {
  const {
    cart,
    subtotal,
    deliveryFee,
    totalAmount,
    settings,
    clearCart,
    navigate,
  } = useStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<{
    order: Order;
    whatsappUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setError('Please fill in your Full Name, Phone Number, Delivery Address, and City.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(resolveApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: fullName.trim(),
          phone: phone.trim(),
          whatsappNumber: whatsappNumber.trim() || phone.trim(),
          address: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          notes: notes.trim(),
          items: cart.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        }),
      });

      const text = await res.text();
      let data: { order?: Order; whatsappUrl?: string; error?: string } = {};
      try {
        data = text ? (JSON.parse(text) as typeof data) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.order || !data.whatsappUrl) {
        throw new Error(
          data.error ||
            (res.status === 404
              ? 'Order backend API (/api/orders) is unavailable on this host.'
              : 'Could not prepare your order. Please try again.'),
        );
      }

      setSubmittedOrder({ order: data.order, whatsappUrl: data.whatsappUrl });
      clearCart();

      // Open WhatsApp automatically in a new tab/window so customer only presses Send
      const link = document.createElement('a');
      link.href = data.whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!submittedOrder) return;
    try {
      await navigator.clipboard.writeText(submittedOrder.order.whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  if (submittedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="bg-white border border-[#E7DCD5] p-8 sm:p-10 space-y-6">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">
              Order Prepared · Ref {submittedOrder.order.orderNumber}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#23191B] mt-2">
              Please Tap Send in WhatsApp to Complete Your Order
            </h1>
            <p className="text-sm text-[#6E5D60] mt-3 leading-relaxed">
              We have recorded your order details ({submittedOrder.order.orderNumber}) as{' '}
              <strong className="text-[#23191B]">Pending</strong>. Your order will only be
              finalized once you press <strong>Send</strong> on the WhatsApp message to{' '}
              {settings.storeName}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={submittedOrder.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-5 bg-[#1E7E45] text-white text-xs font-semibold tracking-[0.14em] uppercase hover:bg-[#176436] transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open WhatsApp & Press Send</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="py-3.5 px-5 border border-[#E7DCD5] text-xs font-medium tracking-wider uppercase text-[#23191B] hover:bg-[#FAF0EE] transition-colors inline-flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-[#1E7E45]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Order Text'}</span>
            </button>
          </div>

          <div className="bg-[#FCF9F6] border border-[#E7DCD5] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6E5D60] mb-2">
              WhatsApp Message Preview
            </p>
            <pre className="whitespace-pre-wrap font-sans text-xs text-[#23191B] leading-relaxed">
              {submittedOrder.order.whatsappMessage}
            </pre>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="text-xs font-medium tracking-wider uppercase text-[#6B1D2F] hover:underline"
            >
              Continue Shopping at {settings.storeName}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-10 h-10 text-[#C59B5F] mx-auto mb-3" strokeWidth={1.3} />
        <h1 className="font-display text-3xl font-semibold text-[#23191B]">
          Your bag is empty
        </h1>
        <p className="text-sm text-[#6E5D60] mt-2">
          Add a suit to your bag before proceeding to WhatsApp checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 px-6 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase"
        >
          Browse Suits
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="border-b border-[#E7DCD5] pb-6 mb-8">
        <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">WhatsApp Checkout</p>
        <h1 className="font-display text-4xl font-semibold text-[#23191B] mt-1">
          Delivery & Order Details
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Customer Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-[#E7DCD5] p-6 sm:p-8 space-y-5"
        >
          <h2 className="font-display text-2xl font-semibold text-[#23191B] border-b border-[#E7DCD5] pb-3">
            Customer Information
          </h2>

          {error && (
            <div className="p-3.5 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#23191B] mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ayesha Khan"
                className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#23191B] mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300 1234567"
                className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#23191B] mb-1.5">
                WhatsApp Number (Optional if same)
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Same as phone number"
                className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#23191B] mb-1.5">
                Complete Delivery Address *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Flat No., Street, Sector / Block, Landmark"
                className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#23191B] mb-1.5">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lahore, Karachi, Islamabad"
                className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#23191B] mb-1.5">
                Postal Code (Optional)
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 54000"
                className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#23191B] mb-1.5">
                Order Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferred delivery timing or stitching instructions..."
                className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 bg-[#6B1D2F] text-white text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#4F1321] disabled:bg-[#6E5D60] transition-colors flex items-center justify-center gap-2.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{submitting ? 'Preparing Order...' : 'Place Order on WhatsApp'}</span>
          </button>

          <p className="text-xs text-[#6E5D60] text-center">
            Clicking above opens WhatsApp with your complete order summary ready to send. Cash on
            Delivery (COD) available nationwide.
          </p>
        </form>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 bg-white border border-[#E7DCD5] p-6 sm:p-8 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-[#23191B] border-b border-[#E7DCD5] pb-3">
            Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} items)
          </h2>

          <div className="divide-y divide-[#F6EFEA] max-h-96 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.cartKey} className="py-3.5 flex gap-3.5">
                <div className="w-16 h-20 bg-[#F6EFEA] border border-[#E7DCD5] shrink-0 overflow-hidden">
                  <SmartImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base font-semibold text-[#23191B] line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#6E5D60] mt-0.5">
                    Size: {item.size} · Color: {item.color}
                  </p>
                  <div className="flex items-center justify-between mt-1.5 text-xs tabular-nums">
                    <span className="text-[#6E5D60]">
                      {item.quantity} × {formatPrice(item.unitPrice, settings.currency)}
                    </span>
                    <span className="font-semibold text-[#23191B]">
                      {formatPrice(item.unitPrice * item.quantity, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E7DCD5] pt-4 space-y-2.5 text-sm">
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
            <div className="flex justify-between pt-3 border-t border-[#E7DCD5] text-lg font-semibold text-[#23191B]">
              <span>Total Order Amount</span>
              <span className="tabular-nums">{formatPrice(totalAmount, settings.currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
