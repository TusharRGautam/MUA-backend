const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/**
 * Setup script for Razorpay Payout Integration
 * This script will:
 * 1. Check and install required dependencies
 * 2. Create environment configuration template
 * 3. Run database migration
 * 4. Verify setup
 */

console.log('🚀 RAZORPAY PAYOUT SETUP');
console.log('='.repeat(50));

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muadatabase',
  password: process.env.DB_PASSWORD || 'tushar123',
  port: process.env.DB_PORT || 5432,
});

/**
 * Check if package.json has required dependencies
 */
async function checkDependencies() {
  console.log('\n📦 Checking Dependencies...');
  
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = ['razorpay', 'express', 'pg', 'cors'];
    const missingDeps = [];
    
    requiredDeps.forEach(dep => {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        missingDeps.push(dep);
      }
    });
    
    if (missingDeps.length > 0) {
      console.log('❌ Missing dependencies:', missingDeps.join(', '));
      console.log('💡 Run: npm install ' + missingDeps.join(' '));
      return false;
    } else {
      console.log('✅ All required dependencies are installed');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error checking dependencies:', error.message);
    return false;
  }
}

/**
 * Create environment configuration template
 */
async function createEnvTemplate() {
  console.log('\n⚙️ Creating Environment Configuration...');
  
  const envTemplate = `# Razorpay Payout Configuration
# Add these to your .env file

# Razorpay Credentials (from MUA-frontend)
RAZORPAY_KEY_ID=rzp_test_y9k3HsO8QChLPC
RAZORPAY_KEY_SECRET=your_razorpay_test_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=muadatabase
DB_PASSWORD=tushar123
DB_PORT=5432

# API Configuration
PORT=3000
NODE_ENV=development

# Payout Configuration
PAYOUT_MODE=IMPS
PAYOUT_ACCOUNT_NUMBER=2323230000000000
MIN_PAYOUT_AMOUNT=100
MAX_PAYOUT_AMOUNT=1000000

# Company Account Details (for company share payouts)
COMPANY_ACCOUNT_NUMBER=company_account_number_here
COMPANY_IFSC=COMPANY_IFSC_CODE_HERE
COMPANY_ACCOUNT_NAME=Carelook Company Account

# Webhook Configuration
WEBHOOK_ENABLED=true
WEBHOOK_SECRET=your_webhook_secret_here

# Logging and Monitoring
LOG_LEVEL=info
ENABLE_PAYOUT_LOGS=true
`;

  const envPath = path.join(__dirname, '.env.razorpay.template');
  
  try {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Environment template created:', envPath);
    console.log('💡 Copy this to your .env file and update the values');
    
    // Check if .env file exists
    const actualEnvPath = path.join(__dirname, '.env');
    if (!fs.existsSync(actualEnvPath)) {
      console.log('⚠️ No .env file found. Creating from template...');
      fs.copyFileSync(envPath, actualEnvPath);
      console.log('✅ .env file created from template');
      console.log('🔧 Please update the values in .env file');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error creating env template:', error.message);
    return false;
  }
}

/**
 * Run database migration
 */
async function runDatabaseMigration() {
  console.log('\n🗄️ Running Database Migration...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'dashboard-app', 'add_razorpay_payout_columns.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Migration file not found:', migrationPath);
      console.log('💡 Make sure the migration file exists in dashboard-app directory');
      return false;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    console.log('🔄 Executing migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Database migration completed successfully');
    
    // Verify migration
    const verifyQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name LIKE 'vendor_%'
      ORDER BY column_name
    `;
    
    const result = await pool.query(verifyQuery);
    const payoutColumns = result.rows.map(row => row.column_name);
    
    console.log('✅ Payout columns created:', payoutColumns.join(', '));
    
    return true;
    
  } catch (error) {
    console.error('❌ Database migration error:', error.message);
    
    // Check if it's a "column already exists" error
    if (error.message.includes('already exists')) {
      console.log('💡 Migration columns already exist, skipping...');
      return true;
    }
    
    return false;
  }
}

/**
 * Verify Razorpay configuration
 */
async function verifyRazorpayConfig() {
  console.log('\n🔍 Verifying Razorpay Configuration...');
  
  try {
    const { razorpayInstance, RAZORPAY_CONFIG } = require('./config/razorpayPayout');
    
    console.log('✅ Razorpay config loaded successfully');
    console.log('🔑 Key ID:', RAZORPAY_CONFIG.key_id);
    console.log('💰 Currency:', RAZORPAY_CONFIG.currency);
    console.log('🏢 Company:', RAZORPAY_CONFIG.company_name);
    
    // Test basic Razorpay functionality (without API calls)
    if (razorpayInstance) {
      console.log('✅ Razorpay instance created successfully');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Razorpay configuration error:', error.message);
    console.log('💡 Make sure all dependencies are installed and config is correct');
    return false;
  }
}

/**
 * Create test data for development
 */
async function createTestData() {
  console.log('\n🧪 Creating Test Data...');
  
  try {
    // Create a test vendor if not exists
    const testVendorQuery = `
      INSERT INTO ready_services_vendors_data (
        sr_no, email, phone, business_name, business_type,
        account_holder_name, account_number, ifsc_code
      ) VALUES (
        999, 'test@carelook.com', '9999999999', 'Test Salon',
        'salon', 'Test Account', '1234567890', 'ICIC0001234'
      ) ON CONFLICT (sr_no) DO UPDATE SET
        email = EXCLUDED.email,
        business_name = EXCLUDED.business_name
      RETURNING sr_no
    `;
    
    const vendorResult = await pool.query(testVendorQuery);
    console.log('✅ Test vendor created/updated:', vendorResult.rows[0]?.sr_no || 999);
    
    // Create a test booking
    const testBookingQuery = `
      INSERT INTO booking_all_details_of_user_to_vendor (
        booking_id, user_name, user_phone, user_email,
        assigned_vendor_id, service_name, total_amount,
        booking_status, payment_status, booking_date, booking_time
      ) VALUES (
        'TEST_BOOKING_' || EXTRACT(EPOCH FROM NOW())::text,
        'Test Customer', '9999999999', 'customer@test.com',
        999, 'Test Service', 1000,
        'completed', 'paid', CURRENT_DATE, '10:00:00'
      ) ON CONFLICT (booking_id) DO UPDATE SET
        total_amount = EXCLUDED.total_amount
      RETURNING booking_id
    `;
    
    const bookingResult = await pool.query(testBookingQuery);
    console.log('✅ Test booking created:', bookingResult.rows[0]?.booking_id);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    return false;
  }
}

/**
 * Print setup instructions
 */
function printInstructions() {
  console.log('\n📋 SETUP INSTRUCTIONS');
  console.log('='.repeat(50));
  console.log('1. Update .env file with your Razorpay credentials');
  console.log('2. Start your backend server: npm start');
  console.log('3. Test the APIs using: node test_razorpay_payout_api.js');
  console.log('4. Configure webhooks in Razorpay dashboard');
  console.log('5. Update vendor bank account details for payouts');
  console.log('\n🔗 API Endpoints Available:');
  console.log('   POST /api/vendor/razorpay-payout');
  console.log('   GET  /api/vendor/earnings/:vendorId');
  console.log('   GET  /api/vendor/payout-transactions/:vendorId');
  console.log('   POST /api/vendor/retry-payout');
  console.log('   POST /api/vendor/razorpay-webhook');
  console.log('   GET  /api/vendor/payout-config');
  console.log('   GET  /api/vendor/payout-test');
}

/**
 * Main setup function
 */
async function runSetup() {
  try {
    console.log('Starting Razorpay Payout setup...\n');
    
    const steps = [
      { name: 'Check Dependencies', fn: checkDependencies },
      { name: 'Create Environment Template', fn: createEnvTemplate },
      { name: 'Run Database Migration', fn: runDatabaseMigration },
      { name: 'Verify Razorpay Config', fn: verifyRazorpayConfig },
      { name: 'Create Test Data', fn: createTestData }
    ];
    
    let allPassed = true;
    
    for (const step of steps) {
      console.log(`\n▶️ ${step.name}...`);
      const result = await step.fn();
      
      if (!result) {
        console.log(`❌ ${step.name} failed`);
        allPassed = false;
        break;
      } else {
        console.log(`✅ ${step.name} completed`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (allPassed) {
      console.log('🎉 SETUP COMPLETED SUCCESSFULLY!');
      printInstructions();
    } else {
      console.log('❌ SETUP FAILED');
      console.log('Please fix the errors above and run setup again');
    }
    
  } catch (error) {
    console.error('💥 Fatal setup error:', error.message);
  } finally {
    await pool.end();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Setup interrupted...');
  await pool.end();
  process.exit(0);
});

// Run setup
runSetup().catch(error => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});