const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mua_dashboard',
  password: 'admin',
  port: 5432,
});

async function checkTables() {
  try {
    console.log('=== CHECKING TABLE STRUCTURES ===');
    
    // Check our_services_section table structure
    const sectionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'our_services_section' 
      ORDER BY ordinal_position
    `);
    console.log('\nour_services_section columns:');
    sectionsStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });
    
    // Check our_services_icons table structure
    const iconsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'our_services_icons' 
      ORDER BY ordinal_position
    `);
    console.log('\nour_services_icons columns:');
    iconsStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });
    
    // Check our_services_product table structure
    const productsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'our_services_product' 
      ORDER BY ordinal_position
    `);
    console.log('\nour_services_product columns:');
    productsStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });
    
    console.log('\n=== CHECKING ACTUAL DATA ===');
    
    // Get sample data from each table
    const sectionsData = await pool.query('SELECT * FROM our_services_section LIMIT 3');
    console.log('\nour_services_section sample data:');
    console.log(JSON.stringify(sectionsData.rows, null, 2));
    
    const iconsData = await pool.query('SELECT * FROM our_services_icons LIMIT 3');
    console.log('\nour_services_icons sample data:');
    console.log(JSON.stringify(iconsData.rows, null, 2));
    
    const productsData = await pool.query('SELECT * FROM our_services_product LIMIT 3');
    console.log('\nour_services_product sample data:');
    console.log(JSON.stringify(productsData.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkTables(); 