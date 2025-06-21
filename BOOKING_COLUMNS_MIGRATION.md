# Booking Columns Migration

## Overview

This migration adds three new columns to the `booking_all_details_of_user_to_vendor` table to enhance booking management capabilities.

## Migration Date
January 15, 2024

## Added Columns

### 1. booking_id
- **Type**: VARCHAR(50) UNIQUE
- **Purpose**: Stores a unique identifier for each booking
- **Example**: 'BK_2024_001', 'BOOKING_123456'
- **Use Case**: Quick lookup and reference for bookings

### 2. booking_date_month
- **Type**: DATE
- **Purpose**: Stores the selected booking date and month for the service
- **Example**: '2024-02-15'
- **Use Case**: Date-based filtering and calendar integration

### 3. booking_time_slot
- **Type**: VARCHAR(20)
- **Purpose**: Stores the chosen time slot for the service
- **Example**: '10:00 AM - 11:00 AM', '14:30-15:30'
- **Use Case**: Time slot management and scheduling

## Migration Files

1. **SQL Migration**: `migrations/add_booking_columns.sql`
2. **Runner Script**: `run_booking_columns_migration.js`
3. **Verification Script**: `verify_booking_columns.js`

## Database Indexes

The migration also creates indexes for better query performance:

- `idx_booking_all_details_booking_id` - Index on booking_id column
- `idx_booking_all_details_date` - Index on booking_date_month column

## Usage Examples

### Insert New Booking
```sql
INSERT INTO booking_all_details_of_user_to_vendor 
(
  user_id, vendor_id, vendor_name, user_name, services_booked, 
  total_amount, final_amount, booking_date, booking_time,
  booking_id, booking_date_month, booking_time_slot
)
VALUES 
(
  123, 456, 'Beauty Salon', 'John Doe', '{"services": ["Haircut", "Facial"]}',
  1500.00, 1350.00, '2024-02-15', '10:00:00',
  'BK_2024_001', '2024-02-15', '10:00 AM - 11:00 AM'
);
```

### Query by Booking ID
```sql
SELECT * FROM booking_all_details_of_user_to_vendor 
WHERE booking_id = 'BK_2024_001';
```

### Query by Date Range
```sql
SELECT * FROM booking_all_details_of_user_to_vendor 
WHERE booking_date_month BETWEEN '2024-02-01' AND '2024-02-28';
```

### Query by Time Slot
```sql
SELECT * FROM booking_all_details_of_user_to_vendor 
WHERE booking_time_slot LIKE '%10:00 AM%';
```

## API Integration

These new columns can be used in your booking APIs:

### Backend Controller Example
```javascript
// Create a new booking
const createBooking = async (req, res) => {
  const {
    user_id,
    vendor_id,
    booking_id,
    booking_date_month,
    booking_time_slot,
    // ... other fields
  } = req.body;

  const query = `
    INSERT INTO booking_all_details_of_user_to_vendor 
    (user_id, vendor_id, booking_id, booking_date_month, booking_time_slot, ...)
    VALUES ($1, $2, $3, $4, $5, ...)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    user_id, vendor_id, booking_id, booking_date_month, booking_time_slot
  ]);

  res.json(result.rows[0]);
};
```

### Frontend Usage Example
```javascript
// Create booking with new fields
const bookingData = {
  user_id: 123,
  vendor_id: 456,
  booking_id: generateBookingId(), // 'BK_2024_001'
  booking_date_month: selectedDate, // '2024-02-15'
  booking_time_slot: selectedTimeSlot, // '10:00 AM - 11:00 AM'
  // ... other booking details
};

const response = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData)
});
```

## Running the Migration

### Initial Migration
```bash
node run_booking_columns_migration.js
```

### Verification
```bash
node verify_booking_columns.js
```

## Migration Features

- ✅ Safe migration (checks if columns already exist)
- ✅ Creates table if it doesn't exist
- ✅ Adds indexes for performance
- ✅ Includes proper column comments
- ✅ Adds triggers for updated_at timestamp
- ✅ Comprehensive verification

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the added columns
ALTER TABLE booking_all_details_of_user_to_vendor 
DROP COLUMN IF EXISTS booking_id,
DROP COLUMN IF EXISTS booking_date_month,
DROP COLUMN IF EXISTS booking_time_slot;

-- Remove the indexes
DROP INDEX IF EXISTS idx_booking_all_details_booking_id;
DROP INDEX IF EXISTS idx_booking_all_details_date;
```

## Notes

- The `booking_id` column has a UNIQUE constraint to ensure no duplicate booking IDs
- All new columns are nullable to maintain compatibility with existing data
- The migration is idempotent and can be run multiple times safely
- Proper indexing is included for optimal query performance

## Support

For any issues with this migration, check:
1. Database connection settings in `.env` file
2. PostgreSQL version compatibility
3. Run the verification script to confirm column existence 