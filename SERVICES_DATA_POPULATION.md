# Services Data Population Script

This script populates the three services tables (`our_services_icons`, `our_services_section`, and `our_services_product`) with comprehensive data for both male and female categories.

## What it Creates

### Categories

**For Female:**
- Haircut (10 services)
- Nail (10 services)
- Facial (10 services)
- Hair Color (10 services)
- Waxing (10 services)
- Mehendi (10 services)

**For Male:**
- Haircut (10 services)
- Skin & Facial (10 services)
- Massage & Spa (10 services)
- Grooming & Hygiene (10 services)

### Data Structure

#### 1. our_services_icons Table
- **Total Icons:** 10 (1 per category)
- **Columns populated:**
  - `icon_title`: Category name + "Icon" (e.g., "Haircut Icon")
  - `toggle_gender`: Boolean (false for female, true for male)
  - `icon`: Google Drive image URL
  - `icon_description`: Descriptive text for the category

#### 2. our_services_section Table
- **Total Services:** 100 (10 per category × 10 categories)
- **Columns populated:**
  - `service_name`: Specific service name (e.g., "Classic Bob Cut")
  - `category`: Category name (e.g., "Haircut")
  - `toggle_gender_services`: Boolean (false for female, true for male)
  - `price`: Random price (₹500-₹5000 for female, ₹300-₹3000 for male)
  - `duration`: Random duration (30-180 min for female, 20-120 min for male)
  - `service_image`: Google Drive image URL
  - `service_description`: Auto-generated description
  - `icon_id`: Foreign key linking to the category icon

#### 3. our_services_product Table
- **Total Products:** 1000 (10 products per service × 100 services)
- **Columns populated:**
  - `our_services_category`: Category name
  - `product_name`: Product name relevant to the category
  - `service_id`: Foreign key linking to the service

## Usage

### Prerequisites
1. PostgreSQL database running on localhost:5432
2. Database named `mua_dashboard`
3. Database credentials: username `postgres`, password `admin`
4. Tables `our_services_icons`, `our_services_section`, and `our_services_product` must exist

### Running the Script

```bash
cd MUA-backend
node populate_services_data.js
```

### What the Script Does

1. **Clears existing data** from all three tables
2. **Resets sequences** to start IDs from 1
3. **Creates icons** for each category (10 total)
4. **Creates services** for each category (100 total)
5. **Creates products** for each service (1000 total)
6. **Displays summary** with counts and breakdown

### Sample Output

```
🚀 Starting to populate services data...
🧹 Clearing existing data...
✅ Existing data cleared
👩 Processing Female Categories...
  📝 Processing category: Haircut
    ✅ Created icon ID: 1 for Haircut
      ✅ Created service ID: 1 - Classic Bob Cut
        ✅ Created 10 products for Classic Bob Cut
      ✅ Created service ID: 2 - Layered Haircut
        ✅ Created 10 products for Layered Haircut
      ...

📊 SUMMARY:
✅ Icons created: 10
✅ Services created: 100
✅ Products created: 1000

📋 BREAKDOWN BY CATEGORY:

Female Categories:
  Facial: 10 services
  Hair Color: 10 services
  Haircut: 10 services
  Mehendi: 10 services
  Nail: 10 services
  Waxing: 10 services

Male Categories:
  Grooming & Hygiene: 10 services
  Haircut: 10 services
  Massage & Spa: 10 services
  Skin & Facial: 10 services

🎉 Data population completed successfully!
```

## Image URL

All services and icons use the same Google Drive image URL as requested:
```
https://drive.usercontent.google.com/download?id=1zf1Qlt7UAnq3xubeTQKPg9WDHrhRsSdC
```

This image can be replaced later by updating individual records through the API endpoints.

## Database Relationships

- Each **category** has 1 **icon**
- Each **icon** can have multiple **services** (1:many)
- Each **service** has multiple **products** (1:many)
- **Products** are linked to both **category** and **service**

## API Endpoints

After running this script, you can interact with the data using these endpoints:

- `GET /api/vendor/our-services-icons` - Get all icons
- `GET /api/vendor/our-services-section` - Get all services
- `GET /api/vendor/our-services-product` - Get all products
- `GET /api/vendor/all-services-data-with-images` - Get all data combined

## Customization

To modify the data:

1. **Add/Remove Categories:** Update `FEMALE_CATEGORIES` and `MALE_CATEGORIES` objects
2. **Change Service Names:** Modify the arrays within each category
3. **Adjust Pricing:** Update `getRandomPrice()` function parameters
4. **Modify Durations:** Update `getRandomDuration()` function parameters
5. **Change Products:** Update the `getProductNames()` function
6. **Update Descriptions:** Modify `getServiceDescription()` and `getIconDescription()` functions

## Error Handling

The script includes comprehensive error handling and will:
- Display detailed error messages
- Rollback database changes on failure
- Exit with appropriate status codes
- Log progress throughout execution

## Notes

- The script uses transactions to ensure data consistency
- All existing data is cleared before population
- Random prices and durations are generated for realistic data
- Products are category-specific and relevant to each service type
- Gender-specific services are properly flagged with boolean values 