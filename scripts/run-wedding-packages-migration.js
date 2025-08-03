const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Create a connection pool with database connection details from .env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// SQL for wedding packages - embedded directly in the script
const weddingPackagesSQL = `
-- SQL script to create wedding packages for both male and female categories
-- This script inserts data directly into the package_services_from_dashboard table

-- Begin transaction
BEGIN;

-- Female Bridal Packages
INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Radiant Bride', 
  'female', 
  '[
    {"id": "service-1", "name": "Bridal Makeup", "category": "Bridal", "price": 15000},
    {"id": "service-2", "name": "Hair Styling with Accessories", "category": "Bridal", "price": 5000},
    {"id": "service-3", "name": "Saree/Lehenga Draping", "category": "Bridal", "price": 3000},
    {"id": "service-4", "name": "Nail Art", "category": "Bridal", "price": 1500}
  ]',
  'Bridal',
  24500, -- Total price
  180, -- Duration in minutes
  'Complete premium bridal package with top-tier makeup, hair styling with accessories, and saree/lehenga draping for the perfect Indian bridal look.',
  '[
    {"id": "product-1", "name": "HD Foundation"},
    {"id": "product-2", "name": "Waterproof Mascara"},
    {"id": "product-3", "name": "Long-lasting Lipstick"},
    {"id": "product-4", "name": "Setting Spray"}
  ]',
  'Schedule 3 hours before event
Bring your outfit and jewelry
Have a clean face before appointment',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Traditional Elegance', 
  'female', 
  '[
    {"id": "service-5", "name": "Traditional Bridal Makeup", "category": "Bridal", "price": 12000},
    {"id": "service-6", "name": "Classic Updo with Gajra", "category": "Bridal", "price": 4000},
    {"id": "service-7", "name": "Dupatta Setting", "category": "Bridal", "price": 2000},
    {"id": "service-8", "name": "Mehndi Touch-up", "category": "Bridal", "price": 1000}
  ]',
  'Bridal',
  19000, -- Total price
  150, -- Duration in minutes
  'Classic Indian bridal package featuring traditional makeup techniques, classic updo with gajra, and dupatta setting perfect for a traditional wedding.',
  '[
    {"id": "product-5", "name": "Kohl"},
    {"id": "product-6", "name": "Red Lipstick"},
    {"id": "product-7", "name": "Traditional Foundation"},
    {"id": "product-8", "name": "Setting Powder"}
  ]',
  'Book 1 week in advance
Complete mehndi 2 days before
Have reference photos ready',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Royal Bride', 
  'female', 
  '[
    {"id": "service-9", "name": "Premium Bridal Makeup", "category": "Bridal", "price": 20000},
    {"id": "service-10", "name": "Elaborate Hairstyling", "category": "Bridal", "price": 7000},
    {"id": "service-11", "name": "Complete Outfit Styling", "category": "Bridal", "price": 5000},
    {"id": "service-12", "name": "Jewelry Arrangement", "category": "Bridal", "price": 3000}
  ]',
  'Bridal',
  35000, -- Total price
  240, -- Duration in minutes
  'Premium luxury bridal package with elite makeup artists, elaborate royal hairstyling, complete outfit styling, and jewelry arrangement for a maharani look.',
  '[
    {"id": "product-9", "name": "Premium Makeup Brands"},
    {"id": "product-10", "name": "HD Airbrush Foundation"},
    {"id": "product-11", "name": "Highlighter"},
    {"id": "product-12", "name": "False Lashes"}
  ]',
  'Schedule trial 1 week before
Have assistant/family member present
Plan 4 hours before event',
  CURRENT_TIMESTAMP
);

-- Female Engagement Packages
INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Subtle Glow', 
  'female', 
  '[
    {"id": "service-13", "name": "Light Makeup", "category": "Engagement", "price": 8000},
    {"id": "service-14", "name": "Soft Curls Hairstyle", "category": "Engagement", "price": 3000},
    {"id": "service-15", "name": "Basic Draping", "category": "Engagement", "price": 2000}
  ]',
  'Engagement',
  13000, -- Total price
  120, -- Duration in minutes
  'Perfect for engagement ceremonies with light makeup, soft curls hairstyle, and basic draping for an elegant yet understated look.',
  '[
    {"id": "product-13", "name": "Nude Palette"},
    {"id": "product-14", "name": "Light Foundation"},
    {"id": "product-15", "name": "Soft Blush"},
    {"id": "product-16", "name": "Mascara"}
  ]',
  'Schedule 2 hours before event
Bring outfit and accessories
Have reference photos',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Engagement Sparkle', 
  'female', 
  '[
    {"id": "service-16", "name": "Medium Glam Makeup", "category": "Engagement", "price": 10000},
    {"id": "service-17", "name": "Half-up Hairstyle", "category": "Engagement", "price": 4000},
    {"id": "service-18", "name": "Outfit Styling", "category": "Engagement", "price": 2500}
  ]',
  'Engagement',
  16500, -- Total price
  150, -- Duration in minutes
  'Medium glam makeup package designed for engagement ceremonies with elegant half-up hairstyle and complete outfit styling.',
  '[
    {"id": "product-17", "name": "Shimmer Eyeshadow"},
    {"id": "product-18", "name": "Medium Coverage Foundation"},
    {"id": "product-19", "name": "Highlighter"}
  ]',
  'Schedule trial if needed
Arrive with clean hair and face
Share color scheme beforehand',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Regal Engagement', 
  'female', 
  '[
    {"id": "service-19", "name": "Full Glam Makeup", "category": "Engagement", "price": 12000},
    {"id": "service-20", "name": "Elaborate Hairstyle", "category": "Engagement", "price": 5000},
    {"id": "service-21", "name": "Complete Styling", "category": "Engagement", "price": 3000}
  ]',
  'Engagement',
  20000, -- Total price
  180, -- Duration in minutes
  'Full glam makeup and elaborate hairstyling for a show-stopping engagement look with complete styling services.',
  '[
    {"id": "product-20", "name": "Premium Makeup Brands"},
    {"id": "product-21", "name": "Setting Spray"},
    {"id": "product-22", "name": "Lashes"},
    {"id": "product-23", "name": "Brow Products"}
  ]',
  'Schedule 3 hours before event
Consider family color scheme
Bring jewelry pieces',
  CURRENT_TIMESTAMP
);

-- Female Haldi Packages
INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Haldi Glow', 
  'female', 
  '[
    {"id": "service-22", "name": "Minimal Makeup", "category": "Haldi", "price": 5000},
    {"id": "service-23", "name": "Simple Bun/Braid", "category": "Haldi", "price": 2000},
    {"id": "service-24", "name": "Outfit Assistance", "category": "Haldi", "price": 1000}
  ]',
  'Haldi',
  8000, -- Total price
  90, -- Duration in minutes
  'Minimal, waterproof makeup and simple hairstyling for haldi ceremony with outfit assistance.',
  '[
    {"id": "product-24", "name": "Waterproof Mascara"},
    {"id": "product-25", "name": "Tinted Moisturizer"},
    {"id": "product-26", "name": "Lip Tint"}
  ]',
  'Schedule before haldi ceremony
Use skin protection before ceremony
Have hair ties/pins ready',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Yellow Radiance', 
  'female', 
  '[
    {"id": "service-25", "name": "Natural Makeup", "category": "Haldi", "price": 6000},
    {"id": "service-26", "name": "Floral Hairstyle", "category": "Haldi", "price": 3000},
    {"id": "service-27", "name": "Draping Assistance", "category": "Haldi", "price": 1500}
  ]',
  'Haldi',
  10500, -- Total price
  120, -- Duration in minutes
  'Natural makeup look with floral hairstyling perfect for haldi ceremony, with draping assistance.',
  '[
    {"id": "product-27", "name": "Waterproof Products"},
    {"id": "product-28", "name": "Light Foundation"},
    {"id": "product-29", "name": "Setting Spray"}
  ]',
  'Bring fresh flowers for hair
Schedule enough time before ceremony
Use minimal jewelry',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Haldi Queen', 
  'female', 
  '[
    {"id": "service-28", "name": "Dewy Makeup Look", "category": "Haldi", "price": 7000},
    {"id": "service-29", "name": "Elaborate Braid with Flowers", "category": "Haldi", "price": 4000},
    {"id": "service-30", "name": "Complete Styling", "category": "Haldi", "price": 2500}
  ]',
  'Haldi',
  13500, -- Total price
  150, -- Duration in minutes
  'Dewy makeup look with elaborate braid and floral decoration, designed specifically for haldi ceremony.',
  '[
    {"id": "product-30", "name": "Waterproof Products"},
    {"id": "product-31", "name": "Highlighter"},
    {"id": "product-32", "name": "Tinted Lip Balm"}
  ]',
  'Coordinate flower colors with outfit
Apply skin protection cream
Schedule well before ceremony',
  CURRENT_TIMESTAMP
);

-- Male Grooming Packages
INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Classic Groom', 
  'male', 
  '[
    {"id": "service-31", "name": "Basic Facial", "category": "Grooming", "price": 3000},
    {"id": "service-32", "name": "Haircut & Styling", "category": "Grooming", "price": 2000},
    {"id": "service-33", "name": "Beard Trim & Shape", "category": "Grooming", "price": 1500}
  ]',
  'Grooming',
  6500, -- Total price
  120, -- Duration in minutes
  'Essential grooming package for grooms with basic facial, professional haircut and styling, and beard trim for a classic look.',
  '[
    {"id": "product-33", "name": "Facial Cleanser"},
    {"id": "product-34", "name": "Hair Wax"},
    {"id": "product-35", "name": "Beard Oil"}
  ]',
  'Schedule 1-2 days before wedding
Discuss preferred beard style
Bring reference photos',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Polished Groom', 
  'male', 
  '[
    {"id": "service-34", "name": "Premium Facial", "category": "Grooming", "price": 4000},
    {"id": "service-35", "name": "Haircut & Advanced Styling", "category": "Grooming", "price": 2500},
    {"id": "service-36", "name": "Beard Styling & Coloring", "category": "Grooming", "price": 2000}
  ]',
  'Grooming',
  8500, -- Total price
  150, -- Duration in minutes
  'Premium grooming services with facial, advanced haircut and styling, and beard styling with optional coloring for a refined appearance.',
  '[
    {"id": "product-36", "name": "Premium Skincare"},
    {"id": "product-37", "name": "Hair Pomade"},
    {"id": "product-38", "name": "Beard Balm"}
  ]',
  'Schedule 2 days before event
Discuss skincare routine
Plan outfit coordination',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Royal Groom', 
  'male', 
  '[
    {"id": "service-37", "name": "Luxury Facial & Face Massage", "category": "Grooming", "price": 6000},
    {"id": "service-38", "name": "Premium Haircut & Styling", "category": "Grooming", "price": 3000},
    {"id": "service-39", "name": "Complete Beard Grooming", "category": "Grooming", "price": 2500},
    {"id": "service-40", "name": "Manicure", "category": "Grooming", "price": 1500}
  ]',
  'Grooming',
  13000, -- Total price
  180, -- Duration in minutes
  'Luxury grooming experience for grooms with premium facial, massage, haircut, complete beard grooming, and manicure for the ultimate groom preparation.',
  '[
    {"id": "product-39", "name": "Premium Grooming Products"},
    {"id": "product-40", "name": "Hair Styling Kit"},
    {"id": "product-41", "name": "Beard Kit"}
  ]',
  'Schedule trial week before
Discuss turban/pagdi styling if needed
Plan with outfit colors',
  CURRENT_TIMESTAMP
);

-- Male Wedding Packages
INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Traditional Groom', 
  'male', 
  '[
    {"id": "service-41", "name": "Light Makeup for Photos", "category": "Wedding", "price": 3000},
    {"id": "service-42", "name": "Hair Styling", "category": "Wedding", "price": 2000},
    {"id": "service-43", "name": "Turban/Pagdi Assistance", "category": "Wedding", "price": 2500}
  ]',
  'Wedding',
  7500, -- Total price
  120, -- Duration in minutes
  'Essential wedding day package with light makeup for photography, hair styling, and traditional turban/pagdi assistance.',
  '[
    {"id": "product-42", "name": "Light Foundation"},
    {"id": "product-43", "name": "Setting Powder"},
    {"id": "product-44", "name": "Hair Spray"}
  ]',
  'Schedule 3 hours before baraat
Bring turban/pagdi material
Have assistant present',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Modern Groom', 
  'male', 
  '[
    {"id": "service-44", "name": "HD Makeup for Photos", "category": "Wedding", "price": 4000},
    {"id": "service-45", "name": "Premium Hair Styling", "category": "Wedding", "price": 2500},
    {"id": "service-46", "name": "Outfit & Accessories Arrangement", "category": "Wedding", "price": 3000}
  ]',
  'Wedding',
  9500, -- Total price
  150, -- Duration in minutes
  'Contemporary styling package with HD makeup for perfect wedding photos, premium hair styling, and complete outfit arrangement.',
  '[
    {"id": "product-45", "name": "HD Foundation"},
    {"id": "product-46", "name": "Concealer"},
    {"id": "product-47", "name": "Hair Products"}
  ]',
  'Schedule trial if needed
Have complete outfit ready
Plan time for photos',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Maharaja Groom', 
  'male', 
  '[
    {"id": "service-47", "name": "Premium Makeup for Photos", "category": "Wedding", "price": 5000},
    {"id": "service-48", "name": "Royal Hair & Turban Styling", "category": "Wedding", "price": 4000},
    {"id": "service-49", "name": "Complete Look Coordination", "category": "Wedding", "price": 5000}
  ]',
  'Wedding',
  14000, -- Total price
  180, -- Duration in minutes
  'Royal wedding preparation with premium photography makeup, traditional turban styling, and complete look coordination for a regal appearance.',
  '[
    {"id": "product-48", "name": "Premium Makeup"},
    {"id": "product-49", "name": "Hair Styling Kit"},
    {"id": "product-50", "name": "Setting Spray"}
  ]',
  'Schedule with family members
Coordinate with bride''s look
Allow time for traditional rituals',
  CURRENT_TIMESTAMP
);

-- Male Engagement & Haldi Packages
INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Engagement Ready', 
  'male', 
  '[
    {"id": "service-50", "name": "Basic Grooming", "category": "Engagement", "price": 2500},
    {"id": "service-51", "name": "Hair Styling", "category": "Engagement", "price": 1500},
    {"id": "service-52", "name": "Outfit Assistance", "category": "Engagement", "price": 1000}
  ]',
  'Engagement',
  5000, -- Total price
  90, -- Duration in minutes
  'Basic grooming and styling package specifically for engagement ceremonies with outfit assistance.',
  '[
    {"id": "product-51", "name": "Hair Wax"},
    {"id": "product-52", "name": "Face Primer"},
    {"id": "product-53", "name": "Light Powder"}
  ]',
  'Schedule 2 hours before event
Bring complete outfit
Discuss jewelry placement',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Haldi Preparation', 
  'male', 
  '[
    {"id": "service-53", "name": "Minimal Styling", "category": "Haldi", "price": 2000},
    {"id": "service-54", "name": "Hair Arrangement", "category": "Haldi", "price": 1200},
    {"id": "service-55", "name": "Skin Protection", "category": "Haldi", "price": 1000}
  ]',
  'Haldi',
  4200, -- Total price
  60, -- Duration in minutes
  'Minimal styling package with skin protection designed specifically for haldi ceremony.',
  '[
    {"id": "product-54", "name": "Waterproof Products"},
    {"id": "product-55", "name": "Skin Protection Cream"}
  ]',
  'Apply skin protection
Wear appropriate clothing
Schedule before ceremony',
  CURRENT_TIMESTAMP
);

INSERT INTO package_services_from_dashboard 
(package_name, gender, service_names, category, price, duration, description, product_names, specific_todo, created_at)
VALUES 
(
  'Premium Pre-Wedding', 
  'male', 
  '[
    {"id": "service-56", "name": "Complete Grooming", "category": "Pre-wedding", "price": 4000},
    {"id": "service-57", "name": "Hair & Beard Styling", "category": "Pre-wedding", "price": 2500},
    {"id": "service-58", "name": "Outfit Coordination", "category": "Pre-wedding", "price": 2000}
  ]',
  'Pre-wedding',
  8500, -- Total price
  120, -- Duration in minutes
  'Complete pre-wedding grooming and styling package suitable for both engagement and pre-wedding ceremonies.',
  '[
    {"id": "product-56", "name": "Premium Grooming Kit"},
    {"id": "product-57", "name": "Hair Products"},
    {"id": "product-58", "name": "Beard Products"}
  ]',
  'Schedule day before or of event
Coordinate with photographer
Discuss specific look requirements',
  CURRENT_TIMESTAMP
);

-- Commit transaction
COMMIT;
`;

async function runWeddingPackagesMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting wedding packages migration...');
    
    // Execute the SQL
    await client.query(weddingPackagesSQL);
    
    console.log('✅ Wedding packages migration completed successfully!');
    
    // Count how many packages were added
    const countResult = await client.query(`
      SELECT gender, COUNT(*) 
      FROM package_services_from_dashboard 
      GROUP BY gender;
    `);
    
    console.log('\nPackages added to database:');
    countResult.rows.forEach(row => {
      console.log(`- ${row.gender} packages: ${row.count}`);
    });
    
    const totalResult = await client.query('SELECT COUNT(*) FROM package_services_from_dashboard;');
    console.log(`\nTotal packages in database: ${totalResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runWeddingPackagesMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
