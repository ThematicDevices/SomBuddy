import { useState } from 'react';
import { getWineImageDisplayUrl } from '../utils/imageStorage';

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  fallbackIcon?: React.ReactNode;
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholderClassName = 'bg-charcoal-200',
  fallbackIcon,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const imageUrl = getWineImageDisplayUrl(src);

  // If no image or error, show fallback
  if (!imageUrl || error) {
    return (
      <div className={`${className} ${placeholderClassName} flex items-center justify-center`}>
        {fallbackIcon || (
          <div className="w-6 h-12 bg-white/20 rounded-sm" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder while loading */}
      {!loaded && (
        <div className={`absolute inset-0 ${placeholderClassName} animate-pulse`} />
      )}

      {/* Actual image */}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
