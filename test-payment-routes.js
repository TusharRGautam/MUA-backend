const express = require('express');
const app = express();

// Middleware
app.use(express.json());

console.log('🔄 Loading payment routes...');
const paymentRoutes = require('./routes/paymentRoutes');
console.log('✅ Payment routes loaded successfully');

// Register payment routes
app.use('/api/payments', paymentRoutes);
console.log('✅ Payment routes registered successfully');

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is running' });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET /test');
  console.log('- GET /api/payments/test');
  console.log('- POST /api/payments/mock-payment');
  console.log('- POST /api/payments/update-booking-payment');
}); 