require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Disable SSL certificate validation for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create PostgreSQL client
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

// Create Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function runMigrations() {
    try {
        console.log('Starting database migrations...');

        // Get all migration files
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort to ensure migrations run in order

        // Connect to the database
        const client = await pool.connect();

        try {
            // Create migrations table if it doesn't exist
            await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Get applied migrations
            const { rows: appliedMigrations } = await client.query(
                'SELECT name FROM migrations'
            );
            const appliedMigrationNames = appliedMigrations.map(m => m.name);

            // Run pending migrations
            for (const file of migrationFiles) {
                if (appliedMigrationNames.includes(file)) {
                    console.log(`Migration ${file} already applied, skipping...`);
                    continue;
                }

                console.log(`Applying migration: ${file}`);
                const migrationContent = fs.readFileSync(
                    path.join(migrationsDir, file),
                    'utf8'
                );

                // Run the migration inside a transaction
                await client.query('BEGIN');
                try {
                    await client.query(migrationContent);
                    await client.query(
                        'INSERT INTO migrations (name) VALUES ($1)',
                        [file]
                    );
                    await client.query('COMMIT');
                    console.log(`Migration ${file} applied successfully.`);
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`Error applying migration ${file}:`, err);
                    throw err;
                }
            }

            console.log('All migrations completed successfully.');
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations(); 