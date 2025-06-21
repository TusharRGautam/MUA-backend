/**
 * Optimized Image Service
 * Provides fast, cached access to Google Drive images with direct URLs
 */

const NodeCache = require('node-cache');
const axios = require('axios');

// Cache configuration
const urlCache = new NodeCache({ 
  stdTTL: 24 * 60 * 60, // 24 hours
  checkperiod: 60 * 60,  // Check every hour
  useClones: false 
});

const imageMetadataCache = new NodeCache({
  stdTTL: 7 * 24 * 60 * 60, // 7 days
  checkperiod: 60 * 60,
  useClones: false
});

/**
 * Extract Google Drive file ID from various URL formats
 */
const extractGoogleDriveFileId = (url) => {
  if (!url || !url.includes('drive.google.com')) {
    return null;
  }

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{25,})/,
    /[?&]id=([a-zA-Z0-9_-]{25,})/,
    /\/uc\?.*id=([a-zA-Z0-9_-]{25,})/,
    /\/([a-zA-Z0-9_-]{25,})\/view/,
    /\/open\?id=([a-zA-Z0-9_-]{25,})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Generate optimized direct access URL for Google Drive images
 */
const generateOptimizedGoogleDriveUrl = (originalUrl, options = {}) => {
  const { 
    format = 'webp', 
    quality = 80, 
    maxWidth = 1200,
    maxHeight = 800
  } = options;

  const fileId = extractGoogleDriveFileId(originalUrl);
  if (!fileId) {
    return originalUrl;
  }

  // Check cache first
  const cacheKey = `${fileId}_${format}_${quality}_${maxWidth}_${maxHeight}`;
  const cached = urlCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Generate multiple URL options for best performance
  const urls = [
    // Direct download with size parameters
    `https://drive.google.com/uc?export=download&id=${fileId}&sz=w${maxWidth}-h${maxHeight}`,
    // Thumbnail API for faster loading
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w${maxWidth}-h${maxHeight}`,
    // Standard direct view
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    // Alternative direct link
    `https://lh3.googleusercontent.com/d/${fileId}=w${maxWidth}-h${maxHeight}-no`
  ];

  // Use the first URL and cache it
  const optimizedUrl = urls[0];
  urlCache.set(cacheKey, optimizedUrl);

  return optimizedUrl;
};

/**
 * Validate and optimize image URL
 */
const validateAndOptimizeImageUrl = async (url, options = {}) => {
  try {
    if (!url) return null;

    // For Google Drive URLs, optimize them
    if (url.includes('drive.google.com')) {
      const optimizedUrl = generateOptimizedGoogleDriveUrl(url, options);
      
      // Test if the URL is accessible (with short timeout)
      try {
        await axios.head(optimizedUrl, { 
          timeout: 2000,
          validateStatus: (status) => status < 400
        });
        return optimizedUrl;
      } catch (testError) {
        console.log(`URL test failed for ${optimizedUrl}, falling back to original`);
        return url;
      }
    }

    return url;
  } catch (error) {
    console.error('Error validating image URL:', error);
    return url; // Return original URL on error
  }
};

/**
 * Batch optimize multiple image URLs
 */
const batchOptimizeImageUrls = async (imageUrls, options = {}) => {
  const promises = imageUrls.map(url => 
    validateAndOptimizeImageUrl(url, options).catch(() => url)
  );
  
  return await Promise.all(promises);
};

/**
 * Pre-warm cache with commonly accessed images
 */
const preWarmImageCache = async (imageUrls, options = {}) => {
  console.log(`Pre-warming cache for ${imageUrls.length} images`);
  
  const promises = imageUrls.map(async (url) => {
    try {
      const optimizedUrl = await validateAndOptimizeImageUrl(url, options);
      if (optimizedUrl && optimizedUrl !== url) {
        // Store in long-term cache
        const fileId = extractGoogleDriveFileId(url);
        if (fileId) {
          imageMetadataCache.set(fileId, {
            originalUrl: url,
            optimizedUrl,
            lastAccessed: Date.now(),
            options
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to pre-warm cache for ${url}:`, error);
    }
  });

  await Promise.allSettled(promises);
  console.log('Cache pre-warming completed');
};

/**
 * Get cached image metadata
 */
const getCachedImageMetadata = (url) => {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;
  
  return imageMetadataCache.get(fileId);
};

/**
 * Clear expired cache entries
 */
const cleanupCache = () => {
  const urlCacheStats = urlCache.getStats();
  const metadataCacheStats = imageMetadataCache.getStats();
  
  console.log('Cache cleanup - URL Cache:', urlCacheStats);
  console.log('Cache cleanup - Metadata Cache:', metadataCacheStats);
  
  // Force cleanup of expired entries
  urlCache.flushAll();
  
  // Clean old metadata entries (older than 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const metadataKeys = imageMetadataCache.keys();
  
  metadataKeys.forEach(key => {
    const metadata = imageMetadataCache.get(key);
    if (metadata && metadata.lastAccessed < thirtyDaysAgo) {
      imageMetadataCache.del(key);
    }
  });
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    urlCache: urlCache.getStats(),
    metadataCache: imageMetadataCache.getStats(),
    urlCacheKeys: urlCache.keys().length,
    metadataCacheKeys: imageMetadataCache.keys().length
  };
};

/**
 * Middleware for automatic image URL optimization
 */
const optimizeImageUrlsMiddleware = (options = {}) => {
  return async (req, res, next) => {
    try {
      // Store original send method
      const originalSend = res.send;
      
      // Override send method to optimize image URLs in response
      res.send = function(data) {
        try {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === 'object') {
              optimizeImageUrlsInObject(parsed, options);
              data = JSON.stringify(parsed);
            }
          } else if (typeof data === 'object') {
            optimizeImageUrlsInObject(data, options);
          }
        } catch (error) {
          console.warn('Failed to optimize image URLs in response:', error);
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Image optimization middleware error:', error);
      next();
    }
  };
};

/**
 * Recursively optimize image URLs in an object
 */
const optimizeImageUrlsInObject = (obj, options = {}) => {
  if (!obj || typeof obj !== 'object') return;
  
  const imageFields = [
    'imageUrl', 'image_url', 'url', 'profilePicture', 'profile_picture',
    'before', 'after', 'gallery', 'images', 'thumbnailUrl', 'src'
  ];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string' && imageFields.includes(key)) {
        // Optimize image URL
        const optimized = generateOptimizedGoogleDriveUrl(value, options);
        if (optimized !== value) {
          obj[key] = optimized;
        }
      } else if (Array.isArray(value)) {
        // Process arrays
        value.forEach(item => optimizeImageUrlsInObject(item, options));
      } else if (typeof value === 'object') {
        // Recursively process nested objects
        optimizeImageUrlsInObject(value, options);
      }
    }
  }
};

// Schedule periodic cache cleanup
setInterval(cleanupCache, 60 * 60 * 1000); // Every hour

module.exports = {
  extractGoogleDriveFileId,
  generateOptimizedGoogleDriveUrl,
  validateAndOptimizeImageUrl,
  batchOptimizeImageUrls,
  preWarmImageCache,
  getCachedImageMetadata,
  cleanupCache,
  getCacheStats,
  optimizeImageUrlsMiddleware,
  optimizeImageUrlsInObject
}; 