/**
 * Populate Dashboard Services Script
 * Creates sample services for all three dashboard service tables
 * Ensures at least 2 services per category for each table
 */

const { query } = require('./db');

async function populateDashboardServices() {
  console.log('Starting dashboard services population...');

  try {
    // Salon Services Data
    const salonServices = [
      // Hair Care Category
      {
        service_name: 'Premium Hair Cut & Styling',
        service_category: 'Hair Care',
        service_price: 1500,
        service_duration: 60,
        service_description: 'Professional hair cutting and styling with premium products',
        vendor_id: 1
      },
      {
        service_name: 'Hair Color & Highlights',
        service_category: 'Hair Care',
        service_price: 3500,
        service_duration: 120,
        service_description: 'Complete hair coloring service with highlights and conditioning treatment',
        vendor_id: 1
      },
      // Facial Care Category
      {
        service_name: 'Deep Cleansing Facial',
        service_category: 'Facial Care',
        service_price: 2000,
        service_duration: 90,
        service_description: 'Deep pore cleansing facial with extraction and moisturizing',
        vendor_id: 1
      },
      {
        service_name: 'Anti-Aging Facial Treatment',
        service_category: 'Facial Care',
        service_price: 3000,
        service_duration: 75,
        service_description: 'Advanced anti-aging facial with collagen mask and serum treatment',
        vendor_id: 1
      },
      // Body Care Category
      {
        service_name: 'Full Body Massage',
        service_category: 'Body Care',
        service_price: 2500,
        service_duration: 90,
        service_description: 'Relaxing full body massage with aromatic oils',
        vendor_id: 1
      },
      {
        service_name: 'Body Scrub & Polish',
        service_category: 'Body Care',
        service_price: 1800,
        service_duration: 60,
        service_description: 'Exfoliating body scrub followed by moisturizing treatment',
        vendor_id: 1
      }
    ];

    // PRP Services Data
    const prpServices = [
      // Hair Restoration Category
      {
        service_name: 'PRP Hair Restoration Therapy',
        service_category: 'Hair Restoration',
        service_price: 8000,
        service_duration: 90,
        service_sessions: 6,
        service_description: 'Platelet-rich plasma therapy for hair regrowth and strengthening',
        included_services: ['Scalp Analysis', 'PRP Injection', 'Post-treatment Care'],
        vendor_id: 1
      },
      {
        service_name: 'Advanced Hair PRP with Microneedling',
        service_category: 'Hair Restoration',
        service_price: 12000,
        service_duration: 120,
        service_sessions: 8,
        service_description: 'Enhanced PRP therapy combined with microneedling for maximum hair growth',
        included_services: ['Scalp Preparation', 'Microneedling', 'PRP Treatment', 'Growth Serum'],
        vendor_id: 1
      },
      // Skin Rejuvenation Category
      {
        service_name: 'PRP Facial Rejuvenation',
        service_category: 'Skin Rejuvenation',
        service_price: 6000,
        service_duration: 75,
        service_sessions: 4,
        service_description: 'Vampire facial using your own plasma for natural skin rejuvenation',
        included_services: ['Skin Analysis', 'Blood Draw', 'PRP Preparation', 'Facial Application'],
        vendor_id: 1
      },
      {
        service_name: 'PRP Under-Eye Treatment',
        service_category: 'Skin Rejuvenation',
        service_price: 4500,
        service_duration: 45,
        service_sessions: 3,
        service_description: 'Targeted PRP treatment for under-eye dark circles and fine lines',
        included_services: ['Eye Area Assessment', 'PRP Injection', 'Cooling Treatment'],
        vendor_id: 1
      },
      // Joint Care Category
      {
        service_name: 'PRP Joint Therapy',
        service_category: 'Joint Care',
        service_price: 15000,
        service_duration: 60,
        service_sessions: 3,
        service_description: 'PRP injection therapy for joint pain relief and cartilage regeneration',
        included_services: ['Joint Assessment', 'Ultrasound Guidance', 'PRP Injection', 'Follow-up Care'],
        vendor_id: 1
      },
      {
        service_name: 'PRP Sports Injury Treatment',
        service_category: 'Joint Care',
        service_price: 18000,
        service_duration: 90,
        service_sessions: 4,
        service_description: 'Specialized PRP therapy for sports-related injuries and faster recovery',
        included_services: ['Injury Assessment', 'MRI Review', 'PRP Treatment', 'Rehabilitation Plan'],
        vendor_id: 1
      }
    ];

    // Diagnostics Services Data
    const diagnosticsServices = [
      // Blood Tests Category
      {
        service_name: 'Complete Blood Count (CBC)',
        service_category: 'Blood Tests',
        service_price: 500,
        service_duration: 15,
        service_description: 'Comprehensive blood analysis including RBC, WBC, and platelet count',
        preparation_requirements: 'No special preparation required',
        home_collection: 'yes',
        report_delivery_time: '24 hours',
        included_services: ['Blood Collection', 'Lab Analysis', 'Digital Report'],
        vendor_id: 1
      },
      {
        service_name: 'Lipid Profile Test',
        service_category: 'Blood Tests',
        service_price: 800,
        service_duration: 15,
        service_description: 'Cholesterol and triglyceride levels assessment',
        preparation_requirements: '12-hour fasting required',
        home_collection: 'yes',
        report_delivery_time: '24 hours',
        included_services: ['Fasting Blood Collection', 'Lipid Analysis', 'Consultation'],
        vendor_id: 1
      },
      // Imaging Category
      {
        service_name: 'Digital X-Ray',
        service_category: 'Imaging',
        service_price: 1200,
        service_duration: 30,
        service_description: 'High-resolution digital X-ray imaging for bone and joint assessment',
        preparation_requirements: 'Remove metal objects and jewelry',
        home_collection: 'no',
        report_delivery_time: '2 hours',
        included_services: ['Digital Imaging', 'Radiologist Review', 'CD/Digital Copy'],
        vendor_id: 1
      },
      {
        service_name: 'Ultrasound Scan',
        service_category: 'Imaging',
        service_price: 2000,
        service_duration: 45,
        service_description: 'Non-invasive ultrasound imaging for internal organ assessment',
        preparation_requirements: 'Fasting for abdominal scans, full bladder for pelvic scans',
        home_collection: 'no',
        report_delivery_time: '4 hours',
        included_services: ['Ultrasound Scan', 'Specialist Review', 'Printed Images'],
        vendor_id: 1
      },
      // Health Checkup Category
      {
        service_name: 'Basic Health Checkup',
        service_category: 'Health Checkup',
        service_price: 2500,
        service_duration: 60,
        service_description: 'Comprehensive basic health screening package',
        preparation_requirements: '12-hour fasting required',
        home_collection: 'partial',
        report_delivery_time: '48 hours',
        included_services: ['Blood Tests', 'Urine Analysis', 'ECG', 'Doctor Consultation'],
        vendor_id: 1
      },
      {
        service_name: 'Executive Health Checkup',
        service_category: 'Health Checkup',
        service_price: 5000,
        service_duration: 120,
        service_description: 'Premium comprehensive health screening with advanced tests',
        preparation_requirements: '12-hour fasting, comfortable clothing',
        home_collection: 'partial',
        report_delivery_time: '72 hours',
        included_services: ['Advanced Blood Panel', 'Imaging Studies', 'Cardiac Assessment', 'Specialist Consultation'],
        vendor_id: 1
      }
    ];

    // Insert Salon Services
    console.log('Inserting salon services...');
    for (const service of salonServices) {
      await query(
        `INSERT INTO dashboard_salon_services 
         (service_name, service_category, service_price, service_duration, service_description, vendor_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [service.service_name, service.service_category, service.service_price, 
         service.service_duration, service.service_description, service.vendor_id]
      );
      console.log(`✓ Added salon service: ${service.service_name}`);
    }

    // Insert PRP Services
    console.log('\nInserting PRP services...');
    for (const service of prpServices) {
      await query(
        `INSERT INTO dashboard_prp_services 
         (service_name, service_category, service_price, service_duration, service_sessions, 
          service_description, included_services, vendor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [service.service_name, service.service_category, service.service_price, 
         service.service_duration, service.service_sessions, service.service_description,
         service.included_services.join(', '), service.vendor_id]
      );
      console.log(`✓ Added PRP service: ${service.service_name}`);
    }

    // Insert Diagnostics Services
    console.log('\nInserting diagnostics services...');
    for (const service of diagnosticsServices) {
      await query(
        `INSERT INTO dashboard_diagnostics_services 
         (service_name, service_category, service_price, service_duration, service_description, 
          preparation_requirements, home_collection, report_delivery_time, included_services, vendor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [service.service_name, service.service_category, service.service_price, 
         service.service_duration, service.service_description, service.preparation_requirements,
         service.home_collection, service.report_delivery_time, 
         JSON.stringify(service.included_services), service.vendor_id]
      );
      console.log(`✓ Added diagnostics service: ${service.service_name}`);
    }

    // Verify data insertion
    console.log('\n=== Verification ===');
    
    const salonCount = await query('SELECT COUNT(*) FROM dashboard_salon_services');
    console.log(`Salon Services: ${salonCount.rows[0].count}`);
    
    const prpCount = await query('SELECT COUNT(*) FROM dashboard_prp_services');
    console.log(`PRP Services: ${prpCount.rows[0].count}`);
    
    const diagnosticsCount = await query('SELECT COUNT(*) FROM dashboard_diagnostics_services');
    console.log(`Diagnostics Services: ${diagnosticsCount.rows[0].count}`);

    // Show categories and service counts
    console.log('\n=== Category Breakdown ===');
    
    const salonCategories = await query(
      'SELECT service_category, COUNT(*) as count FROM dashboard_salon_services GROUP BY service_category'
    );
    console.log('Salon Service Categories:');
    salonCategories.rows.forEach(row => {
      console.log(`  ${row.service_category}: ${row.count} services`);
    });

    const prpCategories = await query(
      'SELECT service_category, COUNT(*) as count FROM dashboard_prp_services GROUP BY service_category'
    );
    console.log('\nPRP Service Categories:');
    prpCategories.rows.forEach(row => {
      console.log(`  ${row.service_category}: ${row.count} services`);
    });

    const diagnosticsCategories = await query(
      'SELECT service_category, COUNT(*) as count FROM dashboard_diagnostics_services GROUP BY service_category'
    );
    console.log('\nDiagnostics Service Categories:');
    diagnosticsCategories.rows.forEach(row => {
      console.log(`  ${row.service_category}: ${row.count} services`);
    });

    console.log('\n✅ Dashboard services population completed successfully!');
    console.log('All tables now have at least 2 services per category.');

  } catch (error) {
    console.error('❌ Error populating dashboard services:', error);
    throw error;
  }
}

// Run the population script
if (require.main === module) {
  populateDashboardServices()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateDashboardServices };