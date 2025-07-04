const { execSync } = require('child_process');
const path = require('path');

console.log('Running dashboard services setup...');

try {
  // Step 1: Run the migration to create tables
  console.log('\n📋 STEP 1: Running migration to create dashboard services tables');
  execSync(`node ${path.join(__dirname, 'run_dashboard_services_migration.js')}`, { 
    stdio: 'inherit' 
  });
  console.log('\n🎉 Dashboard services tables created successfully!');
  
  // Step 2: Populate the tables with sample data
  console.log('\n📋 STEP 2: Populating dashboard services tables with sample data');
  execSync(`node ${path.join(__dirname, 'populate_dashboard_services.js')}`, { 
    stdio: 'inherit' 
  });
  console.log('\n🎉 Dashboard services tables populated successfully!');
  
  console.log('\n✅ All setup steps completed successfully.');
  console.log('\n📝 You can now use the following API endpoints:');
  console.log('   - GET    /api/dashboard-services/salon       - Get all salon services');
  console.log('   - GET    /api/dashboard-services/salon/:id   - Get a single salon service');
  console.log('   - POST   /api/dashboard-services/salon       - Create a new salon service');
  console.log('   - PUT    /api/dashboard-services/salon/:id   - Update a salon service');
  console.log('   - DELETE /api/dashboard-services/salon/:id   - Delete a salon service');
  console.log('');
  console.log('   - GET    /api/dashboard-services/prp         - Get all PRP services');
  console.log('   - GET    /api/dashboard-services/prp/:id     - Get a single PRP service');
  console.log('   - POST   /api/dashboard-services/prp         - Create a new PRP service');
  console.log('   - PUT    /api/dashboard-services/prp/:id     - Update a PRP service');
  console.log('   - DELETE /api/dashboard-services/prp/:id     - Delete a PRP service');
  console.log('');
  console.log('   - GET    /api/dashboard-services/diagnostics       - Get all diagnostics services');
  console.log('   - GET    /api/dashboard-services/diagnostics/:id   - Get a single diagnostics service');
  console.log('   - POST   /api/dashboard-services/diagnostics       - Create a new diagnostics service');
  console.log('   - PUT    /api/dashboard-services/diagnostics/:id   - Update a diagnostics service');
  console.log('   - DELETE /api/dashboard-services/diagnostics/:id   - Delete a diagnostics service');
  
} catch (error) {
  console.error('\n❌ Error during dashboard services setup:', error.message);
  process.exit(1);
}