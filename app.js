const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const transformationRoutes = require('./routes/transformationRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const bookingRescheduleRoutes = require('./routes/bookingRescheduleRoutes');
const vendorPreferencesRoutes = require('./routes/vendorPreferencesRoutes');
const readyServicesRoutes = require('./routes/readyServicesRoutes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/transformation', transformationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings', bookingRescheduleRoutes);
app.use('/api/vendor-preferences', vendorPreferencesRoutes); 
app.use('/api/ready-services', readyServicesRoutes); 