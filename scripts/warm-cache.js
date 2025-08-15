
const { warmCache } = require('./middleware/cache');
const { query } = require('./db');

// Warm cache on startup
warmCache(query).then(() => {
  console.log('🔥 Cache warming completed');
}).catch(error => {
  console.error('❌ Cache warming failed:', error);
});
