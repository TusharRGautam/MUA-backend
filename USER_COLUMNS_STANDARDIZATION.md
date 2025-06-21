# User Columns Standardization

## Overview
This document describes the standardization of user-related columns in the `booking_all_details_of_user_to_vendor` table to ensure all user-related columns have the `user_` prefix for consistency.

## Current Issues
Some user-related columns in the table don't follow the `user_` prefix convention:
- `location_address` should be `user_address`
- `customer_name` should use `user_name` (if not already present)
- `customer_email` should use `user_email` (if not already present)
- `customer_phone` should use `user_phone` (if not already present)
- `latitude` and `longitude` should be `user_latitude` and `user_longitude`

## Standardized Column Structure

### User-Related Columns (with user_ prefix):
- ✅ `user_id` - User identifier
- ✅ `user_name` - User's full name
- ✅ `user_email` - User's email address
- ✅ `user_phone` - User's phone number
- 🔄 `user_address` - User's address (renamed from `location_address`)
- ➕ `user_city` - User's city
- ➕ `user_postal_code` - User's postal code
- ➕ `user_device_id` - User's device identifier
- 🔄 `user_latitude` - User's location latitude (renamed from `latitude`)
- 🔄 `user_longitude` - User's location longitude (renamed from `longitude`)

### Vendor-Related Columns (with vendor_ prefix):
- ✅ `vendor_id` - Vendor identifier
- ✅ `vendor_name` - Vendor's name
- ✅ `vendor_email` - Vendor's email
- ✅ `vendor_business_type` - Type of vendor business

### Booking-Related Columns:
- ✅ `booking_reference` - Unique booking reference
- ✅ `booking_date` - Date of booking
- ✅ `booking_time` - Time of booking
- ✅ `booking_status` - Status of booking
- ✅ `booking_notes` - Additional booking notes
- ✅ `booking_date_month` - Booking date for filtering
- ✅ `booking_time_slot` - Time slot for booking

### Payment & Service Columns:
- ✅ `payment_method` - Payment method used
- ✅ `payment_status` - Payment status
- ✅ `service_type` - Type of service
- ✅ `service_category` - Service category
- ✅ `services_booked` - JSON of booked services
- ✅ `total_amount` - Total booking amount
- ✅ `final_amount` - Final amount after discounts

## Manual Migration SQL Commands

Since the automated migration script requires database connection, here are the manual SQL commands to run:

```sql
-- 1. Rename location_address to user_address
ALTER TABLE booking_all_details_of_user_to_vendor 
RENAME COLUMN location_address TO user_address;

-- 2. Rename latitude to user_latitude (if exists)
ALTER TABLE booking_all_details_of_user_to_vendor 
RENAME COLUMN latitude TO user_latitude;

-- 3. Rename longitude to user_longitude (if exists)
ALTER TABLE booking_all_details_of_user_to_vendor 
RENAME COLUMN longitude TO user_longitude;

-- 4. Add missing user columns
ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_city VARCHAR(100);

ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_postal_code VARCHAR(20);

ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_device_id VARCHAR(255);

-- 5. Add comments for documentation
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_address IS 'User''s address for the booking';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_city IS 'User''s city';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_postal_code IS 'User''s postal code';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_device_id IS 'User''s device ID';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_latitude IS 'User''s location latitude';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_longitude IS 'User''s location longitude';

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_user_id 
ON booking_all_details_of_user_to_vendor(user_id);

CREATE INDEX IF NOT EXISTS idx_booking_user_email 
ON booking_all_details_of_user_to_vendor(user_email);

CREATE INDEX IF NOT EXISTS idx_booking_user_phone 
ON booking_all_details_of_user_to_vendor(user_phone);
```

## Updated Backend Code

The booking route has been updated to use the standardized column names:

### New Insert Query Structure:
```javascript
INSERT INTO booking_all_details_of_user_to_vendor (
  booking_reference,
  user_id,
  user_name,
  user_email,
  user_phone,
  user_address,           // ← Standardized from location_address
  user_city,              // ← New column
  user_device_id,         // ← New column
  vendor_id,
  vendor_name,
  services_booked,
  total_amount,
  final_amount,
  booking_date,
  booking_time,
  booking_status,
  payment_status,
  payment_method,
  booking_notes,
  service_type,
  service_category,
  booking_date_month,
  booking_time_slot
) VALUES (...)
```

## Benefits of Standardization

1. **Consistency**: All user-related data uses the `user_` prefix
2. **Clarity**: Easy to identify which columns contain user data
3. **Maintainability**: Easier to manage and update user-related columns
4. **Scalability**: New user columns can follow the same naming convention
5. **Query Optimization**: Better indexing on user-related columns

## Testing

After applying the migration:

1. **Test Booking Creation**: Ensure new bookings are saved with the standardized column names
2. **Test Data Retrieval**: Verify that existing data is accessible with new column names
3. **Test Frontend Integration**: Confirm that the frontend booking flow works correctly
4. **Verify Admin Dashboard**: Check that admin can view booking data properly

## Next Steps

1. Run the manual SQL commands in your database
2. Test the booking functionality from the frontend
3. Verify that all user data is properly stored and retrieved
4. Monitor for any issues and make adjustments as needed

This standardization will make the database more consistent and easier to work with for future development. 