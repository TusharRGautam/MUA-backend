# Booking Notification System Implementation Guide

## Overview

This document provides a complete implementation guide for the booking notification system and real-time vendor dashboard integration. The system provides real-time push notifications to vendors when new bookings are made, along with a comprehensive dashboard to manage bookings.

## System Architecture

### Backend Components

1. **Vendor Notification Service** (`services/vendorNotificationService.js`)
   - Handles push notification delivery to vendors
   - Manages notification history and read status
   - Integrates with Expo Push Notification service

2. **Vendor Booking Routes** (`routes/vendorBookingRoutes.js`)
   - Syncs data from `booking_all_details_of_user_to_vendor` table
   - Provides real-time booking data to vendor dashboard
   - Handles booking status updates (accept/deny)

3. **Vendor Push Token Routes** (`routes/vendorPushTokenRoutes.js`)
   - Manages vendor push notification token registration
   - Provides token management endpoints
   - Includes test notification functionality

4. **Optimized Image Service** (`utils/optimizedImageService.js`)
   - Handles Google Drive image optimization
   - Provides caching for improved performance
   - Middleware for automatic image URL conversion

### Frontend Components

1. **VendorBookingDashboard** (`components/VendorBookingDashboard.tsx`)
   - Real-time booking dashboard with auto-refresh
   - Booking filtering and search functionality
   - Accept/deny booking actions
   - Notification management

2. **Vendor Push Notification Service** (`services/vendorPushNotificationService.ts`)
   - Handles push notification registration
   - Manages notification permissions
   - Provides hooks for easy component integration

## Implementation Details

### 1. Booking Flow with Notifications

When a user books a service through `top-artist-profile.tsx`:

1. **Booking Creation** (`bookingRoutes.js` line 158-188):
   ```javascript
   // After successful booking creation
   const vendorBookings = items.reduce((acc, item) => {
     const vendorId = item.vendorId;
     if (!acc[vendorId]) {
       acc[vendorId] = [];
     }
     acc[vendorId].push(item);
     return acc;
   }, {});

   // Send notification to each vendor
   for (const [vendorId, vendorItems] of Object.entries(vendorBookings)) {
     const totalAmount = vendorItems.reduce((sum, item) => sum + parseFloat(item.price || '0'), 0);
     const serviceNames = vendorItems.map(item => item.serviceName).join(', ');
     
     await sendBookingNotification(vendorId, {
       bookingId,
       customerName: finalCustomUserId,
       serviceNames,
       totalAmount,
       bookingDate: selectedDate,
       bookingTime: selectedTime,
       message: `You have a new booking. Please accept it. Earning: ₹${totalAmount}`
     });
   }
   ```

2. **Push Notification Delivery**:
   - Notification sent via Expo Push API
   - Includes booking details and earning amount
   - Stored in vendor notifications table for history

### 2. Real-time Dashboard Integration

The vendor dashboard (`business-dashboard.tsx`) now uses:

```typescript
<VendorBookingDashboard 
  vendorId={businessData?.id?.toString() || '1'}
  onBookingAction={(bookingId, action) => {
    console.log(`Booking ${bookingId} ${action}ed`);
    loadBusinessData();
  }}
/>
```

Features:
- **Auto-refresh**: Updates every 30 seconds
- **Real-time sync**: Pulls from `booking_all_details_of_user_to_vendor`
- **Action handling**: Accept/deny bookings with immediate feedback
- **Notification badges**: Shows new booking counts

### 3. Data Synchronization

**Backend Sync Process** (`vendorBookingRoutes.js`):
```javascript
// Sync bookings from booking_all_details_of_user_to_vendor to vendor_bookings
const getAllBookingsQuery = `
  SELECT DISTINCT
    booking_id,
    user_id as customer_id,
    vendor_id,
    service_name,
    service_price,
    booking_date,
    booking_time,
    booking_status,
    created_at,
    user_address,
    user_phone,
    additional_notes
  FROM booking_all_details_of_user_to_vendor 
  ORDER BY created_at DESC
`;
```

**Frontend Data Flow**:
1. Component mounts → Load bookings
2. Auto-refresh timer → Update every 30s
3. User action → Immediate API call + refresh
4. Pull-to-refresh → Manual sync trigger

## API Endpoints

### Booking Management
- `GET /api/vendor/bookings/:vendorId` - Get vendor bookings
- `POST /api/vendor/bookings/accept` - Accept booking
- `PUT /api/vendor/bookings/:bookingId/status` - Update booking status
- `GET /api/vendor/bookings/sync` - Sync from main booking table

### Push Notifications
- `POST /api/vendor/push-token/register` - Register push token
- `PUT /api/vendor/push-token/update` - Update push token
- `DELETE /api/vendor/push-token/unregister` - Remove push token
- `GET /api/vendor/push-token/status/:vendorId` - Get token status
- `POST /api/vendor/push-token/test` - Send test notification

