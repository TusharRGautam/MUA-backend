const { pool, query } = require('./db');

async function checkDeviceColumns() {
  try {
    const columnQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customer_table_details' 
      AND (column_name LIKE '%device%' OR column_name LIKE '%info%')
      ORDER BY column_name
    `;
    
    const result = await query(columnQuery, []);
    console.log('Device/Info-related columns in customer_table_details:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    // Also check all columns to see what's available
    const allColumnsQuery = `
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'customer_table_details'
      ORDER BY ordinal_position
    `;
    
    const allResult = await query(allColumnsQuery, []);
    console.log('\nAll columns in customer_table_details:');
    allResult.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDeviceColumns();