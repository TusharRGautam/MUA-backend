# Vendor Details Implementation Guide

## Overview

This implementation adds vendor contact details storage to the `booking_all_details_of_user_to_vendor` table when a booking is accepted. The vendor's name, email, phone number, and address are automatically saved from the `registration_and_other_details` table.

## Database Schema Changes

### New Columns Added

The following columns have been added to the `booking_all_details_of_user_to_vendor` table:

```sql
-- vendor_name already exists from previous migrations
vendor_phone_number VARCHAR(20)    -- Vendor's phone number
vendor_email VARCHAR(255)          -- Vendor's email address  
vendor_address TEXT                -- Vendor's business address
```

### Migration Files

1. **`migrations/add_vendor_details_columns.sql`** - Main migration file
2. **`run_vendor_details_migration.js`** - Migration runner script

## Backend Implementation

### Modified Endpoints

#### 1. PUT `/api/vendor/bookings/:bookingId/status`

**What it does:**
- When booking status is updated to "accepted", fetches vendor details from `registration_and_other_details` table
- Saves vendor contact information to the booking record
- Provides fallback if vendor details are not found

**Database Query Flow:**
```sql
-- 1. Get vendor_id from booking if not provided
SELECT vendor_id FROM booking_all_details_of_user_to_vendor WHERE booking_id = ?

-- 2. Fetch vendor details
SELECT 
  person_name as vendor_name,
  business_email as vendor_email,
  phone_number as vendor_phone_number,
  COALESCE(business_address, '') as vendor_address
FROM registration_and_other_details 
WHERE sr_no = ?

-- 3. Update booking with vendor details
UPDATE booking_all_details_of_user_to_vendor 
SET 
  booking_status = 'accepted',
  vendor_name = ?,
  vendor_email = ?,
  vendor_phone_number = ?,
  vendor_address = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE booking_id = ?
```

#### 2. POST `/api/vendor/bookings/accept`

**What it does:**
- Dedicated endpoint for accepting bookings
- Automatically fetches and saves vendor details during acceptance
- Returns enhanced booking data with vendor information

**Enhanced Response:**
```json
{
  "success": true,
  "message": "Booking accepted successfully with vendor details saved",
  "booking": {
    "id": "booking123",
    "customer_name": "John Doe",
    "vendor_name": "Beauty Studio",
    "vendor_email": "studio@example.com",
    "vendor_phone_number": "+919876543210"
  }
}
```

## Frontend Implementation

### VendorBookingDashboard.tsx Updates

**Enhanced Booking Modal:**
- Added vendor information section in booking details modal
- Displays vendor contact details when available
- Organized information into logical sections:
  - Customer Information
  - Service Information  
  - Vendor Information (conditional)
  - Additional Information

**New Modal Sections:**
```typescript
// Vendor Information Section (conditionally rendered)
{(selectedBooking as any).vendor_name && (
  <View style={styles.modalSection}>
    <Text style={styles.modalSectionTitle}>Vendor Information</Text>
    // Vendor details display
  </View>
)}
```

## Usage Instructions

### 1. Running the Migration

```bash
# Navigate to backend directory
cd MUA-backend

# Run the migration (ensure database is running)
node run_vendor_details_migration.js
```

### 2. Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'booking_all_details_of_user_to_vendor' 
AND column_name LIKE 'vendor_%';
```

Expected output:
```
   vendor_address     | text
   vendor_email       | character varying
   vendor_name        | character varying
   vendor_phone_number| character varying
