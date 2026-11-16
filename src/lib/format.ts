export function formatPrice(amount: number, currency = 'PKR'): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${currency} ${safe.toLocaleString('en-PK')}`;
}

export function getEffectivePrice(price: number, discountPrice: number | null): number {
  if (discountPrice !== null && discountPrice > 0 && discountPrice < price) {
    return discountPrice;
  }
  return price;
}

export function getDiscountPercent(price: number, discountPrice: number | null): number {
  if (discountPrice === null || discountPrice <= 0 || discountPrice >= price || price <= 0) {
    return 0;
  }
  return Math.round(((price - discountPrice) / price) * 100);
}

export function sanitizeWhatsappNumber(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return '92' + digits.slice(1);
  }
  return digits;
}

export function buildWhatsappChatUrl(whatsappNumber: string, message: string): string {
  const clean = sanitizeWhatsappNumber(whatsappNumber);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
