const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function runBankDetailsMigration() {
  try {
    console.log('🚀 Starting bank details migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_bank_details_columns.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Migration file not found: ' + migrationPath);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          await query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if columns already exist, that's okay
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 Bank details migration completed successfully!');
    
    // Verify the columns were added
    console.log('🔍 Verifying migration...');
    const verification = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'registration_and_other_details' 
      AND column_name IN ('account_holder_name', 'account_number', 'ifsc_code', 'bank_name', 'branch_name', 'pan_number', 'bank_details_verified')
      ORDER BY column_name
    `);
    
    console.log('✅ Bank details columns found:', verification.rows.map(row => row.column_name));
    
    if (verification.rows.length >= 7) {
      console.log('🎯 Migration verification successful! All bank details columns are present.');
    } else {
      console.log('⚠️  Some columns may be missing. Please check the database.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runBankDetailsMigration();