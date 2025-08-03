/**
 * Migration runner to add package_name column to dashboard_salon_services table
 * This script adds the missing package_name column to store package names for salon services
 */

const { Client } = require('pg');
require('dotenv').config();

async function runSalonPackageNameMigration() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if dashboard_salon_services table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() 
        AND table_name = 'dashboard_salon_services'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('dashboard_salon_services table does not exist. Please run the main migrations first.');
      return;
    }

    // Check if package_name column already exists
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = current_schema() 
        AND table_name = 'dashboard_salon_services' 
        AND column_name = 'package_name'
      );
    `);

    if (columnCheck.rows[0].exists) {
      console.log('✅ package_name column already exists in dashboard_salon_services table.');
      return;
    }

    console.log('Adding package_name column to dashboard_salon_services table...');

    // Begin transaction
    await client.query('BEGIN');

    try {
      // Add package_name column
      await client.query(`
        ALTER TABLE dashboard_salon_services 
        ADD COLUMN package_name VARCHAR(255)
      `);

      // Add comment for the new column
      await client.query(`
        COMMENT ON COLUMN dashboard_salon_services.package_name IS 'Package name for the salon service'
      `);

      // Create index for better query performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_dashboard_salon_services_package_name 
        ON dashboard_salon_services(package_name)
      `);

      // Commit transaction
      await client.query('COMMIT');

      console.log('✅ Successfully added package_name column to dashboard_salon_services table');
      console.log('✅ Created index for package_name column');

    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error running package_name migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the migration
runSalonPackageNameMigration(); 