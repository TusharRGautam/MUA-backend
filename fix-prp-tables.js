/**
 * Script to fix the PRP services tables issue by merging data
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create a simple connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // 10 seconds timeout
});

async function fixPRPTables() {
  console.log('Connecting to database...');
  console.log('Connection parameters:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
  
  try {
    console.log('Starting PRP services tables fix...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Check if both tables exist
    console.log('Checking if tables exist...');
    const dashboardTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      ) as exists;
    `);
    
    const packageTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
      ) as exists;
    `);
    
    const dashboardTableExists = dashboardTableCheck.rows[0].exists;
    const packageTableExists = packageTableCheck.rows[0].exists;
    
    console.log('Table status:');
    console.log('- dashboard_prp_services exists:', dashboardTableExists);
    console.log('- package_services_from_dashboard exists:', packageTableExists);
    
    if (!dashboardTableExists && !packageTableExists) {
      // Neither table exists, create dashboard_prp_services from scratch
      console.log('\nNeither table exists. Creating dashboard_prp_services table from scratch...');
      
      await client.query(`
        CREATE TABLE dashboard_prp_services (
          id SERIAL PRIMARY KEY,
          service_name VARCHAR(255) NOT NULL,
          service_category VARCHAR(100) NOT NULL,
          service_price DECIMAL(10,2) NOT NULL,
          service_duration INTEGER NOT NULL,
          service_sessions INTEGER NOT NULL DEFAULT 1,
          service_description TEXT,
          included_services TEXT,
          vendor_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_dashboard_prp_services_vendor_id ON dashboard_prp_services(vendor_id);
        CREATE INDEX idx_dashboard_prp_services_category ON dashboard_prp_services(service_category);
        
        COMMENT ON TABLE dashboard_prp_services IS 'Stores PRP services created from dashboard';
      `);
      
      console.log('Successfully created dashboard_prp_services table');
      
    } else if (!dashboardTableExists && packageTableExists) {
      // Only package_services_from_dashboard exists, rename it back to dashboard_prp_services
      console.log('\nOnly package_services_from_dashboard exists. Renaming it to dashboard_prp_services...');
      
      await client.query(`ALTER TABLE package_services_from_dashboard RENAME TO dashboard_prp_services;`);
      
      console.log('Successfully renamed package_services_from_dashboard to dashboard_prp_services');
      
    } else if (dashboardTableExists && packageTableExists) {
      // Both tables exist, merge data
      console.log('\nBoth tables exist. Merging data...');
      
      // Get count of records in both tables
      const dashboardCount = await client.query('SELECT COUNT(*) FROM dashboard_prp_services');
      const packageCount = await client.query('SELECT COUNT(*) FROM package_services_from_dashboard');
      
      console.log(`dashboard_prp_services record count: ${dashboardCount.rows[0].count}`);
      console.log(`package_services_from_dashboard record count: ${packageCount.rows[0].count}`);
      
      // Create a backup of dashboard_prp_services just in case
      console.log('\nCreating backup of dashboard_prp_services...');
      await client.query(`
        CREATE TABLE dashboard_prp_services_backup AS 
        SELECT * FROM dashboard_prp_services;
      `);
      console.log('Backup created: dashboard_prp_services_backup');
      
      // Create a backup of package_services_from_dashboard just in case
      console.log('Creating backup of package_services_from_dashboard...');
      await client.query(`
        CREATE TABLE package_services_from_dashboard_backup AS 
        SELECT * FROM package_services_from_dashboard;
      `);
      console.log('Backup created: package_services_from_dashboard_backup');
      
      // Get the column names from both tables
      const dashboardColumnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
        ORDER BY ordinal_position;
      `);
      
      const packageColumnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
        ORDER BY ordinal_position;
      `);
      
      const dashboardColumns = dashboardColumnsResult.rows.map(row => row.column_name);
      const packageColumns = packageColumnsResult.rows.map(row => row.column_name);
      
      console.log('\ndashboard_prp_services columns:', dashboardColumns.join(', '));
      console.log('package_services_from_dashboard columns:', packageColumns.join(', '));
      
      // Create a mapping between the columns
      // We need to map from package_services_from_dashboard columns to the expected API columns
      // But we found that dashboard_prp_services has package_* columns instead of service_* columns
      
      console.log('\nDetected column mismatch between tables!');
      console.log('dashboard_prp_services has package_* columns but the API expects service_* columns');
      
      // First, let's create a backup of dashboard_prp_services with its current structure
      console.log('Creating a backup of dashboard_prp_services with its current structure...');
      await client.query(`
        CREATE TABLE dashboard_prp_services_original_backup AS 
        SELECT * FROM dashboard_prp_services;
      `);
      console.log('Backup created: dashboard_prp_services_original_backup');
      
      // Now, let's rename the existing dashboard_prp_services table
      console.log('Renaming dashboard_prp_services to dashboard_prp_services_old...');
      await client.query(`ALTER TABLE dashboard_prp_services RENAME TO dashboard_prp_services_old;`);
      
      // Create a new dashboard_prp_services table with the correct column structure
      console.log('Creating a new dashboard_prp_services table with the correct column structure...');
      
      // First check if any of the indexes already exist and drop them if they do
      const indexCheck = await client.query(`
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'dashboard_prp_services_old' 
        AND (indexname = 'idx_dashboard_prp_services_vendor_id' OR indexname = 'idx_dashboard_prp_services_category')
      `);
      
      for (const row of indexCheck.rows) {
        console.log(`Dropping existing index ${row.indexname}...`);
        await client.query(`DROP INDEX IF EXISTS ${row.indexname}`);
      }
      
      // Now create the new table
      await client.query(`
        CREATE TABLE dashboard_prp_services (
          id SERIAL PRIMARY KEY,
          service_name VARCHAR(255) NOT NULL,
          service_category VARCHAR(100) NOT NULL DEFAULT 'PRP',
          service_price DECIMAL(10,2) NOT NULL,
          service_duration INTEGER,
          service_sessions INTEGER DEFAULT 1,
          service_description TEXT,
          included_services TEXT,
          vendor_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          icon_image TEXT
        );
      `);
      
      // Create indexes separately to handle potential errors
      try {
        await client.query(`CREATE INDEX idx_dashboard_prp_services_vendor_id ON dashboard_prp_services(vendor_id)`);
        console.log('Created vendor_id index');
      } catch (error) {
        console.warn(`Warning: Could not create vendor_id index: ${error.message}`);
      }
      
      try {
        await client.query(`CREATE INDEX idx_dashboard_prp_services_category ON dashboard_prp_services(service_category)`);
        console.log('Created service_category index');
      } catch (error) {
        console.warn(`Warning: Could not create service_category index: ${error.message}`);
      }
      
      try {
        await client.query(`COMMENT ON TABLE dashboard_prp_services IS 'Stores PRP services created from dashboard'`);
      } catch (error) {
        console.warn(`Warning: Could not add comment to table: ${error.message}`);
      }
      
      // Now we need to map data from both tables to the new structure
      console.log('\nMapping data from both source tables to the new structure...');
      
      // First, let's map from dashboard_prp_services_old
      const oldTableMapping = {
        // Map dashboard_prp_services_old columns to new dashboard_prp_services columns
        'id': 'id',
        'package_name': 'service_name',
        'package_duration': 'service_duration', // This might need conversion from string to integer
        'number_of_sessions': 'service_sessions',
        'package_description': 'service_description',
        'package_includes': 'included_services',
        'package_price': 'service_price',
        'created_at': 'created_at',
        'updated_at': 'updated_at',
        'vendor_id': 'vendor_id',
        'icon_image': 'icon_image'
      };
      
      // Second, let's map from package_services_from_dashboard
      const packageTableMapping = {
        // Map package_services_from_dashboard columns to new dashboard_prp_services columns
        'id': 'id',
        'package_name': 'service_name',
        'duration': 'service_duration',
        'price': 'service_price',
        'description': 'service_description',
        'things_to_know': 'included_services',
        'category': 'service_category',
        'created_at': 'created_at',
        'updated_at': 'updated_at',
        'vendor_id': 'vendor_id',
        'icon_image': 'icon_image'
      };
      
      // Check if we need to add any columns to dashboard_prp_services
      const requiredColumns = [
        'service_name',
        'service_category',
        'service_price',
        'service_duration',
        'service_sessions',
        'service_description',
        'included_services',
        'vendor_id'
      ];
      
      for (const column of requiredColumns) {
        if (!dashboardColumns.includes(column)) {
          console.log(`Adding missing column '${column}' to dashboard_prp_services...`);
          
          // Determine the data type based on the column name
          let dataType;
          switch (column) {
            case 'service_name':
            case 'service_category':
              dataType = 'VARCHAR(255)';
              break;
            case 'service_price':
              dataType = 'DECIMAL(10,2)';
              break;
            case 'service_duration':
            case 'service_sessions':
              dataType = 'INTEGER';
              break;
            case 'service_description':
            case 'included_services':
              dataType = 'TEXT';
              break;
            case 'vendor_id':
              dataType = 'INTEGER';
              break;
            default:
              dataType = 'TEXT';
          }
          
          await client.query(`ALTER TABLE dashboard_prp_services ADD COLUMN ${column} ${dataType};`);
        }
      }
      
      // First, migrate data from dashboard_prp_services_old to the new table
      console.log('\nMigrating data from dashboard_prp_services_old to the new dashboard_prp_services table...');
      
      // Get all records from dashboard_prp_services_old
      const oldRecords = await client.query('SELECT * FROM dashboard_prp_services_old');
      console.log(`Found ${oldRecords.rows.length} records in dashboard_prp_services_old`);
      
      // For each record, insert into the new dashboard_prp_services with the appropriate mapping
      for (const record of oldRecords.rows) {
        // Build the insert query
        const insertColumns = [];
        const insertValues = [];
        const placeholders = [];
        let paramIndex = 1;
        
        for (const [oldCol, newCol] of Object.entries(oldTableMapping)) {
          if (record[oldCol] !== undefined) {
            insertColumns.push(newCol);
            
            // Handle special case for package_duration which might be a string like "60 minutes"
            if (oldCol === 'package_duration' && typeof record[oldCol] === 'string') {
              // Extract the number from the string
              const durationMatch = record[oldCol].match(/\d+/);
              if (durationMatch) {
                insertValues.push(parseInt(durationMatch[0], 10));
              } else {
                // Default to 60 minutes if we can't parse it
                insertValues.push(60);
              }
            } else {
              insertValues.push(record[oldCol]);
            }
            
            placeholders.push(`$${paramIndex++}`);
          }
        }
        
        // Add service_category if it doesn't exist
        if (!insertColumns.includes('service_category')) {
          insertColumns.push('service_category');
          insertValues.push('PRP'); // Default category
          placeholders.push(`$${paramIndex++}`);
        }
        
        // Insert the record
        try {
          const insertQuery = `
            INSERT INTO dashboard_prp_services (${insertColumns.join(', ')})
            VALUES (${placeholders.join(', ')})
            ON CONFLICT (id) DO NOTHING
            RETURNING id;
          `;
          
          const insertResult = await client.query(insertQuery, insertValues);
          if (insertResult.rows.length > 0) {
            console.log(`Inserted record with ID ${insertResult.rows[0].id} from dashboard_prp_services_old`);
          }
        } catch (error) {
          console.error(`Error inserting record with ID ${record.id} from dashboard_prp_services_old:`, error.message);
        }
      }
      
      // Now transfer data from package_services_from_dashboard to dashboard_prp_services
      console.log('\nMigrating data from package_services_from_dashboard to the new dashboard_prp_services table...');
      
      // Get all records from package_services_from_dashboard
      const packageRecords = await client.query('SELECT * FROM package_services_from_dashboard');
      console.log(`Found ${packageRecords.rows.length} records in package_services_from_dashboard`);
      
      // For each record, insert into dashboard_prp_services with the appropriate mapping
      for (const record of packageRecords.rows) {
        // Skip if the ID already exists in dashboard_prp_services
        const existingRecord = await client.query('SELECT id FROM dashboard_prp_services WHERE id = $1', [record.id]);
        if (existingRecord.rows.length > 0) {
          console.log(`Record with ID ${record.id} already exists in dashboard_prp_services, skipping...`);
          continue;
        }
        
        // Build the insert query
        const insertColumns = [];
        const insertValues = [];
        const placeholders = [];
        let paramIndex = 1;
        
        for (const [packageCol, newCol] of Object.entries(packageTableMapping)) {
          if (record[packageCol] !== undefined) {
            insertColumns.push(newCol);
            insertValues.push(record[packageCol]);
            placeholders.push(`$${paramIndex++}`);
          }
        }
        
        // Add service_category if it doesn't exist
        if (!insertColumns.includes('service_category')) {
          insertColumns.push('service_category');
          insertValues.push('PRP'); // Default category
          placeholders.push(`$${paramIndex++}`);
        }
        
        // Insert the record
        try {
          const insertQuery = `
            INSERT INTO dashboard_prp_services (${insertColumns.join(', ')})
            VALUES (${placeholders.join(', ')})
            ON CONFLICT (id) DO NOTHING
            RETURNING id;
          `;
          
          const insertResult = await client.query(insertQuery, insertValues);
          if (insertResult.rows.length > 0) {
            console.log(`Inserted record with ID ${insertResult.rows[0].id} from package_services_from_dashboard`);
          }
        } catch (error) {
          console.error(`Error inserting record with ID ${record.id} from package_services_from_dashboard:`, error.message);
        }
      }
      
      console.log('\nData migration complete.');
      
      // Now we can drop the package_services_from_dashboard table
      console.log('Dropping package_services_from_dashboard table...');
      await client.query('DROP TABLE package_services_from_dashboard;');
      console.log('Table dropped successfully.');
      
      // Verify the final state
      const finalCount = await client.query('SELECT COUNT(*) FROM dashboard_prp_services');
      console.log(`\nFinal record count in dashboard_prp_services: ${finalCount.rows[0].count}`);
      
      console.log('\nFix completed successfully!');
    } else {
      // dashboard_prp_services exists, which is the expected state
      console.log('\nThe dashboard_prp_services table exists as expected.');
      
      // Check if the table has the expected columns
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      console.table(columns.rows);
      
      // Check for records
      const countResult = await client.query('SELECT COUNT(*) FROM dashboard_prp_services');
      console.log(`\nTotal records: ${countResult.rows[0].count}`);
      
      // Check if the expected columns for the API exist
      const expectedColumns = [
        'service_name',
        'service_category',
        'service_price',
        'service_duration',
        'service_sessions',
        'service_description',
        'included_services',
        'vendor_id'
      ];
      
      const actualColumns = columns.rows.map(row => row.column_name);
      
      console.log('\nChecking for expected columns:');
      let missingColumns = [];
      
      expectedColumns.forEach(column => {
        if (actualColumns.includes(column)) {
          console.log(`✓ Column '${column}' exists`);
        } else {
          console.log(`✗ Column '${column}' is MISSING`);
          missingColumns.push(column);
        }
      });
      
      if (missingColumns.length > 0) {
        console.log('\nWARNING: Missing columns detected!');
        console.log('Adding missing columns to dashboard_prp_services...');
        
        for (const column of missingColumns) {
          // Determine the data type based on the column name
          let dataType;
          switch (column) {
            case 'service_name':
            case 'service_category':
              dataType = 'VARCHAR(255)';
              break;
            case 'service_price':
              dataType = 'DECIMAL(10,2)';
              break;
            case 'service_duration':
            case 'service_sessions':
              dataType = 'INTEGER';
              break;
            case 'service_description':
            case 'included_services':
              dataType = 'TEXT';
              break;
            case 'vendor_id':
              dataType = 'INTEGER';
              break;
            default:
              dataType = 'TEXT';
          }
          
          await client.query(`ALTER TABLE dashboard_prp_services ADD COLUMN ${column} ${dataType};`);
          console.log(`Added column '${column}' with type ${dataType}`);
        }
        
        console.log('All missing columns added successfully.');
      } else {
        console.log('\nAll expected columns exist in the table.');
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Transaction committed successfully.');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error fixing PRP tables:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Execute the function
console.log('Starting script execution...');

// Add a timeout to ensure we see the logs
setTimeout(() => {
  console.log('Script is still running after 2 seconds...');
}, 2000);

fixPRPTables()
  .then(() => {
    console.log('Script completed successfully.');
    console.log('PRP tables have been fixed!');
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Closing database pool...');
    try {
      await pool.end();
      console.log('Database pool closed.');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
    // Force exit after a delay to ensure all logs are printed
    setTimeout(() => {
      console.log('Forcing exit...');
      process.exit(0);
    }, 1000);
  });