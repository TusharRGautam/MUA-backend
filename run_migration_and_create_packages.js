/**
 * Script to run the migration and create sample package entries
 * Date: 2025-06-10
 */

const { query, pool } = require('./db');
const migration = require('./migrations/20250610_create_package_services_from_dashboard');

// Sample image URLs for package icons - using placeholder images instead of Google Drive
const GROOM_ICON = "https://images.pexels.com/photos/3785991/pexels-photo-3785991.jpeg"; 
const BRIDAL_ICON = "https://images.pexels.com/photos/1113734/pexels-photo-1113734.jpeg";

// Function to create a male/groom package
async function createGroomPackage() {
  try {
    console.log('Creating Groom package...');
    
    // Service items for groom package
    const serviceItems = [
      {
        id: "groom-service-1",
        name: "Premium Haircut & Styling",
        category: "Hair",
        price: 2500
      },
      {
        id: "groom-service-2",
        name: "Facial Grooming & Cleanup",
        category: "Face",
        price: 3000
      },
      {
        id: "groom-service-3",
        name: "Beard Styling & Trimming",
        category: "Grooming",
        price: 1500
      },
      {
        id: "groom-service-4",
        name: "Anti-Tan Treatment",
        category: "Skin",
        price: 2000
      }
    ];
    
    // Products used
    const products = [
      {
        id: "groom-product-1",
        name: "Premium Hair Serum"
      },
      {
        id: "groom-product-2",
        name: "Beard Oil"
      },
      {
        id: "groom-product-3",
        name: "Facial Scrub"
      },
      {
        id: "groom-product-4",
        name: "Anti-Tan Cream"
      }
    ];
    
    // Calculate total price
    const totalPrice = serviceItems.reduce((sum, service) => sum + service.price, 0);
    
    // Things to do
    const thingsToDo = 
`Exfoliate your skin the night before
Get a good night's sleep for fresh appearance
Avoid alcohol for 24 hours before the session
Arrive with clean, washed face
Bring reference photos if you have specific styles in mind`;
    
    // Insert the groom package
    const result = await query(
      `INSERT INTO package_services_from_dashboard 
       (icon_image, package_name, gender, service_names, category, price, duration, 
        description, product_names, things_to_know, reason, specific_todo, vendor_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        GROOM_ICON,
        "Premium Groom Package",
        "male",
        JSON.stringify(serviceItems),
        "Grooming",
        totalPrice,
        120, // 2 hours duration
        "Complete grooming package for grooms that includes premium hair styling, facial grooming, beard styling, and anti-tan treatment. Perfect for wedding day preparation.",
        JSON.stringify(products),
        "Prepares the groom for the wedding day with a comprehensive grooming package.",
        "Ensures the groom looks his best on the wedding day with professional grooming services.",
        thingsToDo,
        1 // vendor_id
      ]
    );
    
    console.log('Groom package created successfully:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating Groom package:', error);
    throw error;
  }
}

// Function to create a female/bridal package
async function createBridalPackage() {
  try {
    console.log('Creating Bridal package...');
    
    // Service items for bridal package
    const serviceItems = [
      {
        id: "bridal-service-1",
        name: "Bridal Makeup",
        category: "Makeup",
        price: 8000
      },
      {
        id: "bridal-service-2",
        name: "Hair Styling & Decoration",
        category: "Hair",
        price: 5000
      },
      {
        id: "bridal-service-3",
        name: "Pre-Bridal Facial",
        category: "Skin",
        price: 3500
      },
      {
        id: "bridal-service-4",
        name: "Nail Art & Manicure",
        category: "Nails",
        price: 2500
      },
      {
        id: "bridal-service-5",
        name: "Mehndi Application",
        category: "Traditional",
        price: 4000
      }
    ];
    
    // Products used
    const products = [
      {
        id: "bridal-product-1",
        name: "HD Foundation"
      },
      {
        id: "bridal-product-2",
        name: "Long-lasting Lipstick"
      },
      {
        id: "bridal-product-3",
        name: "Waterproof Mascara"
      },
      {
        id: "bridal-product-4",
        name: "Setting Spray"
      },
      {
        id: "bridal-product-5",
        name: "Hair Glitter"
      },
      {
        id: "bridal-product-6",
        name: "Nail Polish"
      }
    ];
    
    // Calculate total price
    const totalPrice = serviceItems.reduce((sum, service) => sum + service.price, 0);
    
    // Things to do
    const thingsToDo = 
`Have a patch test 48 hours before the session
Get adequate sleep the night before
Stay hydrated before the session
Wear a button-down shirt for easy changing
Bring your jewelry and accessories
Avoid heavy meals before the session
Discuss your outfit colors in advance`;
    
    // Insert the bridal package
    const result = await query(
      `INSERT INTO package_services_from_dashboard 
       (icon_image, package_name, gender, service_names, category, price, duration, 
        description, product_names, things_to_know, reason, specific_todo, vendor_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        BRIDAL_ICON,
        "Deluxe Bridal Package",
        "female",
        JSON.stringify(serviceItems),
        "Bridal",
        totalPrice,
        240, // 4 hours duration
        "Comprehensive bridal package including professional makeup, hair styling, pre-bridal facial, nail art, and mehndi application. Perfect for making the bride look gorgeous on her special day.",
        JSON.stringify(products),
        "Complete bridal beauty preparation for the wedding day.",
        "Ensures the bride looks radiant and beautiful with professional beauty services.",
        thingsToDo,
        1 // vendor_id
      ]
    );
    
    console.log('Bridal package created successfully:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating Bridal package:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting migration and sample data creation...');
    
    // Run the migration
    await migration.up();
    
    // Create the packages
    const groomPackage = await createGroomPackage();
    const bridalPackage = await createBridalPackage();
    
    console.log('Successfully created packages:');
    console.log('1. Groom Package ID:', groomPackage.id);
    console.log('2. Bridal Package ID:', bridalPackage.id);
    
    console.log('Process completed successfully!');
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    // Close the database pool
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Run the main function
main(); 