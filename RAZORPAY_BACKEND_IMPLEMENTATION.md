# Razorpay Payout Backend Implementation

## 🎯 Overview
Complete backend implementation for Razorpay payout integration supporting 75%/25% split between vendors and company. This implementation follows the requirements from the dashboard-app implementation steps.

## 📁 Files Created

### 1. Configuration Files
- **`config/razorpayPayout.js`** - Razorpay payout configuration and utilities
- **`.env.razorpay.template`** - Environment variables template

### 2. Service Layer
- **`services/payoutService.js`** - Core payout processing business logic

### 3. API Routes
- **`routes/razorpayPayoutRoutes.js`** - All payout-related API endpoints

### 4. Testing & Setup
- **`test_razorpay_payout_api.js`** - Comprehensive API testing suite
- **`setup_razorpay_payout.js`** - Automated setup and verification script

## 🚀 Quick Start

### 1. Run Setup Script
```bash
cd MUA-backend
node setup_razorpay_payout.js
```

### 2. Update Environment Variables
```bash
# Copy and edit the environment file
cp .env.razorpay.template .env
# Edit .env with your actual Razorpay credentials
```

### 3. Install Dependencies
```bash
npm install razorpay
```

### 4. Test the Implementation
```bash
node test_razorpay_payout_api.js
```

## 🔌 API Endpoints

### Payout Processing
```http
POST /api/vendor/razorpay-payout
Content-Type: application/json

{
  "bookingId": "BK1234567890",
  "vendorId": "123",
  "totalAmount": 1000,
  "razorpayPaymentId": "pay_ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payout split processed successfully",
  "data": {
    "bookingId": "BK1234567890",
    "vendorAmount": 750,
    "companyAmount": 250,
    "status": "processing",
    "vendorTransferId": "pout_ABC123"
  }
}
```

### Vendor Earnings
```http
GET /api/vendor/earnings/{vendorId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarnings": 15000,
    "settledAmount": 10000,
    "processingAmount": 3000,
    "pendingAmount": 2000,
    "todayEarnings": 750,
    "thisWeekEarnings": 5250,
    "thisMonthEarnings": 15000,
    "recentTransactions": [...]
  }
}
```

### Payout Transactions History
```http
GET /api/vendor/payout-transactions/{vendorId}?limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "bookingId": "BK1234567890",
      "customerName": "John Doe",
      "serviceName": "Hair Cut",
      "amount": 1000,
      "vendorAmount": 750,
      "status": "settled",
      "paymentId": "pay_ABC123",
      "transferId": "pout_XYZ789",
      "settlementDate": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-15T09:00:00Z"
    }
  ]
}
```

### Retry Failed Payout
```http
POST /api/vendor/retry-payout
Content-Type: application/json

{
  "bookingId": "BK1234567890",
  "vendorId": "123"
}
```

### Razorpay Webhook Handler
```http
POST /api/vendor/razorpay-webhook
X-Razorpay-Signature: {webhook_signature}
Content-Type: application/json

{
  "event": "payout.processed",
  "payload": {
    "payout": {
      "entity": {
        "id": "pout_ABC123",
        "status": "processed"
      }
    }
  }
}
```

### Configuration & Testing
```http
GET /api/vendor/payout-config    # Get payout configuration
GET /api/vendor/payout-test      # Test API connectivity
```

## 💰 Payout Flow Implementation

### 1. Service Completion Trigger
When vendor completes a service in dashboard-app:
```
1. Booking status → 'completed'
2. Call POST /api/vendor/razorpay-payout
3. Backend processes 75%/25% split
4. Updates database with payout details
```

### 2. Payout Processing Logic
```javascript
// Automatic split calculation
const vendorAmount = totalAmount * 0.75;  // 75%
const companyAmount = totalAmount * 0.25; // 25%

// Create Razorpay payout
const vendorPayout = await razorpay.payouts.create({
  fund_account_id: vendorFundAccount,
  amount: vendorAmount * 100, // Convert to paise
  currency: 'INR',
  mode: 'IMPS'
});
```

### 3. Database Updates
```sql
UPDATE booking_all_details_of_user_to_vendor 
SET 
  vendor_amount = 750,
  vendor_company_amount = 250,
  vendor_settlement_status = 'processing',
  vendor_razorpay_transfer_id_vendor = 'pout_ABC123'
WHERE booking_id = 'BK1234567890';
```

## 🗄️ Database Schema

### New Columns Added
```sql
ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN
  vendor_razorpay_payment_id VARCHAR(255),
  vendor_razorpay_transfer_id_vendor VARCHAR(255),
  vendor_razorpay_transfer_id_company VARCHAR(255),
  vendor_settlement_status VARCHAR(20) DEFAULT 'pending',
  vendor_amount DECIMAL(10,2),
  vendor_company_amount DECIMAL(10,2),
  vendor_settlement_date TIMESTAMP,
  vendor_error_code VARCHAR(50),
  vendor_error_description TEXT,
  vendor_payout_initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  vendor_last_payout_retry TIMESTAMP;
```

