# Booking Implementation Guide

## Overview

This guide documents the complete booking system implementation that saves all booking details from the frontend (top-artist-profile.tsx) to the backend database table `booking_all_details_of_user_to_vendor`.

## Implementation Components

### 1. Backend API Routes (`/routes/bookingRoutes.js`)

New booking API endpoints:

- **POST** `/api/bookings` - Create a new booking
- **GET** `/api/bookings/:bookingId` - Get booking by ID
- **GET** `/api/bookings/user/:userId` - Get user's bookings
- **PUT** `/api/bookings/:bookingId/status` - Update booking status
- **GET** `/api/bookings` - Get all bookings (with filters)

### 2. Database Table Enhancement

Enhanced `booking_all_details_of_user_to_vendor` table with new fields:

```sql
-- New fields added:
- booking_id VARCHAR(50) UNIQUE
- booking_date_month DATE
- booking_time_slot VARCHAR(20)
- vendor_name VARCHAR(255)
- user_name VARCHAR(255)
- services_booked JSONB
- final_amount DECIMAL(10, 2)
- booking_date DATE
- booking_time TIME
- payment_method VARCHAR(50)
- service_category VARCHAR(100)
```

### 3. Frontend Integration

Updated components:
- `top-artist-profile.tsx` - Enhanced cart items with vendor info
- `ServicesBookingProcessConfirmation.tsx` - Added backend booking save
- `my-bookings.tsx` - Fetch from both backend and local storage

## Data Flow

### 1. Service Selection (top-artist-profile.tsx)

When user adds services to cart from Top Artists, Hair Color Specialists, or Mehendi sections:

```typescript
const cartItem = {
  id: service.id,
  name: service.name,
  price: service.price,
  artistId: artistId?.toString(),
  artistName: vendorName,
  serviceType: 'artist',
  category: service.category,
  // ... other details
};
```

### 2. Booking Creation (ServicesBookingProcessConfirmation.tsx)

```typescript
const bookingDataForBackend = {
  bookingId: `BK${Date.now()}`,
  items: items.map(item => ({...item})),
  selectedDate,
  selectedTime,
  paymentMethod,
  totalAmount,
  customerName: 'Guest User',
  customerEmail: '',
  customerPhone: '',
  address: '',
  userId: null
};

// Save to backend
const response = await fetch('http://192.168.0.102:3000/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingDataForBackend),
});
```

### 3. Data Storage

Backend processes each service item and creates records in:

1. **booking_all_details_of_user_to_vendor** - Complete booking details
2. **vendor_bookings** - For vendor dashboard notifications

## Database Schema

### booking_all_details_of_user_to_vendor Table

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-increment ID |
| booking_id | VARCHAR(50) | Unique booking identifier |
| user_id | INTEGER | User ID (if available) |
| vendor_id | INTEGER | Vendor/Artist ID |
| vendor_name | VARCHAR(255) | Vendor/Artist name |
| user_name | VARCHAR(255) | Customer name |
| service_name | VARCHAR(255) | Service name |
| service_type | VARCHAR(100) | Service type/category |
| services_booked | JSONB | Detailed service information |
| total_amount | DECIMAL(10,2) | Service amount |
| final_amount | DECIMAL(10,2) | Final amount after taxes |
| booking_date | DATE | Scheduled service date |
| booking_time | TIME | Scheduled service time |
| booking_date_month | DATE | Same as booking_date |
| booking_time_slot | VARCHAR(20) | Time slot (e.g., "10:00 - 11:00") |
| payment_method | VARCHAR(50) | Payment method |
| service_category | VARCHAR(100) | Service category |
| customer_name | VARCHAR(100) | Customer name |
| customer_email | VARCHAR(255) | Customer email |
| customer_phone | VARCHAR(20) | Customer phone |
| address | TEXT | Customer address |
| status | VARCHAR(50) | Booking status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

## API Usage Examples

### Create Booking