### Notification History
- `GET /api/vendor/bookings/notifications/:vendorId` - Get notifications
- `PUT /api/vendor/bookings/notifications/:notificationId/read` - Mark as read

## Database Schema Updates

### Required Columns for Push Notifications

```sql
-- Add to registration_and_other_details table
ALTER TABLE registration_and_other_details 
ADD COLUMN push_token TEXT,
ADD COLUMN device_info JSONB,
ADD COLUMN push_token_updated_at TIMESTAMP DEFAULT NOW();

-- Create vendor notifications table
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES registration_and_other_details(sr_no),
  booking_id TEXT,
  notification_type VARCHAR(50) DEFAULT 'booking',
  title TEXT,
  message TEXT,
  data JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  delivery_status VARCHAR(20) DEFAULT 'pending'
);
```

## Notification Message Format

**Push Notification Structure**:
```javascript
{
  to: vendorPushToken,
  sound: 'default',
  title: 'New Booking Request!',
  body: 'You have a new booking. Please accept it. Earning: ₹2000',
  data: {
    bookingId: 'BK_1234567890',
    customerId: 'user123',
    serviceNames: 'Bridal Makeup, Hair Styling',
    totalAmount: 2000,
    bookingDate: '2024-01-15',
    bookingTime: '10:00',
    type: 'booking_request'
  },
  badge: 1,
  priority: 'high'
}
```

## Error Handling

### Backend Error Handling
```javascript
// Notification failures don't block booking creation
try {
  await sendBookingNotification(vendorId, bookingData);
  console.log('✅ Booking notifications sent successfully');
} catch (notificationError) {
  console.error('❌ Error sending booking notifications:', notificationError);
  // Don't fail the booking creation if notifications fail
}
```

### Frontend Error Handling
```typescript
// Graceful degradation for notification permissions
if (!Device.isDevice) {
  console.warn('⚠️ Push notifications only work on physical devices');
  return {
    success: false,
    error: 'Push notifications only work on physical devices'
  };
}
```

## Performance Optimizations

### Image Loading
- **Optimized Image Loader**: Replaces standard Image components
- **Google Drive URL Optimization**: Direct URLs for faster loading
- **Caching Strategy**: Local and remote caching layers

### Real-time Updates
- **Smart Polling**: 30-second intervals with conditional updates
- **Batch Operations**: Group similar operations
- **Memory Management**: Cleanup intervals and subscriptions

## Testing

### Test Notification
```bash
curl -X POST http://localhost:3000/api/vendor/push-token/test \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "1",
    "message": "Test notification from your app!"
  }'
```

### Booking Sync Test
```bash
curl -X GET http://localhost:3000/api/vendor/bookings/sync
```

## Deployment Checklist

### Backend Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Push notification service dependencies installed
- [ ] API endpoints tested

### Frontend Deployment
- [ ] Expo project ID configured
- [ ] Push notification permissions requested
- [ ] Component integration completed
- [ ] Auto-registration enabled

## Monitoring and Analytics

### Key Metrics to Track
- Notification delivery rates
- Booking acceptance rates
- Dashboard engagement time
- Image loading performance
- API response times

### Logging
- Notification send success/failure
- Booking action tracking
- Error rate monitoring
- Performance metrics

## Troubleshooting

### Common Issues

1. **Notifications Not Received**
   - Check push token registration
   - Verify device permissions
   - Test with test notification endpoint

2. **Dashboard Not Updating**
   - Check API connectivity
   - Verify auto-refresh interval
   - Test manual sync functionality

3. **Image Loading Slow**
   - Verify Google Drive URLs
   - Check image optimization service
   - Monitor network connectivity

### Debug Commands
```bash
# Check notification service status
curl http://localhost:3000/api/vendor/push-token/status/1

# Test booking sync
curl http://localhost:3000/api/vendor/bookings/sync

# Verify API connectivity
curl http://localhost:3000/api/ping
```

## Future Enhancements

### Planned Features
- Real-time WebSocket integration
- Advanced notification scheduling
- Analytics dashboard
- Bulk booking operations
- Multi-language support

### Scalability Considerations
- Queue-based notification system
- Horizontal scaling for API endpoints  
- CDN integration for images
- Database optimization and indexing

---

## Quick Start Guide

1. **Setup Backend Services**:
   ```bash
   cd MUA-backend
   npm install node-cache
   npm start
   ```

2. **Configure Frontend**:
   ```bash
   cd MUA-frontend
   # Update API_BASE_URL in vendorPushNotificationService.ts
   npm start
   ```

3. **Test Notifications**:
   - Register push token via dashboard
   - Create test booking
   - Verify notification received

4. **Monitor Dashboard**:
   - Open vendor dashboard
   - Check booking sync status
   - Test accept/deny actions

For support or questions, refer to the API documentation or contact the development team. 