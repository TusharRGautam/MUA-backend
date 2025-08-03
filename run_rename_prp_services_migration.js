/**
 * Script to run the migration that renames prp_services_from_dashboard_and_app table to dashboard_prp_services
 */

const migration = require('./migrations/rename_prp_services_to_dashboard_prp_services');

async function runMigration() {
  try {
    console.log('Starting migration to rename prp_services_from_dashboard_and_app to dashboard_prp_services...');
    await migration.up();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();