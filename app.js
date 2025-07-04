const express = require('express');
const cors = require('cors');
const { query } = require('./db');
const app = express();

// Function to fetch and display dashboard service tables
async function fetchDashboardServiceTables() {
  try {
    console.log('\n🔍 Fetching Dashboard Service Tables...');
    console.log('=' .repeat(50));
    
    // Fetch dashboard_salon_services
    console.log('\n🏪 Dashboard Salon Services:');
    const salonServices = await query('SELECT * FROM dashboard_salon_services ORDER BY service_name');
    console.table(salonServices.rows);
    console.log(`Total Salon Services: ${salonServices.rows.length}`);
    
    // Fetch dashboard_prp_services
    console.log('\n💉 Dashboard PRP Services:');
    const prpServices = await query('SELECT * FROM dashboard_prp_services ORDER BY service_name');
    console.table(prpServices.rows);
    console.log(`Total PRP Services: ${prpServices.rows.length}`);
    
    // Fetch dashboard_diagnostics_services
    console.log('\n🏥 Dashboard Diagnostics Services:');
    const diagnosticsServices = await query('SELECT * FROM dashboard_diagnostics_services ORDER BY service_name');
    console.table(diagnosticsServices.rows);
    console.log(`Total Diagnostics Services: ${diagnosticsServices.rows.length}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Dashboard service tables fetched successfully!');
    
  } catch (error) {
    console.error('❌ Error fetching dashboard service tables:', error.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/users', userRoutes); // Also support plural form
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings', bookingRescheduleRoutes);
app.use('/api/vendor-preferences', vendorPreferencesRoutes); 
app.use('/api/ready-services', readyServicesRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT} and accessible on all interfaces`);
  
  // Fetch and display dashboard service tables on startup
  await fetchDashboardServiceTables();
});