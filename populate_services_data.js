const { query } = require('./src/config/database');

// Image URL provided by user
const IMAGE_URL = 'https://drive.usercontent.google.com/download?id=1zf1Qlt7UAnq3xubeTQKPg9WDHrhRsSdC';

// Categories and their services
const FEMALE_CATEGORIES = {
  'Haircut': [
    'Classic Bob Cut', 'Layered Haircut', 'Pixie Cut', 'Long Layers', 'Blunt Cut',
    'Shag Haircut', 'Asymmetrical Cut', 'Curtain Bangs Cut', 'Wolf Cut', 'Feathered Cut'
  ],
  'Nail': [
    'Classic Manicure', 'Gel Polish', 'French Manicure', 'Nail Art Design', 'Acrylic Extensions',
    'Gel Extensions', 'Nail Repair', 'Cuticle Care', 'Hand Massage', 'Nail Strengthening'
  ],
  'Facial': [
    'Deep Cleansing Facial', 'Anti-Aging Facial', 'Hydrating Facial', 'Brightening Facial', 'Acne Treatment',
    'Gold Facial', 'Diamond Facial', 'Oxygen Facial', 'Vitamin C Facial', 'Collagen Facial'
  ],
  'Hair Color': [
    'Full Hair Color', 'Highlights', 'Lowlights', 'Balayage', 'Ombre',
    'Root Touch-up', 'Color Correction', 'Fashion Colors', 'Gray Coverage', 'Glossing Treatment'
  ],
  'Waxing': [
    'Full Body Wax', 'Leg Wax', 'Arm Wax', 'Underarm Wax', 'Bikini Wax',
    'Brazilian Wax', 'Eyebrow Wax', 'Upper Lip Wax', 'Chin Wax', 'Back Wax'
  ],
  'Mehendi': [
    'Bridal Mehendi', 'Arabic Mehendi', 'Indian Traditional', 'Floral Design', 'Geometric Pattern',
    'Mandala Design', 'Rose Pattern', 'Peacock Design', 'Heart Design', 'Minimalist Mehendi'
  ]
};

const MALE_CATEGORIES = {
  'Haircut': [
    'Classic Fade', 'Buzz Cut', 'Crew Cut', 'Pompadour', 'Undercut',
    'Side Part', 'Quiff', 'Textured Crop', 'Slick Back', 'Modern Mullet'
  ],
  'Skin & Facial': [
    'Deep Cleansing Facial', 'Anti-Aging Treatment', 'Blackhead Removal', 'Moisturizing Facial', 'Beard Facial',
    'Charcoal Facial', 'Vitamin E Facial', 'Oil Control Facial', 'Exfoliating Treatment', 'Hydrating Mask'
  ],
  'Massage & Spa': [
    'Full Body Massage', 'Head Massage', 'Shoulder Massage', 'Back Massage', 'Foot Massage',
    'Hot Stone Massage', 'Deep Tissue Massage', 'Relaxation Massage', 'Sports Massage', 'Aromatherapy'
  ],
  'Grooming & Hygiene': [
    'Beard Trim', 'Mustache Styling', 'Eyebrow Grooming', 'Nose Hair Trim', 'Ear Hair Removal',
    'Beard Oil Treatment', 'Shaving Service', 'Beard Shaping', 'Sideburn Trim', 'Complete Grooming'
  ]
};

