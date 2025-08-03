const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mua_backend',
  port: process.env.DB_PORT || 3306
};

// Function to validate Google Drive file ID
function isValidGoogleDriveId(id) {
  if (!id || typeof id !== 'string') return false;
  
  // Valid Google Drive IDs are typically 25+ characters long and contain only alphanumeric characters, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9_-]{25,}$/;
  return validPattern.test(id);
}

// Function to extract Google Drive ID from URL
function extractGoogleDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Try to extract ID from various Google Drive URL formats
  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/,           // ?id=FILE_ID
    /\/file\/d\/([a-zA-Z0-9_-]+)/,       // /file/d/FILE_ID/
    /\/uc\?id=([a-zA-Z0-9_-]+)/,         // /uc?id=FILE_ID
    /drive\.google\.com.*?([a-zA-Z0-9_-]{25,})/  // Generic pattern
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && isValidGoogleDriveId(match[1])) {
      return match[1];
    }
  }
  
  return null;
}

// Main function to fix invalid Google Drive IDs
async function fixInvalidDriveIds() {
  let connection;
  
  try {
    console.log('🔧 Starting to fix invalid Google Drive IDs...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');
    
    // List of tables and columns that might contain Google Drive URLs
    const tablesWithImages = [
      { table: 'package_services_from_dashboard', columns: ['icon_image', 'additional_images'] },
      { table: 'vendor_gallery', columns: ['url'] },
      { table: 'vendor_transformations', columns: ['before_image', 'after_image'] },
      { table: 'registration_and_other_details', columns: ['profile_picture'] },
      { table: 'service_icons', columns: ['image'] },
      { table: 'services_from_dashboard', columns: ['image'] }
    ];
    
    let totalFixed = 0;
    
    for (const { table, columns } of tablesWithImages) {
      console.log(`\n🔍 Checking table: ${table}`);
      
      try {
        // Check if table exists
        const [tableExists] = await connection.execute(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
          [dbConfig.database, table]
        );
        
        if (tableExists[0].count === 0) {
          console.log(`⚠️ Table ${table} does not exist, skipping...`);
          continue;
        }
        
        for (const column of columns) {
          console.log(`  📋 Checking column: ${column}`);
          
          // Check if column exists
          const [columnExists] = await connection.execute(
            `SELECT COUNT(*) as count FROM information_schema.columns 
             WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
            [dbConfig.database, table, column]
          );
          
          if (columnExists[0].count === 0) {
            console.log(`    ⚠️ Column ${column} does not exist in ${table}, skipping...`);
            continue;
          }
          
          // Get all records with non-empty values in this column
          const [rows] = await connection.execute(
            `SELECT id, ${column} FROM ${table} WHERE ${column} IS NOT NULL AND ${column} != ''`
          );
          
          let fixedInColumn = 0;
          
          for (const row of rows) {
            const currentValue = row[column];
            let needsUpdate = false;
            let newValue = currentValue;
            
            if (currentValue && currentValue.includes('drive.google.com')) {
              const driveId = extractGoogleDriveId(currentValue);
              
              if (!driveId) {
                // Invalid Google Drive URL - set to null
                newValue = null;
                needsUpdate = true;
                console.log(`    ❌ Invalid Drive URL: ${currentValue} -> NULL`);
              } else if (!isValidGoogleDriveId(driveId)) {
                // Invalid Drive ID format - set to null
                newValue = null;
                needsUpdate = true;
                console.log(`    ❌ Invalid Drive ID: ${driveId} -> NULL`);
              }
            }
            
            if (needsUpdate) {
              try {
                await connection.execute(
                  `UPDATE ${table} SET ${column} = ? WHERE id = ?`,
                  [newValue, row.id]
                );
                fixedInColumn++;
                totalFixed++;
              } catch (updateError) {
                console.error(`    ❌ Error updating record ${row.id}: ${updateError.message}`);
              }
            }
          }
          
          if (fixedInColumn > 0) {
            console.log(`    ✅ Fixed ${fixedInColumn} records in ${table}.${column}`);
          } else {
            console.log(`    ✅ No invalid Drive IDs found in ${table}.${column}`);
          }
        }
      } catch (tableError) {
        console.error(`❌ Error processing table ${table}: ${tableError.message}`);
      }
    }
    
    console.log(`\n🎉 Process completed! Total records fixed: ${totalFixed}`);
    
    if (totalFixed > 0) {
      console.log('\n📋 Summary of changes:');
      console.log('- Invalid Google Drive URLs have been set to NULL');
      console.log('- This will prevent 404 errors when trying to load images');
      console.log('- Frontend should handle NULL images gracefully with placeholder images');
      console.log('\n💡 Next steps:');
      console.log('- Update the database with valid Google Drive file IDs');
      console.log('- Or update the frontend to handle missing images better');
    }
    
  } catch (error) {
    console.error('❌ Error during execution:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Function to display current status
async function checkInvalidIds() {
  let connection;
  
  try {
    console.log('🔍 Checking for invalid Google Drive IDs...');
    
    connection = await mysql.createConnection(dbConfig);
    
    const tablesWithImages = [
      { table: 'package_services_from_dashboard', columns: ['icon_image', 'additional_images'] }
    ];
    
    for (const { table, columns } of tablesWithImages) {
      console.log(`\n📋 Table: ${table}`);
      
      try {
        const [tableExists] = await connection.execute(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
          [dbConfig.database, table]
        );
        
        if (tableExists[0].count === 0) {
          console.log(`  ⚠️ Table does not exist`);
          continue;
        }
        
        for (const column of columns) {
          const [rows] = await connection.execute(
            `SELECT id, ${column} FROM ${table} WHERE ${column} LIKE '%drive.google.com%'`
          );
          
          console.log(`  📁 Column: ${column} (${rows.length} Google Drive URLs found)`);
          
          rows.forEach(row => {
            const driveId = extractGoogleDriveId(row[column]);
            const isValid = driveId && isValidGoogleDriveId(driveId);
            
            console.log(`    ${isValid ? '✅' : '❌'} ID ${row.id}: ${row[column]} ${isValid ? '' : '(INVALID)'}`);
          });
        }
      } catch (error) {
        console.error(`  ❌ Error checking ${table}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'check') {
    checkInvalidIds();
  } else if (command === 'fix') {
    fixInvalidDriveIds();
  } else {
    console.log(`
🔧 Google Drive ID Fixer Utility

Usage:
  node fix_invalid_drive_ids.js check  - Check for invalid Google Drive IDs
  node fix_invalid_drive_ids.js fix    - Fix invalid Google Drive IDs by setting them to NULL

This script will:
1. Scan database tables for Google Drive URLs
2. Validate Google Drive file IDs
3. Set invalid IDs to NULL to prevent 404 errors
4. Provide a summary of changes made
`);
  }
}

module.exports = {
  fixInvalidDriveIds,
  checkInvalidIds,
  isValidGoogleDriveId,
  extractGoogleDriveId
}; 