/**
 * Simple in-memory API cache with TTL (time-to-live).
 * Avoids redundant API calls for rarely-changing data (services, branches).
 */

const cache = new Map();

/**
 * Get cached data if it exists and hasn't expired.
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null
 */
export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store data in cache with a TTL.
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlMs - Time to live in milliseconds (default 5 minutes)
 */
export function setCache(key, data, ttlMs = 5 * 60 * 1000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Remove a specific cache entry.
 * @param {string} key - Cache key
 */
export function clearCache(key) {
  cache.delete(key);
}

/**
 * Clear the entire cache.
 */
export function clearAllCache() {
  cache.clear();
}