### Indexes Created
```sql
CREATE INDEX idx_vendor_settlement_status ON booking_all_details_of_user_to_vendor(vendor_settlement_status);
CREATE INDEX idx_vendor_settlement_date ON booking_all_details_of_user_to_vendor(vendor_settlement_date);
CREATE INDEX idx_vendor_payment_id ON booking_all_details_of_user_to_vendor(vendor_razorpay_payment_id);
```

## 🔧 Configuration

### Environment Variables
```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_y9k3HsO8QChLPC
RAZORPAY_KEY_SECRET=your_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=muadatabase
DB_PASSWORD=tushar123
DB_PORT=5432

# Payout Configuration
MIN_PAYOUT_AMOUNT=100
MAX_PAYOUT_AMOUNT=1000000
PAYOUT_MODE=IMPS
```

### Razorpay Settings
```javascript
const PAYOUT_SPLIT = {
  VENDOR_PERCENTAGE: 0.75,  // 75%
  COMPANY_PERCENTAGE: 0.25  // 25%
};

const PAYOUT_LIMITS = {
  MIN_AMOUNT: 100,          // ₹1
  MAX_AMOUNT: 1000000,      // ₹10,00,000
  MAX_RETRIES: 3,
  RETRY_DELAY: 30 * 60 * 1000 // 30 minutes
};
```

## 🔔 Webhook Integration

### Webhook URL
```
https://yourdomain.com/api/vendor/razorpay-webhook
```

### Supported Events
- `payout.processed` - Payout completed successfully
- `payout.failed` - Payout failed
- `payout.rejected` - Payout rejected

### Webhook Processing
1. **Signature Verification** - Validates Razorpay webhook signature
2. **Status Update** - Updates database with settlement status
3. **Vendor Notification** - Can trigger push notifications (future enhancement)

## 🛡️ Security Features

### 1. Input Validation
- Amount validation (min/max limits)
- Required field validation
- SQL injection prevention

### 2. Authentication
- Bearer token authentication for API calls
- Vendor ID verification
- Booking ownership validation

### 3. Rate Limiting
- Retry cooldown period (30 minutes)
- Maximum retry attempts (3 times)
- API request throttling

### 4. Error Handling
- Graceful error responses
- Detailed logging for debugging
- Rollback on transaction failures

## 📊 Monitoring & Logging

### Activity Logging
```javascript
logPayoutActivity('payout_split_initiated', {
  bookingId: 'BK123',
  vendorId: '456',
  amount: 1000
});
```

### Error Tracking
- Database constraint violations
- Razorpay API failures
- Network connectivity issues
- Invalid configuration errors

## 🧪 Testing

### Automated Test Suite
```bash
node test_razorpay_payout_api.js
```

**Tests Include:**
- ✅ API connectivity
- ✅ Database schema validation  
- ✅ Payout configuration
- ✅ Vendor earnings calculation
- ✅ Transaction history
- ✅ Error handling
- ✅ Webhook processing

### Manual Testing Endpoints
```http
GET /api/vendor/payout-test        # System health check
GET /api/vendor/payout-config      # Configuration validation
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Run database migration
- [ ] Update environment variables
- [ ] Test all API endpoints
- [ ] Configure Razorpay webhooks
- [ ] Set up monitoring and logging

### Production Setup
- [ ] Use production Razorpay keys
- [ ] Enable HTTPS for webhooks
- [ ] Configure proper database backups
- [ ] Set up alert monitoring
- [ ] Test payout with small amounts

### Vendor Onboarding
- [ ] Collect bank account details
- [ ] Verify account information
- [ ] Test payout with minimum amount
- [ ] Configure notification preferences

## 🔄 Integration with Dashboard-App

The backend APIs integrate seamlessly with the dashboard-app implementation:

1. **Complete Button** → Calls `POST /api/vendor/razorpay-payout`
2. **Earnings Dashboard** → Calls `GET /api/vendor/earnings/:vendorId`
3. **Transaction History** → Calls `GET /api/vendor/payout-transactions/:vendorId`
4. **Retry Failed** → Calls `POST /api/vendor/retry-payout`

## 📞 Support & Maintenance

### Common Issues
1. **Payout Failed** - Check bank account details and Razorpay balance
2. **Webhook Not Working** - Verify URL and signature validation
3. **Database Errors** - Check connection and migration status
4. **API Timeouts** - Increase timeout limits and check network

### Maintenance Tasks
- **Weekly**: Review failed payouts and retry
- **Monthly**: Analyze payout patterns and performance
- **Quarterly**: Update dependencies and security patches

---

## 🎉 Implementation Complete!

The backend implementation provides:
- ✅ Complete 75%/25% payout split functionality
- ✅ Comprehensive API endpoints for all operations
- ✅ Robust error handling and retry mechanisms  
- ✅ Real-time webhook integration
- ✅ Detailed logging and monitoring
- ✅ Production-ready security features
- ✅ Automated testing suite
- ✅ Easy setup and deployment scripts

**Ready for production use with proper Razorpay credentials!**