const { query } = require('./db');

async function checkCategoryTables() {
  console.log('🔍 Checking category tables...\n');
  
  const tables = [
    { name: 'dashboard_salon_services', emoji: '🏪' },
    { name: 'dashboard_prp_services', emoji: '💉' },
    { name: 'dashboard_diagnostics_services', emoji: '🏥' },
    { name: 'dashboard_solo_services', emoji: '👤' }
  ];
  
  for (const table of tables) {
    console.log(`${table.emoji} Checking table: ${table.name}`);
    
    try {
      // Check if table exists
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `;
      
      const existsResult = await query(tableExistsQuery, [table.name]);
      const tableExists = existsResult.rows[0].exists;
      
      if (!tableExists) {
        console.log(`❌ Table ${table.name} does not exist\n`);
        continue;
      }
      
      console.log(`✅ Table ${table.name} exists`);
      
      // Check table structure
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const structureResult = await query(structureQuery, [table.name]);
      console.log(`📋 Table structure:`, structureResult.rows);
      
      // Count total rows
      const countQuery = `SELECT COUNT(*) as total FROM ${table.name};`;
      const countResult = await query(countQuery);
      console.log(`📊 Total rows: ${countResult.rows[0].total}`);
      
      // Check unique service categories
      const categoriesQuery = `
        SELECT DISTINCT service_category, COUNT(*) as count
        FROM ${table.name}
        WHERE service_category IS NOT NULL 
        AND service_category != ''
        GROUP BY service_category
        ORDER BY service_category;
      `;
      
      const categoriesResult = await query(categoriesQuery);
      console.log(`📝 Unique service categories:`, categoriesResult.rows);
      
      // Show sample data
      const sampleQuery = `SELECT * FROM ${table.name} LIMIT 3;`;
      const sampleResult = await query(sampleQuery);
      console.log(`🔍 Sample data:`, sampleResult.rows);
      
    } catch (error) {
      console.error(`❌ Error checking table ${table.name}:`, error.message);
    }
    
    console.log('─'.repeat(50) + '\n');
  }
}

// Run the check
checkCategoryTables()
  .then(() => {
    console.log('✅ Table check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during table check:', error);
    process.exit(1);
  }); 