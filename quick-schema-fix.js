/**
 * Quick Schema Fix for Performance Optimizations
 * Adds missing columns needed for the optimization features
 */

const { query } = require('./db');

async function fixSchema() {
  console.log('🔧 Fixing database schema for optimizations...');
  
  const fixes = [
    // Add ratings columns to registration table
    {
      name: 'Add ratings_average column',
      sql: `
        ALTER TABLE registration_and_other_details 
        ADD COLUMN IF NOT EXISTS ratings_average DECIMAL(3,2) DEFAULT 0.0;
      `
    },
    {
      name: 'Add total_reviews column',
      sql: `
        ALTER TABLE registration_and_other_details 
        ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
      `
    },
    {
      name: 'Add experience_years column',
      sql: `
        ALTER TABLE registration_and_other_details 
        ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
      `
    },
    // Add vendor_id and business_type columns to our_services_section
    {
      name: 'Add vendor_id column to services',
      sql: `
        ALTER TABLE our_services_section 
        ADD COLUMN IF NOT EXISTS vendor_id INTEGER;
      `
    },
    {
      name: 'Add business_type column to services',
      sql: `
        ALTER TABLE our_services_section 
        ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) DEFAULT 'single';
      `
    },
    // Create vendor_gallery table if it doesn't exist
    {
      name: 'Create vendor_gallery table',
      sql: `
        CREATE TABLE IF NOT EXISTS vendor_gallery (
          id SERIAL PRIMARY KEY,
          vendor_id INTEGER,
          image_url TEXT,
          image_description TEXT,
          category VARCHAR(100),
          is_featured BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    // Create vendor_staff_details table if it doesn't exist
    {
      name: 'Create vendor_staff_details table',
      sql: `
        CREATE TABLE IF NOT EXISTS vendor_staff_details (
          id SERIAL PRIMARY KEY,
          vendor_id INTEGER,
          staff_name VARCHAR(255),
          staff_specialization VARCHAR(255),
          staff_experience INTEGER,
          staff_image TEXT,
          staff_phone VARCHAR(20),
          staff_availability TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    // Create salon_bookings table if it doesn't exist
    {
      name: 'Create salon_bookings table',
      sql: `
        CREATE TABLE IF NOT EXISTS salon_bookings (
          id SERIAL PRIMARY KEY,
          vendor_id INTEGER,
          customer_id INTEGER,
          customer_rating INTEGER,
          customer_review TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    // Create vendor_working_hours table if it doesn't exist
    {
      name: 'Create vendor_working_hours table',
      sql: `
        CREATE TABLE IF NOT EXISTS vendor_working_hours (
          id SERIAL PRIMARY KEY,
          vendor_id INTEGER,
          day_of_week VARCHAR(10),
          opening_time TIME,
          closing_time TIME,
          is_closed BOOLEAN DEFAULT false
        );
      `
    },
    // Add some sample data to demonstrate functionality
    {
      name: 'Update vendor_id in services based on registration data',
      sql: `
        UPDATE our_services_section 
        SET vendor_id = (
          SELECT sr_no 
          FROM registration_and_other_details 
          WHERE business_type IS NOT NULL 
          LIMIT 1
        )
        WHERE vendor_id IS NULL;
      `
    }
  ];

  for (const fix of fixes) {
    try {
      console.log(`  🔄 ${fix.name}...`);
      await query(fix.sql);
      console.log(`  ✅ ${fix.name} completed`);
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`  ⏭️  ${fix.name} - already exists`);
      } else {
        console.error(`  ❌ ${fix.name} failed:`, error.message);
      }
    }
  }

  // Add some performance indexes
  const indexes = [
    {
      name: 'Index for vendor search',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_verified ON registration_and_other_details (verification_status, business_type);'
    },
    {
      name: 'Index for service lookup',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_vendor ON our_services_section (vendor_id, category);'
    },
    {
      name: 'Index for bookings vendor',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_vendor_status ON booking_all_details_of_user_to_vendor (vendor_id, booking_status);'
    }
  ];

  console.log('\n🏗️  Adding performance indexes...');
  for (const index of indexes) {
    try {
      console.log(`  🔄 ${index.name}...`);
      await query(index.sql);
      console.log(`  ✅ ${index.name} completed`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`  ⏭️  ${index.name} - already exists`);
      } else {
        console.error(`  ❌ ${index.name} failed:`, error.message);
      }
    }
  }

  console.log('\n✅ Schema fixes completed!');
  console.log('📋 Summary:');
  console.log('  - Added ratings and review columns');
  console.log('  - Added vendor_id to services table');
  console.log('  - Created missing support tables');
  console.log('  - Added performance indexes');
  process.exit(0);
}

fixSchema().catch(error => {
  console.error('❌ Schema fix failed:', error);
  process.exit(1);
});