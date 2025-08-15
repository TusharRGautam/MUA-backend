const NodeCache = require('node-cache');

// Cache configuration
const cacheConfig = {
  // TTL in seconds
  TTL: {
    SHORT: 60,        // 1 minute - for frequently changing data
    MEDIUM: 300,      // 5 minutes - for semi-dynamic data
    LONG: 900,        // 15 minutes - for relatively stable data
    EXTENDED: 3600,   // 1 hour - for static data
  },
  
  // Cache sizes by type
  CACHE_SIZES: {
    QUERY_CACHE: 500,    // Database query results
    API_CACHE: 200,      // API response cache
    USER_CACHE: 1000,    // User-specific data
    VENDOR_CACHE: 300,   // Vendor data
  }
};

// Create separate cache instances for different data types
const queryCache = new NodeCache({ 
  stdTTL: cacheConfig.TTL.MEDIUM,
  checkperiod: 120,
  maxKeys: cacheConfig.CACHE_SIZES.QUERY_CACHE
});

const apiResponseCache = new NodeCache({ 
  stdTTL: cacheConfig.TTL.SHORT,
  checkperiod: 60,
  maxKeys: cacheConfig.CACHE_SIZES.API_CACHE
});

const userDataCache = new NodeCache({ 
  stdTTL: cacheConfig.TTL.LONG,
  checkperiod: 300,
  maxKeys: cacheConfig.CACHE_SIZES.USER_CACHE
});

const vendorDataCache = new NodeCache({ 
  stdTTL: cacheConfig.TTL.MEDIUM,
  checkperiod: 120,
  maxKeys: cacheConfig.CACHE_SIZES.VENDOR_CACHE
});

// Cache statistics for monitoring
const cacheStats = {
  queryCache: { hits: 0, misses: 0 },
  apiResponseCache: { hits: 0, misses: 0 },
  userDataCache: { hits: 0, misses: 0 },
  vendorDataCache: { hits: 0, misses: 0 }
};

// Helper function to generate cache keys
const generateCacheKey = (prefix, ...params) => {
  return `${prefix}:${params.filter(p => p !== null && p !== undefined).join(':')}`;
};

// Generic cache middleware factory
const createCacheMiddleware = (cache, cacheType, ttl = null) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query parameters
    const cacheKey = generateCacheKey('api', req.originalUrl, JSON.stringify(req.query));
    
    try {
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        cacheStats[cacheType].hits++;
        console.log(`🚀 Cache HIT for ${cacheKey} (${cacheType})`);
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Type': cacheType,
          'Cache-Control': 'public, max-age=60'
        });
        
        return res.json(cachedData);
      }
      
      cacheStats[cacheType].misses++;
      console.log(`📦 Cache MISS for ${cacheKey} (${cacheType})`);
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode < 400 && data) {
          const cacheTTL = ttl || (
            req.query.nocache === 'true' ? 0 : cacheConfig.TTL.MEDIUM
          );
          
          if (cacheTTL > 0) {
            cache.set(cacheKey, data, cacheTTL);
            console.log(`💾 Cached response for ${cacheKey} (TTL: ${cacheTTL}s)`);
          }
        }
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Type': cacheType,
          'Cache-Control': data && res.statusCode < 400 ? 'public, max-age=60' : 'no-cache'
        });
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error(`Cache error for ${cacheKey}:`, error);
      next();
    }
  };
};

// Specific middleware for different cache types
const apiCache = createCacheMiddleware(apiResponseCache, 'apiResponseCache');
const userCache = createCacheMiddleware(userDataCache, 'userDataCache', cacheConfig.TTL.LONG);
const vendorCache = createCacheMiddleware(vendorDataCache, 'vendorDataCache', cacheConfig.TTL.MEDIUM);

