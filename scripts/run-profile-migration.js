const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting profile types migration...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Read the migration SQL file
    const migrationFile = path.join(__dirname, '../migrations/005_create_profile_types.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute the migration SQL
    await client.query(sql);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Profile types migration completed successfully!');
    
    // Log the counts of created profiles
    const salonCount = await client.query('SELECT COUNT(*) FROM salon_profiles');
    const prpStaffCount = await client.query('SELECT COUNT(*) FROM prp_staff_profiles');
    const soloArtistCount = await client.query('SELECT COUNT(*) FROM solo_artist_profiles');
    const doctorCount = await client.query('SELECT COUNT(*) FROM doctor_profiles');
    
    console.log(`Created profiles:`);
    console.log(`- ${salonCount.rows[0].count} Salon profiles`);
    console.log(`- ${prpStaffCount.rows[0].count} PRP Staff profiles`);
    console.log(`- ${soloArtistCount.rows[0].count} Solo Artist profiles`);
    console.log(`- ${doctorCount.rows[0].count} Doctor profiles`);
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Release client
    client.release();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  }); 