```bash
POST /api/bookings
Content-Type: application/json

{
  "bookingId": "BK1734567890123",
  "items": [
    {
      "id": "1",
      "name": "Bridal Makeup",
      "price": 5000,
      "quantity": 1,
      "artistId": "123",
      "artistName": "Beauty Artist",
      "category": "Makeup"
    }
  ],
  "selectedDate": "2024-02-15",
  "selectedTime": "10:00",
  "paymentMethod": "upi",
  "totalAmount": 5000,
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "customerPhone": "+91 9876543210",
  "address": "123 Main St, Mumbai"
}
```

### Get Booking

```bash
GET /api/bookings/BK1734567890123
```

### Get User Bookings

```bash
GET /api/bookings/user/123?status=pending
```

### Update Booking Status

```bash
PUT /api/bookings/BK1734567890123/status
Content-Type: application/json

{
  "status": "confirmed"
}
```

## Installation & Setup

### 1. Run Database Migration

```bash
cd MUA-backend
node run_booking_enhancement_migration.js
```

### 2. Update Backend Routes

Make sure `app.js` includes:

```javascript
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);
```

### 3. Frontend Changes

All frontend changes are already implemented in:
- `top-artist-profile.tsx`
- `ServicesBookingProcessConfirmation.tsx`
- `my-bookings.tsx`

## Data Captured

The system now captures all required booking information:

✅ **Services** - Multiple services with detailed information
✅ **Payment Method** - UPI, Card, Wallet, Cash
✅ **Booking ID** - Unique identifier
✅ **Booking Date** - Scheduled service date
✅ **Booking Time** - Scheduled service time
✅ **Phone Number** - Customer contact
✅ **Address** - Service location
✅ **Customer Name** - Booking user's name
✅ **Service Category** - Makeup, Haircare, Mehendi, etc.
✅ **Vendor Information** - Artist/Salon details
✅ **Payment Amount** - Total and final amounts
✅ **Booking Status** - pending, confirmed, completed

## Admin Dashboard Access

Admins can now track complete booking information through:

1. **Direct Database Queries**:
   ```sql
   SELECT * FROM booking_all_details_of_user_to_vendor 
   WHERE booking_date >= CURRENT_DATE 
   ORDER BY created_at DESC;
   ```

2. **API Endpoints**:
   ```bash
   GET /api/bookings?status=pending&limit=50
   GET /api/bookings?vendorId=123
   ```

3. **Vendor Dashboard**: Vendors see bookings in their dashboard via `vendor_bookings` table

## Error Handling

The system includes comprehensive error handling:

- **Backend Failures**: Bookings save to local storage as backup
- **Network Issues**: Graceful degradation to offline mode
- **Data Validation**: Required field validation on backend
- **Duplicate Prevention**: Unique booking IDs prevent duplicates

## Performance Optimizations

- **Database Indexes**: Added for vendor_id, user_id, status, date, category
- **Efficient Queries**: Optimized SQL with proper filtering
- **Batch Operations**: Multiple services processed efficiently
- **Caching**: Local storage serves as cache layer

## Monitoring & Logging

The system includes detailed logging:

- **Booking Creation**: Full request/response logging
- **Error Tracking**: Comprehensive error messages
- **Performance Metrics**: Query execution times
- **User Actions**: Cart additions and checkout flow

## Future Enhancements

Potential improvements:

1. **User Authentication**: Integrate with user login system
2. **Real-time Updates**: WebSocket notifications for status changes
3. **Analytics Dashboard**: Booking trends and vendor performance
4. **Payment Integration**: Actual payment gateway integration
5. **Customer Feedback**: Post-service rating and review system

## Troubleshooting

### Common Issues

1. **Database Connection**: Check PostgreSQL connection settings
2. **Table Missing**: Run the migration script
3. **API Errors**: Check backend logs for detailed error messages
4. **Frontend Issues**: Check browser console for network errors

### Support

For technical support or questions about this implementation, refer to:
- Backend logs in `MUA-backend/`
- Frontend console logs
- Database error messages
- Network request/response details 