// Database query cache wrapper
const cacheQuery = async (cacheKey, queryFunction, ttl = cacheConfig.TTL.MEDIUM) => {
  try {
    // Check cache first
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult) {
      cacheStats.queryCache.hits++;
      console.log(`🗄️ Query cache HIT: ${cacheKey}`);
      return cachedResult;
    }
    
    cacheStats.queryCache.misses++;
    console.log(`🔍 Query cache MISS: ${cacheKey}`);
    
    // Execute query
    const result = await queryFunction();
    
    // Cache the result if it's valid
    if (result && (Array.isArray(result.rows) ? result.rows.length > 0 : true)) {
      queryCache.set(cacheKey, result, ttl);
      console.log(`💾 Cached query result: ${cacheKey} (TTL: ${ttl}s)`);
    }
    
    return result;
  } catch (error) {
    console.error(`Query cache error for ${cacheKey}:`, error);
    // If caching fails, execute query directly
    return await queryFunction();
  }
};

// Cache invalidation helpers
const invalidateCache = {
  // Invalidate all caches
  all: () => {
    queryCache.flushAll();
    apiResponseCache.flushAll();
    userDataCache.flushAll();
    vendorDataCache.flushAll();
    console.log('🗑️ All caches cleared');
  },
  
  // Invalidate by pattern
  pattern: (pattern) => {
    [queryCache, apiResponseCache, userDataCache, vendorDataCache].forEach(cache => {
      const keys = cache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.del(key);
        }
      });
    });
    console.log(`🗑️ Cleared cache entries matching: ${pattern}`);
  },
  
  // Invalidate user-specific data
  user: (userId) => {
    const pattern = `user:${userId}`;
    invalidateCache.pattern(pattern);
  },
  
  // Invalidate vendor-specific data
  vendor: (vendorId) => {
    const pattern = `vendor:${vendorId}`;
    invalidateCache.pattern(pattern);
  },
  
  // Invalidate booking-related data
  booking: (bookingId) => {
    invalidateCache.pattern(`booking:${bookingId}`);
    invalidateCache.pattern('bookings');
    invalidateCache.pattern('user_bookings');
  }
};

// Cache statistics endpoint
const getCacheStats = () => {
  const stats = {
    ...cacheStats,
    sizes: {
      queryCache: queryCache.getStats(),
      apiResponseCache: apiResponseCache.getStats(),
      userDataCache: userDataCache.getStats(),
      vendorDataCache: vendorDataCache.getStats()
    },
    hitRates: {}
  };
  
  // Calculate hit rates
  Object.keys(cacheStats).forEach(cacheType => {
    const hits = cacheStats[cacheType].hits;
    const misses = cacheStats[cacheType].misses;
    const total = hits + misses;
    stats.hitRates[cacheType] = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '0%';
  });
  
  return stats;
};

// Cache warming function for frequently accessed data
const warmCache = async (query) => {
  try {
    console.log('🔥 Starting cache warming...');
    
    // Warm frequently accessed queries
    const warmingQueries = [
      // Popular salons
      { 
        key: 'popular_salons', 
        fn: () => query('SELECT * FROM registration_and_other_details WHERE business_type ILIKE \'%salon%\' AND verification_status = \'verified\' LIMIT 20'),
        ttl: cacheConfig.TTL.LONG
      },
      // Service categories
      { 
        key: 'service_categories', 
        fn: () => query('SELECT DISTINCT category FROM our_services_section WHERE category IS NOT NULL'),
        ttl: cacheConfig.TTL.EXTENDED
      },
      // Active vendors
      { 
        key: 'active_vendors', 
        fn: () => query('SELECT COUNT(*) as count FROM registration_and_other_details WHERE verification_status = \'verified\''),
        ttl: cacheConfig.TTL.LONG
      }
    ];
    
    const warmingPromises = warmingQueries.map(async ({ key, fn, ttl }) => {
      try {
        await cacheQuery(key, fn, ttl);
        console.log(`✅ Warmed cache for: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to warm cache for: ${key}`, error);
      }
    });
    
    await Promise.allSettled(warmingPromises);
    console.log('🔥 Cache warming completed');
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
};

module.exports = {
  // Middleware exports
  apiCache,
  userCache,
  vendorCache,
  
  // Cache functions
  cacheQuery,
  generateCacheKey,
  
  // Cache management
  invalidateCache,
  getCacheStats,
  warmCache,
  
  // Cache instances (for direct access if needed)
  queryCache,
  apiResponseCache,
  userDataCache,
  vendorDataCache,
  
  // Configuration
  cacheConfig
};