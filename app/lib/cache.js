/**
 * SSR-safe caching utilities using localStorage
 * Handles client/server boundary and provides explicit functions for each cache type
 */

// Generic cache utility (internal use only)
const cacheUtils = {
  /**
   * Get item from cache with TTL checking
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/missing
   */
  get: (key) => {
    if (typeof window === 'undefined') return null; // SSR check
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expires) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch (e) {
      console.warn('Cache read failed:', e);
      return null;
    }
  },

  /**
   * Set item in cache with TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttlMs - Time to live in milliseconds
   */
  set: (key, data, ttlMs) => {
    if (typeof window === 'undefined') return; // SSR check
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        expires: Date.now() + ttlMs
      }));
    } catch (e) {
      console.warn('Cache storage failed:', e);
    }
  },

  /**
   * Remove item from cache
   * @param {string} key - Cache key to remove
   */
  remove: (key) => {
    if (typeof window === 'undefined') return; // SSR check
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Cache removal failed:', e);
    }
  }
};

/**
 * Vinyl fact caching functions
 */
export const vinylFactCache = {
  /**
   * Get cached vinyl fact
   * @returns {string|null} Cached vinyl fact or null
   */
  get: () => cacheUtils.get('gn_vinyl_fact'),

  /**
   * Cache a vinyl fact for 30 minutes
   * @param {string} fact - Vinyl fact to cache
   */
  set: (fact) => cacheUtils.set('gn_vinyl_fact', fact, 30 * 60 * 1000), // 30 minutes

  /**
   * Clear cached vinyl fact
   */
  clear: () => cacheUtils.remove('gn_vinyl_fact')
};

/**
 * Background image caching functions
 */
export const backgroundImageCache = {
  /**
   * Get cached background for a specific source image
   * @param {string} sourceImage - Source image path (e.g., '/images/hifive-color.png')
   * @returns {Object|null} Cached background data or null
   */
  get: (sourceImage) => {
    const key = `gn_bg_${sourceImage.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return cacheUtils.get(key);
  },

  /**
   * Cache a generated background for 2 hours
   * @param {string} sourceImage - Source image path used for generation
   * @param {string} imageUrl - Generated image URL from fal.ai
   */
  set: (sourceImage, imageUrl) => {
    const key = `gn_bg_${sourceImage.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const data = { 
      imageUrl, 
      sourceImage,
      generatedAt: Date.now()
    };
    cacheUtils.set(key, data, 2 * 60 * 60 * 1000); // 2 hours
  },

  /**
   * Clear cached background for specific source image
   * @param {string} sourceImage - Source image path
   */
  clear: (sourceImage) => {
    const key = `gn_bg_${sourceImage.replace(/[^a-zA-Z0-9]/g, '_')}`;
    cacheUtils.remove(key);
  },

  /**
   * Clear all cached backgrounds
   */
  clearAll: () => {
    if (typeof window === 'undefined') return; // SSR check
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gn_bg_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cache clear all failed:', e);
    }
  }
};

/**
 * General cache management functions
 */
export const cacheManager = {
  /**
   * Clear all Good Neighbor caches
   */
  clearAll: () => {
    vinylFactCache.clear();
    backgroundImageCache.clearAll();
  },

  /**
   * Get cache statistics (client-side only)
   * @returns {Object|null} Cache statistics or null if SSR
   */
  getStats: () => {
    if (typeof window === 'undefined') return null;
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('gn_'));
      const stats = {
        totalEntries: keys.length,
        vinylFacts: keys.filter(key => key === 'gn_vinyl_fact').length,
        backgroundImages: keys.filter(key => key.startsWith('gn_bg_')).length,
        estimatedSize: keys.reduce((size, key) => {
          return size + localStorage.getItem(key)?.length || 0;
        }, 0)
      };
      return stats;
    } catch (e) {
      console.warn('Cache stats failed:', e);
      return null;
    }
  }
};