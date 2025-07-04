const { query } = require('./db');

// Sample image URL for services
const SAMPLE_IMAGE_URL = 'https://drive.usercontent.google.com/download?id=1zf1Qlt7UAnq3xubeTQKPg9WDHrhRsSdC';

// Sample data for salon services
const SALON_SERVICES = [
  {
    service_name: 'Classic Haircut',
    service_categories: 'Haircut',
    price: 1200,
    duration: 45,
    description: 'Professional haircut service with expert styling and finishing touches.',
    things_to_know: 'Please arrive with clean, dry hair for best results.',
    what_packages_include: 'Consultation, shampoo, haircut, styling, and product recommendations.',
    precautions: 'Inform stylist of any scalp conditions or allergies.',
    products_used: 'Professional salon-grade shampoo, conditioner, and styling products.',
    service_image: SAMPLE_IMAGE_URL
  },
  {
    service_name: 'Hair Coloring',
    service_categories: 'Hair Color',
    price: 2500,
    duration: 120,
    description: 'Full hair coloring service using premium products for vibrant, long-lasting results.',
    things_to_know: 'Patch test required 48 hours before appointment for first-time color clients.',
    what_packages_include: 'Consultation, color application, processing, wash, and style.',
    precautions: 'Avoid washing hair 24-48 hours before appointment for best results.',
    products_used: 'Professional color products, color-safe shampoo and conditioner.',
    service_image: SAMPLE_IMAGE_URL
  },
  {
    service_name: 'Facial Treatment',
    service_categories: 'Facial',
    price: 1800,
    duration: 60,
    description: 'Rejuvenating facial treatment customized for your skin type.',
    things_to_know: 'Come with clean skin, free of makeup.',
    what_packages_include: 'Skin analysis, cleansing, exfoliation, mask, and moisturizer application.',
    precautions: 'Not recommended for those with severe acne or skin conditions without consultation.',
    products_used: 'High-quality skincare products suited for your skin type.',
    service_image: SAMPLE_IMAGE_URL
  }
];

// Sample data for PRP services
const PRP_SERVICES = [
  {
    service_name: 'PRP Hair Treatment',
    service_categories: 'Hair Restoration',
    price: 15000,
    duration: 90,
    description: 'Advanced PRP therapy to stimulate hair growth and improve hair thickness.',
    things_to_know: 'Consultation required before first treatment.',
    what_packages_include: 'Blood draw, PRP preparation, scalp treatment, and post-care instructions.',
    precautions: 'Avoid blood thinners for 1 week prior to treatment.',
    products_used: 'Sterile equipment, local anesthetic, and growth factors.',
    service_image: SAMPLE_IMAGE_URL
  },
  {
    service_name: 'PRP Facial Rejuvenation',
    service_categories: 'Skin Rejuvenation',
    price: 18000,
    duration: 75,
    description: 'PRP facial treatment to improve skin texture, tone, and reduce fine lines.',
    things_to_know: 'Results develop over 3-4 weeks and continue to improve.',
    what_packages_include: 'Blood draw, PRP preparation, facial application, and aftercare.',
    precautions: 'Avoid sun exposure and retinol products for 1 week after treatment.',
    products_used: 'Sterile equipment, numbing cream, and hyaluronic acid serum.',
    service_image: SAMPLE_IMAGE_URL
  }
];

// Sample data for diagnostics services
const DIAGNOSTICS_SERVICES = [
  {
    service_name: 'Skin Analysis',
    service_categories: 'Skin Diagnostics',
    price: 1000,
    duration: 30,
    description: 'Comprehensive skin analysis to identify skin type, concerns, and recommend treatments.',
    things_to_know: 'Come with clean skin, free of makeup.',
    what_packages_include: 'Digital skin scanning, consultation, and personalized treatment plan.',
    precautions: 'Inform specialist of any skin conditions or allergies.',
    products_used: 'Advanced skin analysis technology and diagnostic tools.',
    service_image: SAMPLE_IMAGE_URL
  },
  {
    service_name: 'Hair and Scalp Assessment',
    service_categories: 'Hair Diagnostics',
    price: 1200,
    duration: 45,
    description: 'Detailed analysis of hair and scalp health to identify issues and recommend solutions.',
    things_to_know: 'Preferably come with unwashed hair for accurate assessment.',
    what_packages_include: 'Scalp examination, hair strand analysis, and customized treatment recommendations.',
    precautions: 'Inform specialist of any scalp conditions or allergies.',
    products_used: 'Digital microscopy and diagnostic equipment.',
    service_image: SAMPLE_IMAGE_URL
  }
];

// Function to populate dashboard service tables
async function populateDashboardServices() {
  try {
    console.log('🚀 Starting to populate dashboard service tables...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data from dashboard service tables...');
    await query('DELETE FROM dashboard_salon_services');
    await query('DELETE FROM dashboard_prp_services');
    await query('DELETE FROM dashboard_diagnostics_services');
    
    // Reset sequences
    await query('ALTER SEQUENCE dashboard_salon_services_id_seq RESTART WITH 1');
    await query('ALTER SEQUENCE dashboard_prp_services_id_seq RESTART WITH 1');
    await query('ALTER SEQUENCE dashboard_diagnostics_services_id_seq RESTART WITH 1');
    
    console.log('✅ Existing data cleared');
    
    // Insert salon services
    console.log('💇‍♀️ Inserting salon services...');
    for (const service of SALON_SERVICES) {
      await query(
        `INSERT INTO dashboard_salon_services 
        (service_name, service_categories, price, duration, description, 
        things_to_know, what_packages_include, precautions, products_used, service_image) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          service.service_name,
          service.service_categories,
          service.price,
          service.duration,
          service.description,
          service.things_to_know,
          service.what_packages_include,
          service.precautions,
          service.products_used,
          service.service_image
        ]
      );
      console.log(`  ✅ Added salon service: ${service.service_name}`);
    }
    
    // Insert PRP services
    console.log('💉 Inserting PRP services...');
    for (const service of PRP_SERVICES) {
      await query(
        `INSERT INTO dashboard_prp_services 
        (service_name, service_categories, price, duration, description, 
        things_to_know, what_packages_include, precautions, products_used, service_image) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          service.service_name,
          service.service_categories,
          service.price,
          service.duration,
          service.description,
          service.things_to_know,
          service.what_packages_include,
          service.precautions,
          service.products_used,
          service.service_image
        ]
      );
      console.log(`  ✅ Added PRP service: ${service.service_name}`);
    }
    
    // Insert diagnostics services
    console.log('🔬 Inserting diagnostics services...');
    for (const service of DIAGNOSTICS_SERVICES) {
      await query(
        `INSERT INTO dashboard_diagnostics_services 
        (service_name, service_categories, price, duration, description, 
        things_to_know, what_packages_include, precautions, products_used, service_image) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          service.service_name,
          service.service_categories,
          service.price,
          service.duration,
          service.description,
          service.things_to_know,
          service.what_packages_include,
          service.precautions,
          service.products_used,
          service.service_image
        ]
      );
      console.log(`  ✅ Added diagnostics service: ${service.service_name}`);
    }
    
    console.log('🎉 All dashboard service tables populated successfully!');
  } catch (error) {
    console.error('❌ Error populating dashboard service tables:', error.message);
  }
}

// Run the population function if this script is executed directly
if (require.main === module) {
  populateDashboardServices()
    .then(() => {
      console.log('✅ Script completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other modules
  module.exports = { populateDashboardServices };
}