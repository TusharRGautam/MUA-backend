const Razorpay = require('razorpay');

// Razorpay Configuration for Payouts
// Using the same test credentials from MUA-frontend
const RAZORPAY_CONFIG = {
  key_id: 'rzp_test_y9k3HsO8QChLPC',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_test_secret', // Add to .env file
  currency: 'INR',
  company_name: 'Carelook',
  webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret'
};

// Initialize Razorpay instance for payouts
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_CONFIG.key_id,
  key_secret: RAZORPAY_CONFIG.key_secret
});

// Payout split percentages
const PAYOUT_SPLIT = {
  VENDOR_PERCENTAGE: 0.75,  // 75% to vendor
  COMPANY_PERCENTAGE: 0.25  // 25% to company
};

// Company account details (configure these for actual payouts)
const COMPANY_ACCOUNT = {
  account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '2323230000000000', // Replace with your RazorpayX account number
  ifsc: 'COMPANY_IFSC_CODE',
  name: 'Carelook Company Account'
};

// Payout limits and configurations
const PAYOUT_LIMITS = {
  MIN_AMOUNT: 100, // Minimum payout amount in INR (1 rupee)
  MAX_AMOUNT: 1000000, // Maximum payout amount in INR (10 lakhs)
  MAX_RETRIES: 3, // Maximum retry attempts for failed payouts
  RETRY_DELAY: 30 * 60 * 1000 // 30 minutes delay between retries
};

/**
 * Calculate payout amounts for vendor and company
 */
const calculatePayoutSplit = (totalAmount) => {
  const vendorAmount = Math.round(totalAmount * PAYOUT_SPLIT.VENDOR_PERCENTAGE * 100) / 100;
  const companyAmount = Math.round(totalAmount * PAYOUT_SPLIT.COMPANY_PERCENTAGE * 100) / 100;
  
  return {
    vendorAmount,
    companyAmount,
    totalAmount
  };
};

/**
 * Validate payout amount
 */
const validatePayoutAmount = (amount) => {
  if (!amount || isNaN(amount)) {
    return { valid: false, error: 'Invalid amount provided' };
  }
  
  if (amount < PAYOUT_LIMITS.MIN_AMOUNT) {
    return { valid: false, error: `Amount must be at least ₹${PAYOUT_LIMITS.MIN_AMOUNT}` };
  }
  
  if (amount > PAYOUT_LIMITS.MAX_AMOUNT) {
    return { valid: false, error: `Amount cannot exceed ₹${PAYOUT_LIMITS.MAX_AMOUNT}` };
  }
  
  return { valid: true };
};

/**
 * Create Razorpay payout contact
 */
const createPayoutContact = async (contactDetails) => {
  try {
    console.log('📞 Creating Razorpay payout contact:', contactDetails);
    
    const contact = await razorpayInstance.contacts.create({
      name: contactDetails.name,
      email: contactDetails.email,
      contact: contactDetails.phone,
      type: 'vendor',
      reference_id: contactDetails.vendorId
    });
    
    console.log('✅ Payout contact created:', contact.id);
    return { success: true, contact };
    
  } catch (error) {
    console.error('❌ Error creating payout contact:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create payout contact' 
    };
  }
};

/**
 * Create Razorpay fund account
 */
const createFundAccount = async (contactId, accountDetails) => {
  try {
    console.log('🏦 Creating fund account for contact:', contactId);
    
    const fundAccount = await razorpayInstance.fundAccount.create({
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: {
        name: accountDetails.accountHolderName,
        ifsc: accountDetails.ifsc,
        account_number: accountDetails.accountNumber
      }
    });
    
    console.log('✅ Fund account created:', fundAccount.id);
    return { success: true, fundAccount };
    
  } catch (error) {
    console.error('❌ Error creating fund account:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create fund account' 
    };
  }
};

/**
 * Create Razorpay payout
 */
const createPayout = async (payoutData) => {
  try {
    console.log('💰 Creating Razorpay payout:', {
      fundAccountId: payoutData.fundAccountId,
      amount: payoutData.amount,
      currency: payoutData.currency || 'INR',
      mode: payoutData.mode || 'IMPS'
    });
    
    // Validate amount
    const validation = validatePayoutAmount(payoutData.amount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const payout = await razorpayInstance.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '2323230000000000', // Your RazorpayX account number
      fund_account_id: payoutData.fundAccountId,
      amount: Math.round(payoutData.amount * 100), // Convert to paise
      currency: payoutData.currency || 'INR',
      mode: payoutData.mode || 'IMPS',
      purpose: payoutData.purpose || 'payout',
      queue_if_low_balance: true,
      reference_id: payoutData.referenceId,
      narration: payoutData.narration || `Carelook payout - ${payoutData.referenceId}`
    });
    
    console.log('✅ Payout created successfully:', payout.id);
    return { success: true, payout };
    
  } catch (error) {
    console.error('❌ Error creating payout:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create payout' 
    };
  }
};

/**
 * Get payout status
 */
const getPayoutStatus = async (payoutId) => {
  try {
    console.log('🔍 Fetching payout status for:', payoutId);
    
    const payout = await razorpayInstance.payouts.fetch(payoutId);
    
    console.log('✅ Payout status fetched:', payout.status);
    return { success: true, payout };
    
  } catch (error) {
    console.error('❌ Error fetching payout status:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch payout status' 
    };
  }
};

/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret || RAZORPAY_CONFIG.webhook_secret)
      .update(payload)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Map Razorpay payout status to our internal status
 */
const mapPayoutStatus = (razorpayStatus) => {
  switch (razorpayStatus) {
    case 'queued':
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'processed':
      return 'settled';
    case 'failed':
    case 'cancelled':
    case 'rejected':
      return 'failed';
    default:
      return 'pending';
  }
};

/**
 * Generate payout reference ID
 */
const generatePayoutReference = (bookingId, type = 'vendor') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 4);
  return `${type}_${bookingId}_${timestamp}_${random}`;
};

/**
 * Format amount for display
 */
const formatAmount = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Log payout activity for debugging
 */
const logPayoutActivity = (activity, data, level = 'info') => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    activity,
    data,
    level
  };
  
  console.log(`[RAZORPAY PAYOUT ${level.toUpperCase()}] ${timestamp}:`, logEntry);
  
  // In production, you might want to store this in a database or file
  return logEntry;
};

module.exports = {
  razorpayInstance,
  RAZORPAY_CONFIG,
  PAYOUT_SPLIT,
  COMPANY_ACCOUNT,
  PAYOUT_LIMITS,
  calculatePayoutSplit,
  validatePayoutAmount,
  createPayoutContact,
  createFundAccount,
  createPayout,
  getPayoutStatus,
  verifyWebhookSignature,
  mapPayoutStatus,
  generatePayoutReference,
  formatAmount,
  logPayoutActivity
};