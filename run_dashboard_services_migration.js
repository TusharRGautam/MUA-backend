const { execSync } = require('child_process');
const path = require('path');

console.log('Running dashboard services tables migration...');

try {
  // Execute the migration script
  execSync(`node ${path.join(__dirname, 'migrations', 'run-migration.js')} create_dashboard_services_tables.sql`, { 
    stdio: 'inherit' 
  });
  
  console.log('Dashboard services tables migration completed successfully');
} catch (error) {
  console.error('Dashboard services tables migration failed:', error.message);
  process.exit(1);
} 