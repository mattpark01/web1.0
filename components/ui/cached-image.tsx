"use client";

import { useState, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ImagePreloader } from "@/lib/cache";

interface CachedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  onLoadError?: () => void;
}

export function CachedImage({ 
  src, 
  alt, 
  className, 
  fallback,
  onLoadError,
  ...props 
}: CachedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setImageError(true);
      setIsLoading(false);
      return;
    }

    // Only handle string URLs, not Blob objects
    if (typeof src !== 'string') {
      setIsLoading(false);
      setImageError(false);
      return;
    }

    // Reset states when src changes
    setImageError(false);
    setIsLoading(true);

    // Check if already loaded
    if (ImagePreloader.isLoaded(src)) {
      setIsLoading(false);
      setImageError(false);
      return;
    }

    // Preload the image
    ImagePreloader.preloadSingle(src)
      .then(() => {
        setIsLoading(false);
        setImageError(false);
      })
      .catch((error) => {
        // Image load failed - show placeholder instead
        setIsLoading(false);
        setImageError(true);
        onLoadError?.();
        // Don't log this as it's expected behavior for some images
      });
  }, [src, onLoadError]);

  if (imageError || !src) {
    return <>{fallback}</>;
  }

  return (
    <>
      {isLoading && fallback}
      <img
        {...props}
        src={src}
        alt={alt}
        className={cn(
          className,
          isLoading && "hidden"
        )}
        onError={(e) => {
          setImageError(true);
          onLoadError?.();
          // Hide the broken image
          e.currentTarget.style.display = 'none';
        }}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
}