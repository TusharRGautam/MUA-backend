const Razorpay = require('razorpay');

// Razorpay configuration with test keys
const RAZORPAY_CONFIG = {
  key_id: 'rzp_test_y9k3HsO8QChLPC',
  key_secret: 'bhJVMx7yCYAGchimwLGhomWw',
  currency: 'INR',
  company_name: 'MUA Beauty Services',
  description: 'Beauty and wellness services booking',
  prefill: {
    name: '',
    email: '',
    contact: ''
  },
  notes: {
    address: 'MUA Beauty Services'
  },
  theme: {
    color: '#E75480'
  }
};

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_CONFIG.key_id,
  key_secret: RAZORPAY_CONFIG.key_secret
});

module.exports = {
  razorpay,
  RAZORPAY_CONFIG
}; 