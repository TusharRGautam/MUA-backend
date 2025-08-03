/**
 * Script to run the migration that renames dashboard_prp_services back to package_services_from_dashboard
 */

const migration = require('./migrations/rename_dashboard_prp_services_table');

async function runMigration() {
  try {
    console.log('Starting migration to rename dashboard_prp_services back to package_services_from_dashboard...');
    
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