```

### 3. Testing the Implementation

**Test Booking Acceptance:**
```bash
# Test the booking acceptance endpoint
curl -X PUT http://localhost:3000/api/vendor/bookings/BOOKING_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted", "vendorId": "VENDOR_ID"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking status updated to accepted with vendor details saved",
  "booking": {
    "id": "booking123",
    "customer_name": "Customer Name",
    "vendor_id": "vendor456",
    "vendor_name": "Vendor Business Name",
    "vendor_email": "vendor@email.com",
    "vendor_phone_number": "+919876543210"
  }
}
```

## Database Configuration

### Environment Variables

Ensure these environment variables are set:

```bash
DB_HOST=localhost          # or your database host
DB_PORT=5432              # PostgreSQL port
DB_NAME=muadatabase       # your database name
DB_USER=postgres          # database user
DB_PASSWORD=your_password # database password
```

### Connection Fallbacks

The system includes multiple fallback strategies:

1. **Vendor Details Not Found:** Basic status update without vendor details
2. **Database Error:** Graceful error handling with logging
3. **Missing Vendor ID:** Automatic vendor ID lookup from booking

## Data Flow

```
1. User clicks "Accept" on booking
   ↓
2. Frontend calls PUT /api/vendor/bookings/:id/status
   ↓
3. Backend checks if status = 'accepted'
   ↓
4. If yes: Fetch vendor details from registration table
   ↓
5. Update booking with status + vendor details
   ↓
6. Return enhanced booking data
   ↓
7. Frontend displays updated booking with vendor info
```

## Error Handling

### Common Issues and Solutions

**1. Database Connection Failed**
```
Error: ECONNREFUSED ::1:5432
```
- Ensure PostgreSQL is running
- Check database configuration
- Verify network connectivity

**2. Vendor Details Not Found**
```
⚠️ Vendor details not found for ID: 123
```
- Booking will still be accepted
- Only status will be updated
- Check if vendor exists in registration table

**3. Migration Already Applied**
```
NOTICE: Column already exists
```
- Safe to ignore
- Migration is idempotent

## Performance Considerations

### Database Indexes

The migration adds indexes for better query performance:

```sql
CREATE INDEX idx_booking_vendor_email ON booking_all_details_of_user_to_vendor(vendor_email);
CREATE INDEX idx_booking_vendor_phone ON booking_all_details_of_user_to_vendor(vendor_phone_number);
```

### Query Optimization

- Vendor details are fetched only when booking is accepted
- Uses parameterized queries to prevent SQL injection
- Includes COALESCE for null handling

## Security Features

1. **SQL Injection Prevention:** Parameterized queries
2. **Data Validation:** Input validation on status values
3. **Authorization:** Vendor ID verification
4. **Error Handling:** No sensitive data in error messages

## Future Enhancements

### Potential Additions

1. **Vendor Profile Pictures:** Add vendor_profile_picture column
2. **Business Hours:** Store working hours in booking
3. **Location Coordinates:** Vendor latitude/longitude
4. **Rating Information:** Vendor rating at time of booking
5. **Service Categories:** Vendor specialization details

### API Extensions

```javascript
// Potential future endpoint
GET /api/vendor/bookings/:id/full-details
// Returns complete booking + vendor + customer details
```

## Troubleshooting

### Common Issues

**1. Frontend not showing vendor details**
- Check if booking status is 'accepted'
- Verify vendor_name field exists in booking data
- Check console for JavaScript errors

**2. Backend not saving vendor details**
- Check database logs for errors
- Verify vendor exists in registration table
- Ensure all required columns exist

**3. Migration fails**
- Check database connectivity
- Verify permissions for CREATE/ALTER operations
- Check if columns already exist

### Debug Commands

```bash
# Check table structure
node -e "console.log(require('./check_current_table_structure.js'))"

# Test database connection  
node test_db_connection.js

# Verify booking data
node -e "
const { query } = require('./db');
query('SELECT * FROM booking_all_details_of_user_to_vendor LIMIT 1')
  .then(r => console.log(r.rows))
  .catch(console.error);
"
```

## Support

For issues or questions:

1. Check the logs for detailed error messages
2. Verify database connectivity and permissions
3. Ensure all migrations have been run successfully
4. Test with a simple booking acceptance flow

## File Structure

```
MUA-backend/
├── migrations/
│   └── add_vendor_details_columns.sql
├── routes/
│   └── vendorBookingRoutes.js (modified)
├── run_vendor_details_migration.js
└── VENDOR_DETAILS_IMPLEMENTATION.md

MUA-frontend/
└── components/
    └── VendorBookingDashboard.tsx (modified)
``` 