// Function to generate random price between min and max
function getRandomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate random duration between min and max (in minutes)
function getRandomDuration(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to get service description
function getServiceDescription(serviceName, category) {
  const descriptions = {
    'Haircut': `Professional ${serviceName.toLowerCase()} service with expert styling and finishing touches.`,
    'Nail': `Premium ${serviceName.toLowerCase()} service with high-quality products and attention to detail.`,
    'Facial': `Rejuvenating ${serviceName.toLowerCase()} treatment for healthy and glowing skin.`,
    'Hair Color': `Expert ${serviceName.toLowerCase()} service using premium color products for stunning results.`,
    'Waxing': `Professional ${serviceName.toLowerCase()} service for smooth and hair-free skin.`,
    'Mehendi': `Beautiful ${serviceName.toLowerCase()} application with intricate patterns and natural henna.`,
    'Skin & Facial': `Specialized ${serviceName.toLowerCase()} designed for men's skin care needs.`,
    'Massage & Spa': `Relaxing ${serviceName.toLowerCase()} therapy for stress relief and muscle tension.`,
    'Grooming & Hygiene': `Professional ${serviceName.toLowerCase()} service for a well-groomed appearance.`
  };
  
  return descriptions[category] || `Professional ${serviceName.toLowerCase()} service with expert care.`;
}

// Function to get icon description
function getIconDescription(category) {
  const descriptions = {
    'Haircut': 'Professional hair cutting and styling services',
    'Nail': 'Complete nail care and beauty treatments',
    'Facial': 'Skin care and facial treatment services',
    'Hair Color': 'Hair coloring and highlighting services',
    'Waxing': 'Hair removal and waxing treatments',
    'Mehendi': 'Traditional henna art and design services',
    'Skin & Facial': 'Men\'s skincare and facial treatments',
    'Massage & Spa': 'Relaxation and therapeutic massage services',
    'Grooming & Hygiene': 'Men\'s grooming and personal care services'
  };
  
  return descriptions[category] || 'Professional beauty and wellness services';
}

// Function to get product names for a category
function getProductNames(category) {
  const products = {
    'Haircut': ['Hair Serum', 'Styling Gel', 'Hair Spray', 'Leave-in Conditioner', 'Hair Oil', 'Dry Shampoo', 'Hair Mask', 'Heat Protectant', 'Hair Wax', 'Volumizing Mousse'],
    'Nail': ['Nail Polish', 'Base Coat', 'Top Coat', 'Cuticle Oil', 'Hand Cream', 'Nail File', 'Buffer', 'Nail Art Stickers', 'Nail Strengthener', 'Quick Dry Drops'],
    'Facial': ['Face Cleanser', 'Moisturizer', 'Face Mask', 'Toner', 'Serum', 'Sunscreen', 'Eye Cream', 'Exfoliator', 'Face Oil', 'Micellar Water'],
    'Hair Color': ['Hair Dye', 'Developer', 'Color Shampoo', 'Color Conditioner', 'Toner', 'Bleach', 'Color Remover', 'Gloss Treatment', 'Root Touch-up', 'Color Protectant'],
    'Waxing': ['Wax Strips', 'Hot Wax', 'Pre-wax Oil', 'Post-wax Lotion', 'Wax Heater', 'Spatulas', 'Soothing Gel', 'Ingrown Hair Treatment', 'Exfoliating Scrub', 'Numbing Cream'],
    'Mehendi': ['Henna Powder', 'Henna Cones', 'Essential Oils', 'Lemon Sugar Mix', 'Applicator Bottles', 'Design Stencils', 'Aftercare Oil', 'Henna Remover', 'Glitter', 'Gems'],
    'Skin & Facial': ['Face Wash', 'Aftershave Balm', 'Beard Oil', 'Face Moisturizer', 'Exfoliating Scrub', 'Anti-aging Cream', 'Sunscreen', 'Eye Gel', 'Toner', 'Face Mask'],
    'Massage & Spa': ['Massage Oil', 'Essential Oils', 'Hot Stones', 'Aromatherapy Candles', 'Body Lotion', 'Muscle Balm', 'Relaxation Spray', 'Massage Cream', 'Bath Salts', 'Towel Warmer'],
    'Grooming & Hygiene': ['Beard Trimmer', 'Shaving Cream', 'Aftershave', 'Beard Balm', 'Hair Pomade', 'Nose Hair Trimmer', 'Eyebrow Scissors', 'Cologne', 'Deodorant', 'Body Wash']
  };
  
  return products[category] || ['Product 1', 'Product 2', 'Product 3', 'Product 4', 'Product 5', 'Product 6', 'Product 7', 'Product 8', 'Product 9', 'Product 10'];
}

async function populateServicesData() {
  try {
    console.log('🚀 Starting to populate services data...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await query('DELETE FROM our_services_product');
    await query('DELETE FROM our_services_section');
    await query('DELETE FROM our_services_icons');
    
    // Reset sequences
    await query('ALTER SEQUENCE our_services_icons_id_seq RESTART WITH 1');
    await query('ALTER SEQUENCE our_services_section_id_seq RESTART WITH 1');
    await query('ALTER SEQUENCE our_services_product_id_seq RESTART WITH 1');
    
    console.log('✅ Existing data cleared');
    
    let iconIdCounter = 1;
    let serviceIdCounter = 1;
    let productIdCounter = 1;
    
    // Process Female Categories
    console.log('👩 Processing Female Categories...');
    for (const [category, services] of Object.entries(FEMALE_CATEGORIES)) {
      console.log(`  📝 Processing category: ${category}`);
      
      // 1. Create Icon for this category
      const iconResult = await query(
        `INSERT INTO our_services_icons (icon_title, toggle_gender, icon, icon_description) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          `${category} Icon`,
          'female', // female for female categories
          IMAGE_URL,
          getIconDescription(category)
        ]
      );
      
      const iconId = iconResult.rows[0].id;
      console.log(`    ✅ Created icon ID: ${iconId} for ${category}`);
      
      // 2. Create 10 Services for this category
      for (let i = 0; i < services.length; i++) {
        const serviceName = services[i];
        const price = getRandomPrice(500, 5000); // Random price between ₹500-₹5000
        const duration = getRandomDuration(30, 180); // Random duration between 30-180 minutes
        
        const serviceResult = await query(
          `INSERT INTO our_services_section 
           (service_name, category, toggle_gender_services, price, duration, service_image, service_description, icon_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            serviceName,
            category,
            'female', // female for female services
            price,
            duration,
            IMAGE_URL,
            getServiceDescription(serviceName, category),
            iconId
          ]
        );
        
        const serviceId = serviceResult.rows[0].id;
        console.log(`      ✅ Created service ID: ${serviceId} - ${serviceName}`);
        
        // 3. Create 10 Products for this service
        const productNames = getProductNames(category);
        for (let j = 0; j < productNames.length; j++) {
          await query(
            `INSERT INTO our_services_product (our_services_category, product_name, service_id) 
             VALUES ($1, $2, $3)`,
            [
              category,
              productNames[j],
              serviceId
            ]
          );
        }
        console.log(`        ✅ Created 10 products for ${serviceName}`);
      }
    }
    
    // Process Male Categories
    console.log('👨 Processing Male Categories...');
    for (const [category, services] of Object.entries(MALE_CATEGORIES)) {
      console.log(`  📝 Processing category: ${category}`);
      
      // 1. Create Icon for this category
      const iconResult = await query(
        `INSERT INTO our_services_icons (icon_title, toggle_gender, icon, icon_description) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          `${category} Icon`,
          'male', // male for male categories
          IMAGE_URL,
          getIconDescription(category)
        ]
      );
      
      const iconId = iconResult.rows[0].id;
      console.log(`    ✅ Created icon ID: ${iconId} for ${category}`);
      
      // 2. Create 10 Services for this category
      for (let i = 0; i < services.length; i++) {
        const serviceName = services[i];
        const price = getRandomPrice(300, 3000); // Random price between ₹300-₹3000 for male services
        const duration = getRandomDuration(20, 120); // Random duration between 20-120 minutes
        
        const serviceResult = await query(
          `INSERT INTO our_services_section 
           (service_name, category, toggle_gender_services, price, duration, service_image, service_description, icon_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            serviceName,
            category,
            'male', // male for male services
            price,
            duration,
            IMAGE_URL,
            getServiceDescription(serviceName, category),
            iconId
          ]
        );
        
        const serviceId = serviceResult.rows[0].id;
        console.log(`      ✅ Created service ID: ${serviceId} - ${serviceName}`);
        
        // 3. Create 10 Products for this service
        const productNames = getProductNames(category);
        for (let j = 0; j < productNames.length; j++) {
          await query(
            `INSERT INTO our_services_product (our_services_category, product_name, service_id) 
             VALUES ($1, $2, $3)`,
            [
              category,
              productNames[j],
              serviceId
            ]
          );
        }
        console.log(`        ✅ Created 10 products for ${serviceName}`);
      }
    }
    
    // Display summary
    console.log('\n📊 SUMMARY:');
    
    const iconCount = await query('SELECT COUNT(*) FROM our_services_icons');
    const serviceCount = await query('SELECT COUNT(*) FROM our_services_section');
    const productCount = await query('SELECT COUNT(*) FROM our_services_product');
    
    console.log(`✅ Icons created: ${iconCount.rows[0].count}`);
    console.log(`✅ Services created: ${serviceCount.rows[0].count}`);
    console.log(`✅ Products created: ${productCount.rows[0].count}`);
    
    // Display breakdown by category
    console.log('\n📋 BREAKDOWN BY CATEGORY:');
    
    const categoryBreakdown = await query(`
      SELECT 
        category,
        toggle_gender_services,
        COUNT(*) as service_count
      FROM our_services_section 
      GROUP BY category, toggle_gender_services 
      ORDER BY toggle_gender_services, category
    `);
    
    console.log('\nFemale Categories:');
    categoryBreakdown.rows
      .filter(row => row.toggle_gender_services === 'female')
      .forEach(row => {
        console.log(`  ${row.category}: ${row.service_count} services`);
      });
    
    console.log('\nMale Categories:');
    categoryBreakdown.rows
      .filter(row => row.toggle_gender_services === 'male')
      .forEach(row => {
        console.log(`  ${row.category}: ${row.service_count} services`);
      });
    
    console.log('\n🎉 Data population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error populating services data:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  populateServicesData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateServicesData }; 