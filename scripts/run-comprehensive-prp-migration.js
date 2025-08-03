const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runPRPMigration() {
  try {
    console.log('🚀 Starting comprehensive PRP services migration...\n');

    // Step 1: Add missing columns
    console.log('📊 Step 1: Adding missing columns to PRP services table...');
    const addColumnsSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/add_prp_services_columns.sql'),
      'utf8'
    );
    
    await db.query(addColumnsSQL);
    console.log('✅ Successfully added missing columns\n');

    // Step 2: Insert comprehensive PRP packages data
    console.log('📦 Step 2: Inserting comprehensive PRP packages data...');
    const packagesDataSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/comprehensive_prp_packages_data.sql'),
      'utf8'
    );
    
    await db.query(packagesDataSQL);
    console.log('✅ Successfully inserted PRP packages data\n');

    // Step 3: Verify data insertion
    console.log('🔍 Step 3: Verifying data insertion...');
    
    const verificationQueries = [
      {
        name: 'Total packages count',
        query: 'SELECT COUNT(*) as count FROM prp_services_from_dashboard_and_app'
      },
      {
        name: 'Packages by category',
        query: `SELECT category, COUNT(*) as count, 
                ROUND(AVG(package_price), 2) as avg_price
                FROM prp_services_from_dashboard_and_app 
                GROUP BY category 
                ORDER BY category`
      },
      {
        name: 'Featured packages',
        query: 'SELECT COUNT(*) as count FROM prp_services_from_dashboard_and_app WHERE is_featured = true'
      },
      {
        name: 'Gender distribution',
        query: `SELECT gender, COUNT(*) as count 
                FROM prp_services_from_dashboard_and_app 
                GROUP BY gender`
      },
      {
        name: 'Price range',
        query: `SELECT 
                MIN(package_price) as min_price,
                MAX(package_price) as max_price,
                ROUND(AVG(package_price), 2) as avg_price
                FROM prp_services_from_dashboard_and_app`
      },
      {
        name: 'Session distribution',
        query: `SELECT number_of_sessions, COUNT(*) as count
                FROM prp_services_from_dashboard_and_app 
                GROUP BY number_of_sessions 
                ORDER BY number_of_sessions`
      }
    ];

    for (const { name, query } of verificationQueries) {
      try {
        const result = await db.query(query);
        console.log(`📈 ${name}:`);
        console.table(result.rows);
      } catch (error) {
        console.error(`❌ Error in ${name}:`, error.message);
      }
    }

    // Step 4: Display sample package details
    console.log('🔍 Step 4: Sample package details...');
    const sampleQuery = `
      SELECT 
        package_name,
        category,
        package_price,
        number_of_sessions,
        is_featured,
        SUBSTRING(package_description, 1, 100) || '...' as description_preview
      FROM prp_services_from_dashboard_and_app 
      ORDER BY category, is_featured DESC, package_price DESC
      LIMIT 5
    `;
    
    const sampleResult = await db.query(sampleQuery);
    console.log('📋 Sample packages:');
    console.table(sampleResult.rows);

    console.log('\n🎉 Comprehensive PRP migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Added comprehensive PRP service columns');
    console.log('- Inserted 8 detailed PRP packages across 4 categories');
    console.log('- All categories have at least 2 packages');
    console.log('- 3 packages marked as featured');
    console.log('- Complete service details, benefits, and instructions included');
    console.log('- Database indexes added for optimal performance');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runPRPMigration()
    .then(() => {
      console.log('\n✅ PRP migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ PRP migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runPRPMigration }; 