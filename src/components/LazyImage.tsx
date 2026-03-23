import { useState, useEffect, useRef } from 'react';
import { getWineImageDisplayUrl } from '../utils/imageStorage';

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  fallbackIcon?: React.ReactNode;
  thumbnailSize?: { width: number; height: number };
  storagePath?: string | null;
  scrollContainer?: React.RefObject<Element>;
}

// Simple in-memory cache for loaded images
const imageCache = new Set<string>();

export function LazyImage({
  src,
  alt,
  className = '',
  placeholderClassName = 'bg-charcoal-200',
  fallbackIcon,
  thumbnailSize,
  storagePath,
  scrollContainer,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Use storage path if available (for migrated images), otherwise fall back to base64
  const useThumbnail = !!storagePath && !!thumbnailSize;
  const imageUrl = getWineImageDisplayUrl(src, useThumbnail, storagePath);

  // Check if image is already in cache
  useEffect(() => {
    if (imageUrl && imageCache.has(imageUrl)) {
      setLoaded(true);
    }
  }, [imageUrl]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setLoaded(true);
    if (imageUrl) {
      imageCache.add(imageUrl);
    }
  };

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

  // Generate thumbnail styles for CSS-based resizing of base64 images
  const thumbnailStyles: React.CSSProperties = thumbnailSize
    ? {
        maxWidth: thumbnailSize.width,
        maxHeight: thumbnailSize.height,
      }
    : {};

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder while loading */}
      {!loaded && (
        <div className={`absolute inset-0 ${placeholderClassName} animate-pulse`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Only render image when in view */}
      {isInView && (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={() => setError(true)}
          style={thumbnailStyles}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

// Add shimmer animation to tailwind (add this to your global CSS or tailwind config)
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer { animation: shimmer 1.5s infinite; }
