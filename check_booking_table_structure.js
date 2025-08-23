const { query } = require('./db');

async function checkBookingTableStructure() {
  try {
    console.log('🔍 Checking booking_all_details_of_user_to_vendor table structure...\n');
    
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Table "booking_all_details_of_user_to_vendor" not found');
      
      // Check if there's a similar table name
      const tables = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%booking%'
        ORDER BY table_name
      `);
      
      console.log('\n📋 Available booking-related tables:');
      tables.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
      
      return;
    }
    
    console.log('📊 Table Structure:');
    console.log('Column Name | Data Type | Nullable | Default');
    console.log('-'.repeat(60));
    
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(20)} | ${row.data_type.padEnd(15)} | ${row.is_nullable.padEnd(8)} | ${row.column_default || 'NULL'}`);
    });
    
    // Look for payout/earning related columns
    console.log('\n💰 Potential vendor earning columns:');
    const earningColumns = result.rows.filter(row => 
      row.column_name.includes('vendor') || 
      row.column_name.includes('payout') ||
      row.column_name.includes('earning') ||
      row.column_name.includes('amount') ||
      row.column_name.includes('commission') ||
      row.column_name.includes('split')
    );
    
    if (earningColumns.length > 0) {
      earningColumns.forEach(col => {
        console.log(`✅ ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('⚠️  No obvious vendor earning columns found');
    }
    
  } catch (error) {
    console.error('💥 Error checking table structure:', error);
  }
}

checkBookingTableStructure();