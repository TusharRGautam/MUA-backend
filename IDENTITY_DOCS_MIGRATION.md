# Identity Documents Migration

## Overview
This migration adds identity document fields to the vendor registration table to support KYC verification.

## Changes
- Added `aadhaar_card` column to `registration_and_other_details` table (VARCHAR 20)
- Added `pan_card` column to `registration_and_other_details` table (VARCHAR 20)

## Purpose
These fields enable proper vendor identification and verification for regulatory compliance and help build trust with customers.

## Implementation Details

### Database Changes
The migration performs the following changes:
```sql
ALTER TABLE registration_and_other_details
ADD COLUMN aadhaar_card CHARACTER VARYING(20),
ADD COLUMN pan_card CHARACTER VARYING(20);
```

### How to Run the Migration
Execute the migration script:
```bash
node run_identity_docs_migration.js
```

### Verification
After running the migration, verify the columns were added correctly:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'registration_and_other_details'
AND column_name IN ('aadhaar_card', 'pan_card');
```

## Usage in API
The identity documents can be provided during vendor registration or updated later through the vendor profile update API.

### Security Considerations
- All identity document data should be properly encrypted at rest
- Access to these fields should be restricted to authorized personnel
- Validation should be implemented to ensure proper format (e.g., Aadhaar: 12 digits, PAN: 10 alphanumeric characters) 