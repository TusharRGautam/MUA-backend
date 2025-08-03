# Package Services From Dashboard

This document explains the package structure and how to run the migration and create sample packages for the MUA-Dashboard application.

## Table Structure

The `package_services_from_dashboard` table has the following structure:

| Column Name      | Data Type       | Description                                    |
|------------------|----------------|------------------------------------------------|
| id               | SERIAL PRIMARY KEY | Unique identifier for the package           |
| icon_image       | TEXT           | Google Drive URL for the package icon           |
| package_name     | VARCHAR(255)   | Name of the package                             |
| gender           | VARCHAR(50)    | Gender the package is designed for (male/female/both) |
| service_names    | JSONB          | Array of service items with name, category, price |
| category         | VARCHAR(100)   | Main category of the package                    |
| price            | NUMERIC        | Total price of the package                      |
| duration         | INTEGER        | Duration in minutes                             |
| description      | TEXT           | Detailed description of the package             |
| product_names    | JSONB          | Array of products used in the package           |
| things_to_know   | TEXT           | Important information for clients               |
| reason           | TEXT           | Reason for the package                          |
| specific_todo    | TEXT           | Specific things to do before/after the service  |
| vendor_id        | INTEGER        | ID of the vendor providing the package          |
| created_at       | TIMESTAMPTZ    | When the package was created                    |
| updated_at       | TIMESTAMPTZ    | When the package was last updated               |

## Running the Migration

The migration script creates the `package_services_from_dashboard` table in the database. To run it:

1. Navigate to the MUA-backend directory
2. Run the following command:

```bash
node migrations/20250610_create_package_services_from_dashboard.js
```

## Creating Sample Packages

We've provided a script that creates two complete package entries:
1. A Groom/Male package with appropriate services for men
2. A Bridal/Female package with appropriate services for women

To run this script:

```bash
node run_migration_and_create_packages.js
```

This script will:
1. Run the migration to create the table (if it doesn't exist)
2. Create a Groom package with the following services:
   - Premium Haircut & Styling
   - Facial Grooming & Cleanup
   - Beard Styling & Trimming
   - Anti-Tan Treatment
3. Create a Bridal package with the following services:
   - Bridal Makeup
   - Hair Styling & Decoration
   - Pre-Bridal Facial
   - Nail Art & Manicure
   - Mehndi Application

## Viewing Packages in the Dashboard

After running the script, you can view the created packages in the dashboard:
1. Start the backend server
2. Start the frontend application
3. Navigate to the packages section in the dashboard
4. You should see the two sample packages displayed

## Google Drive Image URLs

The sample packages use Google Drive image URLs for the package icons. These are processed by the application to ensure proper display on the frontend.

The utility functions in `googleDriveUtils.ts` handle the conversion of Google Drive URLs to direct image URLs that can be displayed in the browser.

## Adding More Packages

You can add more packages using the dashboard interface or by modifying the script to include additional package entries with different services, products, and details. 