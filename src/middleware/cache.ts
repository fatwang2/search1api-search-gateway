/**
 * Cache middleware
 */
import { Context, MiddlewareHandler, Next } from 'hono';
import { Logger } from '../utils/logger';

const logger = new Logger('CacheMiddleware');

// Simple in-memory cache
const cache = new Map<string, { data: any; expiry: number }>();

/**
 * Default cache time in milliseconds (1 minute)
 */
const DEFAULT_CACHE_TIME = 60 * 1000;

/**
 * Generate a cache key from the request
 */
function generateCacheKey(c: Context): string {
  const url = new URL(c.req.url);
  const method = c.req.method;
  
  // For POST requests with JSON body, include the body in the cache key
  if (method === 'POST' && c.req.header('content-type')?.includes('application/json')) {
    return `${method}:${url.pathname}:${url.search}:${JSON.stringify(c.req.raw.body)}`;
  }
  
  return `${method}:${url.pathname}:${url.search}`;
}

/**
 * Cache middleware
 * @param options Cache options
 * @returns Middleware handler
 */
export const cacheMiddleware = (options?: {
  ttl?: number; // Time to live in milliseconds
  cacheKeyFn?: (c: Context) => string; // Custom cache key function
}): MiddlewareHandler => {
  const ttl = options?.ttl || DEFAULT_CACHE_TIME;
  const cacheKeyFn = options?.cacheKeyFn || generateCacheKey;
  
  return async (c: Context, next: Next) => {
    // Skip caching for non-GET and non-POST requests
    if (c.req.method !== 'GET' && c.req.method !== 'POST') {
      return next();
    }
    
    const cacheKey = cacheKeyFn(c);
    const cachedResponse = cache.get(cacheKey);
    
    // Return cached response if available and not expired
    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      logger.debug(`Cache hit for key: ${cacheKey}`);
      return c.json(cachedResponse.data);
    }
    
    // Clean up expired cache entries
    cleanupExpiredCache();
    
    // Process the request
    await next();
    
    // Cache the response only if it's successful
    try {
      // Clone the response
      const response = c.res;
      
      // Only cache if status is successful (2xx)
      if (response.status >= 200 && response.status < 300) {
        try {
          const responseData = await response.clone().json();
          
          // 直接缓存响应数据，不再检查包装格式
          cache.set(cacheKey, {
            data: responseData,
            expiry: Date.now() + ttl
          });
          
          logger.debug(`Cached response for key: ${cacheKey}, expires in ${ttl}ms`);
        } catch (error) {
          logger.debug(`Cannot parse response as JSON for key: ${cacheKey}`);
        }
      } else {
        logger.debug(`Not caching non-successful response (status: ${response.status}) for key: ${cacheKey}`);
      }
    } catch (error) {
      logger.error('Failed to cache response', error);
    }
  };
};

/**
 * Clean up expired cache entries
 */
function cleanupExpiredCache(): void {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, value] of cache.entries()) {
    if (value.expiry < now) {
      cache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
  }
}
