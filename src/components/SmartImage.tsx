import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { resolveApiUrl } from '../lib/adminApi';

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SmartImage({ src, alt, className = '', fallbackTitle }: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = src && src.startsWith('/uploads/') ? resolveApiUrl(src) : src;

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF0EE] via-[#F6EFEA] to-[#EDE2DA] text-[#6E5D60] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-6 h-6 text-[#C59B5F] mb-2 opacity-80" strokeWidth={1.5} />
        <span className="font-display text-sm tracking-wide text-[#23191B] line-clamp-2">
          {fallbackTitle || alt || 'CHUNARIYA'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
