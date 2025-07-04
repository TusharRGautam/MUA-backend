const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration - using PostgreSQL
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'aws-0-ap-south-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '6543'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.dmmefaeprkgkzpoxvoje',
  password: process.env.DB_PASSWORD || 'muaBackend@mua',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runBusinessTypeMigration() {
  let client;
  
  try {
    console.log('Starting business_type column migration for ready_services_vendors_data table...');
    
    // Get database connection
    client = await pool.connect();
    console.log('Connected to PostgreSQL database successfully');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_business_type_to_ready_services_vendors_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        try {
          await client.query(statement);
          console.log('✅ Statement executed successfully');
        } catch (error) {
          if (error.code === '42701' || error.message.includes('already exists')) {
            console.log('⚠️ Column or constraint already exists, skipping...');
          } else {
            throw error;
          }
        }
      }
    }
    
    // Verify the column was added
    const columnCheckQuery = `
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'ready_services_vendors_data' 
      AND column_name = 'business_type'
    `;
    const columnResult = await client.query(columnCheckQuery);
    
    if (columnResult.rows.length > 0) {
      console.log('✅ business_type column added successfully');
      console.log('Column details:', columnResult.rows[0]);
      
      // Show updated table structure
      const tableStructureQuery = `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'ready_services_vendors_data' 
        ORDER BY ordinal_position
      `;
      const structureResult = await client.query(tableStructureQuery);
      console.log('\nUpdated table structure:');
      console.table(structureResult.rows);
      
      // Check if there are any existing records
      const recordCountQuery = "SELECT COUNT(*) as count FROM ready_services_vendors_data";
      const countResult = await client.query(recordCountQuery);
      console.log(`\nTotal records in table: ${countResult.rows[0].count}`);
      
      if (parseInt(countResult.rows[0].count) > 0) {
        // Show sample of updated records
        const sampleQuery = "SELECT vendor_email, business_type, selected_categories FROM ready_services_vendors_data LIMIT 5";
        const sampleResult = await client.query(sampleQuery);
        console.log('\nSample records:');
        console.table(sampleResult.rows);
      }
    } else {
      console.log('❌ business_type column was not added');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
    await pool.end();
    console.log('Database pool closed');
  }
}

// Run the migration
runBusinessTypeMigration(); 