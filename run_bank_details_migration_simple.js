const { query } = require('./db');

async function runBankDetailsMigration() {
  try {
    console.log('🚀 Starting bank details migration...');
    
    // First, add the bank details columns
    console.log('📊 Adding bank details columns...');
    
    const addColumnsSQL = `
      ALTER TABLE registration_and_other_details
      ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS bank_details_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS bank_details_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS bank_details_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `;
    
    await query(addColumnsSQL);
    console.log('✅ Bank details columns added successfully');
    
    // Add Razorpay-specific columns
    console.log('📊 Adding Razorpay columns...');
    
    const addRazorpayColumnsSQL = `
      ALTER TABLE registration_and_other_details
      ADD COLUMN IF NOT EXISTS razorpay_contact_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS razorpay_fund_account_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS razorpay_fund_account_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS razorpay_created_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS razorpay_updated_at TIMESTAMP;
    `;
    
    await query(addRazorpayColumnsSQL);
    console.log('✅ Razorpay columns added successfully');
    
    // Add indexes
    console.log('📊 Adding indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_registration_account_number ON registration_and_other_details(account_number)',
      'CREATE INDEX IF NOT EXISTS idx_registration_ifsc_code ON registration_and_other_details(ifsc_code)',
      'CREATE INDEX IF NOT EXISTS idx_registration_pan_number ON registration_and_other_details(pan_number)',
      'CREATE INDEX IF NOT EXISTS idx_registration_razorpay_contact ON registration_and_other_details(razorpay_contact_id)',
      'CREATE INDEX IF NOT EXISTS idx_registration_razorpay_fund_account ON registration_and_other_details(razorpay_fund_account_id)'
    ];
    
    for (const indexSQL of indexes) {
      try {
        await query(indexSQL);
        console.log('✅ Index created successfully');
      } catch (error) {
        console.log('⚠️  Index creation skipped:', error.message);
      }
    }
    
    // Add constraints
    console.log('📊 Adding constraints...');
    
    const constraints = [
      `ALTER TABLE registration_and_other_details
       ADD CONSTRAINT IF NOT EXISTS chk_account_number_length 
       CHECK (LENGTH(account_number) >= 9 AND LENGTH(account_number) <= 18)`,
       
      `ALTER TABLE registration_and_other_details
       ADD CONSTRAINT IF NOT EXISTS chk_ifsc_code_format 
       CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$')`,
       
      `ALTER TABLE registration_and_other_details
       ADD CONSTRAINT IF NOT EXISTS chk_pan_number_format 
       CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$')`
    ];
    
    for (const constraintSQL of constraints) {
      try {
        await query(constraintSQL);
        console.log('✅ Constraint added successfully');
      } catch (error) {
        console.log('⚠️  Constraint creation skipped:', error.message);
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