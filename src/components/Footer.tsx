import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildWhatsappChatUrl } from '../lib/format';

export function Footer() {
  const { categories, settings, navigate } = useStore();

  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  const whatsappDirectUrl = buildWhatsappChatUrl(
    settings.whatsappNumber,
    `Assalam-o-Alaikum ${settings.storeName}, I would like to inquire about your ladies suits collection.`,
  );

  return (
    <footer className="bg-[#23191B] text-[#FCF9F6] border-t border-[#3B2C2F] mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-[0.14em] text-white">
              {settings.storeName}
            </h2>
            <p className="text-xs tracking-[0.18em] uppercase text-[#DFC394] mt-1.5">
              {settings.tagline}
            </p>
            <p className="text-sm text-[#D6C9CB] leading-relaxed mt-5">
              Celebrating Pakistani women’s fashion with breathable Swiss lawn, flowing chiffon,
              and refined heirloom embroidery delivered across Pakistan.
            </p>
            <div className="flex items-center gap-4 mt-6 text-xs">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#DFC394] hover:text-white transition-colors underline underline-offset-4"
                >
                  Instagram
                </a>
              )}
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#DFC394] hover:text-white transition-colors underline underline-offset-4"
                >
                  Facebook
                </a>
              )}
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#DFC394] hover:text-white transition-colors underline underline-offset-4"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Collections */}
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">Collections</h3>
            <ul className="space-y-2.5 text-sm text-[#D6C9CB]">
              <li>
                <a
                  href="/new-arrivals"
                  onClick={(e) => handleLink(e, '/new-arrivals')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  New Arrivals
                </a>
              </li>
              <li>
                <a
                  href="/best-sellers"
                  onClick={(e) => handleLink(e, '/best-sellers')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  Best Sellers
                </a>
              </li>
              <li>
                <a
                  href="/sale"
                  onClick={(e) => handleLink(e, '/sale')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  Seasonal Sale
                </a>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/collections/${cat.slug}`}
                    onClick={(e) => handleLink(e, `/collections/${cat.slug}`)}
                    className="hover:text-[#DFC394] transition-colors"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">Customer Care</h3>
            <ul className="space-y-2.5 text-sm text-[#D6C9CB]">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLink(e, '/about')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLink(e, '/contact')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  onClick={(e) => handleLink(e, '/faq')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="/shipping-policy"
                  onClick={(e) => handleLink(e, '/shipping-policy')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  Shipping Policy
                </a>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  onClick={(e) => handleLink(e, '/privacy-policy')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleLink(e, '/terms')}
                  className="hover:text-[#DFC394] transition-colors"
                >
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">Boutique & Support</h3>
            <div className="space-y-3 text-sm text-[#D6C9CB]">
              {settings.storeAddress && settings.storeAddress.trim().length > 0 && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#DFC394] shrink-0 mt-1" />
                  <span>{settings.storeAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#DFC394] shrink-0" />
                <span>{settings.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#DFC394] shrink-0" />
                <span>{settings.emailAddress}</span>
              </div>
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#6B1D2F] text-white text-xs font-medium hover:bg-[#82243A] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#3B2C2F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A8999C]">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>
          <a
            href="/admin"
            onClick={(e) => handleLink(e, '/admin')}
            className="hover:text-[#DFC394] transition-colors"
          >
            Store Admin Dashboard
          </a>
        </div>
      </div>
    </footer>
  );
}
