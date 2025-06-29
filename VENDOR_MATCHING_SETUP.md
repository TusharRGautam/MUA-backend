# Quick Setup Guide for Vendor Matching Test

## Prerequisites
1. **Backend server** must be running
2. **Database connection** must be working
3. **Test vendor data** should be in the database

## Step-by-Step Testing

### Option 1: Easy Setup (Windows)
```bash
cd MUA-backend
run_vendor_matching_test.bat
```

### Option 2: Manual Setup

#### 1. Start Backend Server
```bash
cd MUA-backend

# Method 1 - Using npm
npm start

# Method 2 - Direct node
node src/index.js

# Method 3 - Development mode
npm run dev
```

#### 2. Verify Server is Running
Open another terminal and test:
```bash
curl http://localhost:3000/api/ping
```

You should see:
```json
{
  "status": "ok",
  "message": "Backend API is reachable",
  "timestamp": "2024-01-25T10:30:00.000Z"
}
```

#### 3. Run Vendor Matching Test
```bash
cd MUA-backend
node test_vendor_matching.js
```

## Expected Test Output

✅ **Success Response:**
```
🎯 Testing Vendor Matching Booking System...
📤 Sending request to: http://localhost:3000/api/bookings
📋 Test booking data:
   - Services: bridal (₹5000), haircare (₹2000)
   - Total: ₹7000
   - Expected: Should find vendors with bridal/haircare categories

📡 Response Status: 201
✅ Parsed JSON Response:
{
  "success": true,
  "message": "Booking created successfully with vendor matching",
  "data": {
    "bookingId": "VM_TEST_1703567890123",
    "vendorMatchingResult": {
      "success": true,
      "vendorsNotified": 1,
      "selectedVendor": {
        "id": 35,
        "name": "Test Vendor",
        "email": "vendor@test.com",
        "phone": "9876543210"
      }
    }
  }
}

🎉 SUCCESS: Vendor Matching Booking System is working!
```

## Setting Up Test Data

If no vendors are found, you need test data:

### 1. Add Test Vendor
```sql
-- Insert into registration table first
INSERT INTO registration_and_other_details 
(sr_no, person_name, business_email, phone_number, verification_status, push_token)
VALUES 
(999, 'Test Vendor', 'test@vendor.com', '9876543210', 'verified', 'ExponentPushToken[test-token]');

-- Add vendor service categories
INSERT INTO ready_services_vendors_data 
(vendor_id, vendor_email, selected_categories, service_setup_type)
VALUES 
(999, 'test@vendor.com', '["bridal", "haircare", "mehendi"]', 'ready');
```

### 2. Verify Test Data
```sql
-- Check vendor exists
SELECT sr_no, person_name, verification_status FROM registration_and_other_details 
WHERE business_email = 'test@vendor.com';

-- Check vendor categories
SELECT vendor_id, selected_categories FROM ready_services_vendors_data 
WHERE vendor_email = 'test@vendor.com';
```

## Troubleshooting

### Error: "Request failed"
- ❌ **Problem**: Server not running
- ✅ **Solution**: Start server with `npm start` or `node src/index.js`

### Error: "No matching vendors found"
- ❌ **Problem**: No vendors with matching categories
- ✅ **Solution**: Add test vendor data (see above)

### Error: "Database connection failed"
- ❌ **Problem**: Database not configured
- ✅ **Solution**: Check database credentials in environment variables

### Error: "Module not found"
- ❌ **Problem**: Missing dependencies
- ✅ **Solution**: Run `npm install` in MUA-backend directory

## Environment Variables

Make sure these are set in your `.env` file or environment:
```bash
DB_USER=postgres
DB_HOST=localhost
DB_NAME=muadatabase
DB_PASSWORD=your_password
DB_PORT=5432

# OR use connection string
DATABASE_URL=postgresql://user:password@localhost:5432/muadatabase
```

## Next Steps After Testing

1. **Add Real Vendors**: Have vendors complete onboarding and select categories
2. **Test Frontend**: Use the app to book services and verify vendor matching
3. **Check Notifications**: Verify vendors receive push notifications
4. **Test Acceptance**: Have vendors accept/reject bookings via dashboard

## Support

If you encounter issues:
1. Check server logs for error messages
2. Verify database connection
3. Ensure test data exists
4. Review the full implementation guide: `VENDOR_MATCHING_IMPLEMENTATION.md` 