const { query } = require('../db');

async function verifyPackageData() {
  try {
    const result = await query(`
      SELECT package_name, gender, category, price, duration, 
             CASE WHEN is_featured THEN '⭐' ELSE '' END as featured
      FROM package_services_from_dashboard 
      ORDER BY category, price DESC
    `);
    
    console.log('📦 Package Services Database Content:');
    console.log('=====================================');
    
    let currentCategory = '';
    result.rows.forEach(row => {
      if (row.category !== currentCategory) {
        console.log(`\n🏷️  ${row.category.toUpperCase()} PACKAGES:`);
        currentCategory = row.category;
      }
      console.log(`   ${row.featured} ${row.package_name} (${row.gender}) - ₹${row.price} (${row.duration}min)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyPackageData(); 