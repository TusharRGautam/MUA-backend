# Migrating VendorDashboard to Supabase

This document provides instructions for migrating the VendorDashboard schema to Supabase.

## Prerequisites

1. Supabase project setup
2. Access to Supabase project with admin privileges
3. Node.js environment with required dependencies

## Environment Setup

Ensure your `.env` file contains the following variables:

```
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DB_HOST=db.your-project-url.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
```

## Running the Migration

### Option 1: Using the Migration Script

Run the migration script to automatically apply all migrations:

```bash
# Navigate to the backend directory
cd MUA-backend

# Install dependencies if not already installed
npm install

# Run the migrations
node scripts/run-migrations.js
```

### Option 2: Manual Migration via Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/008_create_vendor_dashboard.sql`
4. Paste into the SQL Editor and run the script

## Verifying the Migration

After running the migration, verify the table was created:

```sql
-- Run this in the SQL Editor
SELECT * FROM information_schema.tables 
WHERE table_name = 'registration_and_other_details';

-- Check the table structure
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'registration_and_other_details';
```

## Testing the Schema

To test the schema, you can insert a test record:

```sql
INSERT INTO "Registration_And_Other_Details" (
    business_type, 
    person_name, 
    business_email, 
    gender, 
    phone_number, 
    password
) VALUES (
    'salon', 
    'Test User', 
    'test@example.com', 
    'male', 
    '1234567890', 
    'hashed_password_here'
);

-- Verify the record was inserted
SELECT * FROM "Registration_And_Other_Details";
```

## Troubleshooting

If you encounter issues with the migration:

1. Check the console output for specific error messages
2. Ensure all dependencies in the `run-migrations.js` script are installed
3. Verify your Supabase credentials are correct
4. Ensure you have the proper permissions in your Supabase project 