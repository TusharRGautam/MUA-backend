const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mua_database'
};

async function runMigration() {
  let connection;
  
  try {
    console.log('Starting ready_services_vendors_data table migration...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'create_ready_services_vendors_data_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file into individual statements (handle multiple statements)
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await connection.execute(statement);
      }
    }
    
    // Verify table creation
    const [tables] = await connection.execute("SHOW TABLES LIKE 'ready_services_vendors_data'");
    if (tables.length > 0) {
      console.log('✅ ready_services_vendors_data table created successfully');
      
      // Show table structure
      const [columns] = await connection.execute("DESCRIBE ready_services_vendors_data");
      console.log('\nTable structure:');
      console.table(columns);
    } else {
      console.log('❌ Table creation failed');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
runMigration(); 