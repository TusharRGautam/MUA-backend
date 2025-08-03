const db = require('../db');

async function verifyPRPPackages() {
  try {
    console.log('🔍 PRP Packages Verification Report\n');

    // Get new packages (excluding the test ones)
    const packagesQuery = `
      SELECT 
        package_name,
        category,
        package_price,
        number_of_sessions,
        is_featured,
        SUBSTRING(package_description, 1, 80) || '...' as description
      FROM prp_services_from_dashboard_and_app 
      WHERE id > 2 
      ORDER BY category, is_featured DESC, package_price DESC
    `;
    
    const packagesResult = await db.query(packagesQuery);
    
    console.log('📦 Comprehensive PRP Packages:');
    console.log('=====================================\n');
    
    packagesResult.rows.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.package_name} ${pkg.is_featured ? '⭐' : ''}`);
      console.log(`   Category: ${pkg.category}`);
      console.log(`   Price: ₹${pkg.package_price}`);
      console.log(`   Sessions: ${pkg.number_of_sessions}`);
      console.log(`   Description: ${pkg.description}`);
      console.log('');
    });

    // Category summary
    const categoryQuery = `
      SELECT 
        category,
        COUNT(*) as total_packages,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_packages,
        MIN(package_price) as min_price,
        MAX(package_price) as max_price,
        ROUND(AVG(package_price), 0) as avg_price
      FROM prp_services_from_dashboard_and_app 
      WHERE id > 2
      GROUP BY category 
      ORDER BY category
    `;
    
    const categoryResult = await db.query(categoryQuery);
    
    console.log('📊 Category Summary:');
    console.log('==========================================');
    categoryResult.rows.forEach(cat => {
      console.log(`${cat.category}:`);
      console.log(`  • Total packages: ${cat.total_packages}`);
      console.log(`  • Featured packages: ${cat.featured_packages}`);
      console.log(`  • Price range: ₹${cat.min_price} - ₹${cat.max_price}`);
      console.log(`  • Average price: ₹${cat.avg_price}`);
      console.log('');
    });

    // Overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_packages,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_packages,
        MIN(package_price) as min_price,
        MAX(package_price) as max_price,
        ROUND(AVG(package_price), 0) as avg_price,
        COUNT(DISTINCT category) as categories
      FROM prp_services_from_dashboard_and_app 
      WHERE id > 2
    `;
    
    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('🎯 Overall Statistics:');
    console.log('=====================');
    console.log(`Total new packages: ${stats.total_packages}`);
    console.log(`Featured packages: ${stats.featured_packages}`);
    console.log(`Categories covered: ${stats.categories}`);
    console.log(`Price range: ₹${stats.min_price} - ₹${stats.max_price}`);
    console.log(`Average price: ₹${stats.avg_price}`);
    
    console.log('\n✅ PRP packages verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyPRPPackages().finally(() => process.exit());

module.exports = { verifyPRPPackages }; 