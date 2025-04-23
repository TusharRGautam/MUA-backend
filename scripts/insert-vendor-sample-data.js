#!/usr/bin/env node
/**
 * Insert Sample Vendor Data
 * 
 * This script inserts sample data into the vendor tables for testing purposes.
 */

const { pool } = require('../db');

// Load environment variables if needed
require('dotenv').config();

async function insertSampleData() {
  console.log('Starting vendor sample data insertion...');
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Check if registration_and_other_details table exists and has data
    const vendorCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'registration_and_other_details'
      );
    `);
    
    if (!vendorCheckResult.rows[0].exists) {
      console.error('❌ registration_and_other_details table does not exist. Please set up the core tables first.');
      return false;
    }
    
    // Check if we have vendor records to work with
    const vendorResult = await client.query(`
      SELECT sr_no, person_name, business_email
      FROM registration_and_other_details 
      LIMIT 5
    `);
    
    if (vendorResult.rows.length === 0) {
      console.log('No vendor records found. Creating a sample vendor...');
      
      // Create a sample vendor if none exists
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const insertVendorResult = await client.query(`
        INSERT INTO registration_and_other_details (
          business_type, person_name, business_email, gender, phone_number, password
        ) VALUES (
          'salon', 'Sample Vendor', 'vendor@example.com', 'other', '9876543210', $1
        ) RETURNING sr_no
      `, [hashedPassword]);
      
      const vendorId = insertVendorResult.rows[0].sr_no;
      console.log(`✓ Created sample vendor with ID: ${vendorId}`);
      
      // Now insert business info for this vendor
      await insertBusinessInfo(client, vendorId);
      await insertServices(client, vendorId);
      await insertPackages(client, vendorId);
      await insertTransformations(client, vendorId);
      await insertGallery(client, vendorId);
      await insertBookings(client, vendorId);
    } else {
      // Use existing vendors for sample data
      for (const vendor of vendorResult.rows) {
        console.log(`Adding sample data for vendor: ${vendor.person_name} (ID: ${vendor.sr_no})`);
        
        await insertBusinessInfo(client, vendor.sr_no);
        await insertServices(client, vendor.sr_no);
        await insertPackages(client, vendor.sr_no);
        await insertTransformations(client, vendor.sr_no);
        await insertGallery(client, vendor.sr_no);
        await insertBookings(client, vendor.sr_no);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('✅ Sample data insertion completed successfully');
    return true;
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('❌ Sample data insertion failed:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    client.release();
  }
}

async function insertBusinessInfo(client, vendorId) {
  // Check if business info already exists for this vendor
  const businessInfoResult = await client.query(`
    SELECT id FROM vendor_business_info WHERE vendor_id = $1
  `, [vendorId]);
  
  if (businessInfoResult.rows.length > 0) {
    console.log(`Business info already exists for vendor ${vendorId}`);
    return;
  }
  
  // Sample working hours
  const workingHours = {
    monday: { open: "10:00", close: "19:00", isOpen: true },
    tuesday: { open: "10:00", close: "19:00", isOpen: true },
    wednesday: { open: "10:00", close: "19:00", isOpen: true },
    thursday: { open: "10:00", close: "19:00", isOpen: true },
    friday: { open: "10:00", close: "20:00", isOpen: true },
    saturday: { open: "09:00", close: "21:00", isOpen: true },
    sunday: { open: "11:00", close: "17:00", isOpen: false }
  };
  
  // Insert business info
  await client.query(`
    INSERT INTO vendor_business_info (
      vendor_id, business_name, city_name, about, working_hours, profile_picture
    ) VALUES (
      $1, 'Beauty Paradise', 'Mumbai', 
      'We are a premium salon offering a wide range of beauty and styling services with experienced professionals. Our goal is to make you look and feel your best!',
      $2, '/images/salon/logo.jpg'
    )
  `, [vendorId, JSON.stringify(workingHours)]);
  
  console.log(`✓ Inserted business info for vendor ${vendorId}`);
}

async function insertServices(client, vendorId) {
  // Check if services already exist for this vendor
  const servicesResult = await client.query(`
    SELECT COUNT(*) as count FROM vendor_single_services WHERE vendor_id = $1
  `, [vendorId]);
  
  if (servicesResult.rows[0].count > 0) {
    console.log(`Services already exist for vendor ${vendorId}`);
    return;
  }
  
  // Sample services
  const services = [
    { name: 'Haircut & Styling', type: 'Hair', price: '₹500', duration: '45 min' },
    { name: 'Hair Coloring', type: 'Hair', price: '₹2000', duration: '120 min' },
    { name: 'Hair Spa', type: 'Hair', price: '₹1200', duration: '60 min' },
    { name: 'Basic Facial', type: 'Skin', price: '₹800', duration: '45 min' },
    { name: 'Premium Facial', type: 'Skin', price: '₹1500', duration: '60 min' },
    { name: 'Manicure', type: 'Nails', price: '₹400', duration: '30 min' },
    { name: 'Pedicure', type: 'Nails', price: '₹600', duration: '45 min' },
    { name: 'Bridal Makeup', type: 'Makeup', price: '₹8000', duration: '180 min' },
    { name: 'Party Makeup', type: 'Makeup', price: '₹3000', duration: '90 min' },
    { name: 'Nail Art', type: 'Nails', price: '₹800', duration: '60 min' }
  ];
  
  // Insert services
  for (const service of services) {
    await client.query(`
      INSERT INTO vendor_single_services (
        vendor_id, name, type, price, duration
      ) VALUES (
        $1, $2, $3, $4, $5
      )
    `, [vendorId, service.name, service.type, service.price, service.duration]);
  }
  
  console.log(`✓ Inserted ${services.length} services for vendor ${vendorId}`);
}

async function insertPackages(client, vendorId) {
  // Check if packages already exist for this vendor
  const packagesResult = await client.query(`
    SELECT COUNT(*) as count FROM vendor_packages_services WHERE vendor_id = $1
  `, [vendorId]);
  
  if (packagesResult.rows[0].count > 0) {
    console.log(`Packages already exist for vendor ${vendorId}`);
    return;
  }
  
  // Sample packages
  const packages = [
    {
      name: 'Bridal Package',
      price: '₹12000',
      services: [
        { name: 'Bridal Makeup', price: '₹8000' },
        { name: 'Hair Styling', price: '₹2000' },
        { name: 'Manicure & Pedicure', price: '₹1000' },
        { name: 'Facial', price: '₹1500' }
      ]
    },
    {
      name: 'Basic Beauty Package',
      price: '₹2500',
      services: [
        { name: 'Basic Facial', price: '₹800' },
        { name: 'Haircut & Styling', price: '₹500' },
        { name: 'Basic Manicure', price: '₹400' },
        { name: 'Basic Pedicure', price: '₹600' }
      ]
    },
    {
      name: 'Hair Treatment Package',
      price: '₹3500',
      services: [
        { name: 'Hair Spa', price: '₹1200' },
        { name: 'Haircut & Styling', price: '₹500' },
        { name: 'Hair Coloring', price: '₹2000' }
      ]
    }
  ];
  
  // Insert packages and their services
  for (const pkg of packages) {
    // Insert package
    const packageResult = await client.query(`
      INSERT INTO vendor_packages_services (
        vendor_id, name, price
      ) VALUES (
        $1, $2, $3
      ) RETURNING id
    `, [vendorId, pkg.name, pkg.price]);
    
    const packageId = packageResult.rows[0].id;
    
    // Insert package services
    for (const service of pkg.services) {
      await client.query(`
        INSERT INTO package_services (
          package_id, name, price
        ) VALUES (
          $1, $2, $3
        )
      `, [packageId, service.name, service.price]);
    }
  }
  
  console.log(`✓ Inserted ${packages.length} packages for vendor ${vendorId}`);
}

async function insertTransformations(client, vendorId) {
  // Check if transformations already exist for this vendor
  const transformationsResult = await client.query(`
    SELECT COUNT(*) as count FROM vendor_transformations WHERE vendor_id = $1
  `, [vendorId]);
  
  if (transformationsResult.rows[0].count > 0) {
    console.log(`Transformations already exist for vendor ${vendorId}`);
    return;
  }
  
  // Sample transformations
  const transformations = [
    {
      title: 'Hair Color Transformation',
      description: 'Complete hair color change from black to golden blonde',
      before_image: '/images/transformations/before1.jpg',
      after_image: '/images/transformations/after1.jpg'
    },
    {
      title: 'Bridal Makeup',
      description: 'Beautiful bridal makeup with traditional accents',
      before_image: '/images/transformations/before2.jpg',
      after_image: '/images/transformations/after2.jpg'
    },
    {
      title: 'Hair Styling',
      description: 'Completely new hairstyle and color',
      before_image: '/images/transformations/before3.jpg',
      after_image: '/images/transformations/after3.jpg'
    }
  ];
  
  // Insert transformations
  for (const transformation of transformations) {
    await client.query(`
      INSERT INTO vendor_transformations (
        vendor_id, title, description, before_image, after_image
      ) VALUES (
        $1, $2, $3, $4, $5
      )
    `, [
      vendorId, 
      transformation.title, 
      transformation.description, 
      transformation.before_image, 
      transformation.after_image
    ]);
  }
  
  console.log(`✓ Inserted ${transformations.length} transformations for vendor ${vendorId}`);
}

async function insertGallery(client, vendorId) {
  // Check if gallery images already exist for this vendor
  const galleryResult = await client.query(`
    SELECT COUNT(*) as count FROM vendor_gallery_images WHERE vendor_id = $1
  `, [vendorId]);
  
  if (galleryResult.rows[0].count > 0) {
    console.log(`Gallery images already exist for vendor ${vendorId}`);
    return;
  }
  
  // Sample gallery images
  const galleryImages = [
    {
      url: '/images/salon/interior1.jpg',
      caption: 'Salon Reception Area'
    },
    {
      url: '/images/salon/interior2.jpg',
      caption: 'Styling Stations'
    },
    {
      url: '/images/salon/interior3.jpg',
      caption: 'Spa Treatment Room'
    },
    {
      url: '/images/salon/work1.jpg',
      caption: 'Bridal Styling'
    },
    {
      url: '/images/salon/work2.jpg',
      caption: 'Hair Color Treatment'
    }
  ];
  
  // Insert gallery images
  for (const image of galleryImages) {
    await client.query(`
      INSERT INTO vendor_gallery_images (
        vendor_id, url, caption
      ) VALUES (
        $1, $2, $3
      )
    `, [vendorId, image.url, image.caption]);
  }
  
  console.log(`✓ Inserted ${galleryImages.length} gallery images for vendor ${vendorId}`);
}

async function insertBookings(client, vendorId) {
  // Check if bookings already exist for this vendor
  const bookingsResult = await client.query(`
    SELECT COUNT(*) as count FROM vendor_bookings WHERE vendor_id = $1
  `, [vendorId]);
  
  if (bookingsResult.rows[0].count > 0) {
    console.log(`Bookings already exist for vendor ${vendorId}`);
    return;
  }
  
  // Sample bookings
  const bookings = [
    {
      customer_name: 'Priya Sharma',
      service_name: 'Bridal Makeup',
      service_type: 'Makeup',
      date_time: new Date(Date.now() + 86400000), // tomorrow
      booking_status: 'pending',
      payment_status: 'pending',
      contact_number: '9876543210',
      address: '123 North Street, Mumbai',
      notes: 'Traditional bridal look requested',
      is_new: true
    },
    {
      customer_name: 'Anjali Patel',
      service_name: 'Hair Coloring',
      service_type: 'Hair',
      date_time: new Date(Date.now() + 172800000), // day after tomorrow
      booking_status: 'accepted',
      payment_status: 'pending',
      contact_number: '9876543211',
      address: '456 South Avenue, Mumbai',
      notes: 'Wants caramel highlights',
      is_new: false
    },
    {
      customer_name: 'Raj Malhotra',
      service_name: 'Haircut & Styling',
      service_type: 'Hair',
      date_time: new Date(Date.now() - 86400000), // yesterday
      booking_status: 'completed',
      payment_status: 'paid',
      contact_number: '9876543212',
      address: '789 East Road, Mumbai',
      notes: '',
      is_new: false
    },
    {
      customer_name: 'Meera Reddy',
      service_name: 'Premium Facial',
      service_type: 'Skin',
      date_time: new Date(Date.now() + 259200000), // 3 days from now
      booking_status: 'accepted',
      payment_status: 'paid',
      contact_number: '9876543213',
      address: '234 West Lane, Mumbai',
      notes: 'Has sensitive skin',
      is_new: false
    },
    {
      customer_name: 'Karan Singh',
      service_name: 'Basic Beauty Package',
      service_type: 'Package',
      date_time: new Date(Date.now() + 86400000 + 3600000), // tomorrow + 1 hour
      booking_status: 'pending',
      payment_status: 'pending',
      contact_number: '9876543214',
      address: '567 Central Road, Mumbai',
      notes: 'Birthday preparation',
      is_new: true
    }
  ];
  
  // Insert bookings
  for (const booking of bookings) {
    await client.query(`
      INSERT INTO vendor_bookings (
        vendor_id, customer_name, service_name, service_type, date_time,
        booking_status, payment_status, contact_number, address, notes, is_new
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
    `, [
      vendorId,
      booking.customer_name,
      booking.service_name,
      booking.service_type,
      booking.date_time,
      booking.booking_status,
      booking.payment_status,
      booking.contact_number,
      booking.address,
      booking.notes,
      booking.is_new
    ]);
  }
  
  console.log(`✓ Inserted ${bookings.length} bookings for vendor ${vendorId}`);
}

// Run the sample data insertion if this script is executed directly
if (require.main === module) {
  insertSampleData()
    .then(success => {
      if (success) {
        console.log('Sample data insertion completed.');
      } else {
        console.error('Sample data insertion process failed.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error during sample data insertion:', err);
      process.exit(1);
    })
    .finally(() => {
      // Close the pool to allow the script to exit
      pool.end();
    });
}

module.exports = { insertSampleData }; 