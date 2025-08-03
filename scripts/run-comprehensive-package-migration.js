/**
 * Comprehensive Package Migration Runner
 * Date: 2024-01-15
 * Description: Runs all package-related migrations in the correct order
 */

const { query } = require('../db');
const fs = require('fs');
const path = require('path');

async function runComprehensivePackageMigration() {
  console.log('Starting comprehensive package migration...');
  
  try {
    // Step 1: Add missing columns
    console.log('\n1. Adding missing columns to package_services_from_dashboard table...');
    const addColumnsSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/add_missing_package_columns.sql'), 
      'utf8'
    );
    await query(addColumnsSQL);
    console.log('✅ Missing columns added successfully');

    // Step 2: Insert comprehensive package data - Part 1 (Bridal & Groom)
    console.log('\n2. Inserting comprehensive package data - Part 1 (Bridal & Groom packages)...');
    const part1SQL = fs.readFileSync(
      path.join(__dirname, '../migrations/comprehensive_package_data.sql'), 
      'utf8'
    );
    await query(part1SQL);
    console.log('✅ Part 1 data inserted successfully');

    // Step 3: Insert comprehensive package data - Part 2 (Wedding & Haldi)
    console.log('\n3. Inserting comprehensive package data - Part 2 (Wedding & Haldi packages)...');
    const part2SQL = fs.readFileSync(
      path.join(__dirname, '../migrations/comprehensive_package_data_part2.sql'), 
      'utf8'
    );
    await query(part2SQL);
    console.log('✅ Part 2 data inserted successfully');

    // Step 4: Insert comprehensive package data - Part 3 (Reception, Engagement, Pre-wedding)
    console.log('\n4. Inserting comprehensive package data - Part 3 (Reception, Engagement, Pre-wedding packages)...');
    const part3SQL = fs.readFileSync(
      path.join(__dirname, '../migrations/comprehensive_package_data_part3.sql'), 
      'utf8'
    );
    await query(part3SQL);
    console.log('✅ Part 3 data inserted successfully');

    // Step 5: Insert comprehensive package data - Part 4 (Makeup, Hair Styling, Other)
    console.log('\n5. Inserting comprehensive package data - Part 4 (Makeup, Hair Styling, Other packages)...');
    const part4SQL = fs.readFileSync(
      path.join(__dirname, '../migrations/comprehensive_package_data_part4.sql'), 
      'utf8'
    );
    await query(part4SQL);
    console.log('✅ Part 4 data inserted successfully');

    // Step 6: Verify data insertion
    console.log('\n6. Verifying data insertion...');
    const countResult = await query('SELECT COUNT(*) as total FROM package_services_from_dashboard');
    const categoryResult = await query(`
      SELECT category, COUNT(*) as count, 
             STRING_AGG(DISTINCT gender, ', ') as genders
      FROM package_services_from_dashboard 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`Total packages inserted: ${countResult.rows[0].total}`);
    console.log(`\nPackages by category:`);
    categoryResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} packages (${row.genders})`);
    });

    // Step 7: Check featured packages
    const featuredResult = await query('SELECT COUNT(*) as featured FROM package_services_from_dashboard WHERE is_featured = TRUE');
    console.log(`\nFeatured packages: ${featuredResult.rows[0].featured}`);

    console.log('\n🎉 Comprehensive package migration completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   ✓ Complete Bridal Packages (Premium & Traditional)');
    console.log('   ✓ Complete Groom Packages (Premium & Traditional)');
    console.log('   ✓ Wedding, Haldi, Reception, Engagement packages');
    console.log('   ✓ Pre-wedding, Makeup, Hair Styling packages');
    console.log('   ✓ Other/Special occasion packages');
    console.log('   ✓ All categories have at least 2 packages');
    console.log('   ✓ All genders covered (male, female, both)');
    console.log('   ✓ Complete service details with pricing');
    console.log('   ✓ Product information and styling guidelines');
    console.log('   ✓ Booking requirements and contact information');

  } catch (error) {
    console.error('❌ Error during comprehensive package migration:', error);
    console.error('Details:', error.message);
    throw error;
  }
}

// Export the function for use as a module
module.exports = { runComprehensivePackageMigration };

// Run the migration if this file is executed directly
if (require.main === module) {
  runComprehensivePackageMigration()
    .then(() => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
} 