const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function runRandomImagesMigration() {
    try {
        console.log('Starting random_images_gallery_and_transformation table migration...');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', 'create_random_images_gallery_and_transformation.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await query(migrationSQL);
        
        console.log('✅ Successfully created random_images_gallery_and_transformation table');
        
        // Verify the table was created
        const verifyResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'random_images_gallery_and_transformation'
        `);
        
        if (verifyResult.rows.length > 0) {
            console.log('✅ Table verification successful');
            
            // Show table structure
            const tableStructure = await query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'random_images_gallery_and_transformation'
                ORDER BY ordinal_position
            `);
            
            console.log('\n📋 Table Structure:');
            tableStructure.rows.forEach(row => {
                console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
            });
        } else {
            console.error('❌ Table verification failed');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    runRandomImagesMigration().then(() => {
        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
}

module.exports = { runRandomImagesMigration };