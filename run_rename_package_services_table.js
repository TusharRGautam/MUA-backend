/**
 * Script to run the migration that renames package_services_from_dashboard to dashboard_prp_services
 */

const migration = require('./migrations/rename_package_services_table');

async function runMigration() {
  try {
    console.log('Starting migration to rename package_services_from_dashboard to dashboard_prp_services...');
    
    // Run the migration
    await migration.up();
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();