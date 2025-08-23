// Simple in-memory cache with TTL support
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const memoryCache = new Cache();

// LocalStorage cache wrapper with JSON serialization
export class LocalStorageCache {
  private prefix = 'spatio_cache_';

  set<T>(key: string, data: T, ttl = 30 * 60 * 1000): void { // 30 minutes default for localStorage
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const cacheData = JSON.parse(item);
      
      // Check if cache has expired
      if (Date.now() - cacheData.timestamp > cacheData.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return cacheData.data as T;
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
      return null;
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    // Clear all items with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }
}

export const localStorageCache = new LocalStorageCache();

// Image preloader utility
export class ImagePreloader {
  private static loadedImages = new Set<string>();
  private static imageCache = new Map<string, HTMLImageElement>();

  static preload(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => this.preloadSingle(url));
    return Promise.all(promises);
  }

  static preloadSingle(url: string): Promise<void> {
    if (!url || this.loadedImages.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.add(url);
        this.imageCache.set(url, img);
        resolve();
      };
      
      img.onerror = () => {
        // Image not available - fallback will be used
        reject(new Error(`Image not available: ${url}`));
      };
      
      img.src = url;
    });
  }

  static isLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }

  static getImage(url: string): HTMLImageElement | undefined {
    return this.imageCache.get(url);
  }

  static clear(): void {
    this.loadedImages.clear();
    this.imageCache.clear();
  }
}