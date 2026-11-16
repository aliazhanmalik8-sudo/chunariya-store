import React, { useState } from 'react';
import { Check, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SmartImage } from '../components/SmartImage';
import { buildWhatsappChatUrl, formatPrice } from '../lib/format';
import { resolveApiUrl } from '../lib/adminApi';

export function AboutPage() {
  const { settings, navigate } = useStore();
  const paragraphs = (settings.aboutUsContent || '').split('\n').filter((p) => p.trim().length > 0);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className="aspect-[4/3] bg-[#F6EFEA] border border-[#E7DCD5] overflow-hidden">
          <SmartImage
            src={
              settings.craftsmanshipBannerUrl ||
              '/src/assets/images/banner_heritage_craftsmanship_1794844745278.jpg'
            }
            alt={`${settings.storeName} craftsmanship and textiles`}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">
            Our Heritage · {settings.tagline}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#23191B] mt-2">
            About {settings.storeName}
          </h1>
          <div className="mt-6 space-y-4 text-sm sm:text-base text-[#6E5D60] leading-relaxed">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="px-6 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#4F1321] transition-colors"
            >
              Explore Collections
            </button>
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="px-6 py-3 border border-[#23191B] text-[#23191B] text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#FAF0EE] transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { settings } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch(resolveApiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      if (!res.ok) {
        let errMsg = '';
        try {
          const d = (await res.json()) as { error?: string };
          errMsg = d.error || '';
        } catch {
          errMsg = '';
        }
        throw new Error(
          errMsg ||
            (res.status === 404
              ? 'Contact backend API (/api/contact) is unavailable on this host.'
              : 'Could not send message.'),
        );
      }
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const whatsappUrl = buildWhatsappChatUrl(
    settings.whatsappNumber,
    `Assalam-o-Alaikum ${settings.storeName}, I have a question regarding your collection.`,
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="border-b border-[#E7DCD5] pb-6 mb-10">
        <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">Customer Concierge</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#23191B] mt-1">
          Contact Us
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E7DCD5] p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#23191B]">
              {settings.storeName} Studio
            </h2>
            <div className="space-y-4 text-sm text-[#6E5D60]">
              {settings.storeAddress && settings.storeAddress.trim().length > 0 && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#6B1D2F] shrink-0 mt-1" />
                  <span>{settings.storeAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#6B1D2F] shrink-0" />
                <span>{settings.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#6B1D2F] shrink-0" />
                <span>{settings.emailAddress}</span>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#1E7E45] text-white text-xs font-semibold tracking-wider uppercase hover:bg-[#176436] transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat Directly on WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E7DCD5] p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-[#23191B] mb-5">
            Send Us a Message
          </h2>
          {sent ? (
            <div className="p-6 bg-[#FAF0EE] border border-[#E7DCD5] flex items-start gap-3">
              <Check className="w-5 h-5 text-[#6B1D2F] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-[#23191B]">Message Received</p>
                <p className="text-xs text-[#6E5D60] mt-1">
                  Thank you for reaching out. Our team will respond shortly via email or phone.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/30 text-xs text-[#6B1D2F]">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-[#E7DCD5] bg-[#FCF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6B1D2F]"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="px-7 py-3 bg-[#6B1D2F] text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-[#4F1321] transition-colors"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function PolicyPage({
  type,
}: {
  type: 'faq' | 'shipping' | 'return' | 'privacy' | 'terms';
}) {
  const { settings } = useStore();

  const contentMap = {
    faq: {
      kicker: 'Helpful Answers',
      title: 'Frequently Asked Questions',
      sections: [
        {
          q: 'How do I place an order on CHUNARIYA?',
          a: 'Add your chosen suits (with size and color) to your bag, proceed to Checkout, fill in your delivery details, and click "Place Order on WhatsApp". WhatsApp opens automatically with your complete order ready to send.',
        },
        {
          q: 'Do you offer both Stitched and Unstitched suits?',
          a: 'Yes! Each product page lists available options including Unstitched fabric yardage and ready-to-wear Stitched sizes (XS, S, M, L, XL).',
        },
        {
          q: 'How long does delivery take across Pakistan?',
          a: 'Orders confirmed via WhatsApp are dispatched within 24–48 hours and arrive within 3–5 working days in major cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan) and 5–7 days nationwide.',
        },
        {
          q: 'What payment methods are accepted?',
          a: 'We offer Cash on Delivery (COD) nationwide across Pakistan, as well as bank transfer options shared upon WhatsApp confirmation.',
        },
      ],
    },
    shipping: {
      kicker: 'Delivery Guide',
      title: 'Shipping Policy',
      sections: [
        {
          q: 'Standard Delivery Charges',
          a: `Standard nationwide shipping is ${formatPrice(settings.deliveryCharges, settings.currency)} per order.${
            settings.freeDeliveryThreshold > 0
              ? ` Orders above ${formatPrice(settings.freeDeliveryThreshold, settings.currency)} qualify for complimentary shipping.`
              : ''
          }`,
        },
        {
          q: 'Dispatch & Tracking',
          a: 'Once you send your order message on WhatsApp and our team confirms availability, your parcel is packed and dispatched via tracked courier with tracking shared directly on WhatsApp.',
        },
      ],
    },
    return: {
      kicker: 'Client Assurance',
      title: 'Return & Exchange Policy',
      sections: [
        {
          q: '7-Day Exchange Window',
          a: 'Unworn, unwashed suits with original tags and packaging may be exchanged within 7 days of delivery for another size or equal-value item.',
        },
        {
          q: 'Damaged or Incorrect Parcels',
          a: `If you receive an incorrect or defective item, contact us on WhatsApp or ${settings.emailAddress} within 48 hours of delivery for a complimentary replacement.`,
        },
      ],
    },
    privacy: {
      kicker: 'Data Protection',
      title: 'Privacy Policy',
      sections: [
        {
          q: 'Information We Collect',
          a: `${settings.storeName} collects only the name, phone/WhatsApp number, and delivery address you provide during checkout so we can dispatch your order accurately.`,
        },
        {
          q: 'No Third-Party Selling',
          a: 'Your contact details and order records are never sold or shared with unrelated third-party marketers.',
        },
      ],
    },
    terms: {
      kicker: 'Store Guidelines',
      title: 'Terms & Conditions',
      sections: [
        {
          q: 'Order Confirmation',
          a: 'Submitting checkout prepares your WhatsApp order message; orders are formally confirmed after you send the message in WhatsApp and receive confirmation from our team.',
        },
        {
          q: 'Color & Photography',
          a: 'All photography is shot under natural daylight; subtle shade variations may occur due to individual screen calibration.',
        },
      ],
    },
  }[type];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="border-b border-[#E7DCD5] pb-6 mb-8">
        <p className="text-xs tracking-[0.22em] uppercase text-[#6B1D2F]">{contentMap.kicker}</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#23191B] mt-1">
          {contentMap.title}
        </h1>
      </div>

      <div className="space-y-6">
        {contentMap.sections.map((sec, idx) => (
          <div key={idx} className="bg-white border border-[#E7DCD5] p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-[#23191B]">{sec.q}</h2>
            <p className="text-sm text-[#6E5D60] mt-2 leading-relaxed">{sec.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
