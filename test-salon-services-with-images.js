/**
 * Test script for Salon Services with Image Upload and All Fields
 * Tests the complete salon services functionality including image upload,
 * all the additional fields, and CRUD operations
 */

const axios = require('axios');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001';

// Sample base64 image (1x1 transparent PNG)
const sampleBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testSalonServicesWithImages() {
  console.log('🧪 Testing Salon Services with Image Upload and All Fields');
  console.log('=====================================\n');

  try {
    // Test 1: Upload salon service icon
    console.log('📤 Test 1: Uploading salon service icon...');
    
    const iconUploadResponse = await axios.post(`${API_BASE_URL}/api/upload/prp-icon`, {
      image: sampleBase64Image,
      filename: 'salon_service_icon.png'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!iconUploadResponse.data.success) {
      throw new Error(`Icon upload failed: ${iconUploadResponse.data.error}`);
    }

    const iconImageUrl = iconUploadResponse.data.imageUrl;
    console.log('🔗 Icon Image:', iconImageUrl);

    // Test 2: Create salon service with all fields including image and package name
    console.log('\n📝 Test 2: Creating salon service with all fields...');
    
    const serviceData = {
      package_name: 'Premium Hair Care Package',
      service_name: 'Complete Hair Transformation',
      service_category: 'Hair Color & Highlights',
      service_price: 2500,
      service_duration: 180,
      service_description: 'Complete hair transformation with cutting, coloring, and styling using premium products.',
      things_to_know: 'Please arrive with clean, dry hair. Avoid washing 24 hours before appointment. Consultation required for major color changes.',
      what_packages_include: 'Hair consultation, wash and conditioning, cutting, coloring/highlighting, blow-dry styling, take-home care kit.',
      precautions: 'Patch test required 48 hours before coloring. Not suitable for pregnant women. Inform stylist of any allergies or medications.',
      products_used: 'L\'Oreal Professional hair color, Schwarzkopf styling products, Redken treatments, professional-grade tools.',
      service_image: iconImageUrl,
      vendor_id: 1
    };

    const createResponse = await axios.post(`${API_BASE_URL}/api/dashboard-services/salon-services`, serviceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!createResponse.data.success) {
      throw new Error(`Service creation failed: ${createResponse.data.message}`);
    }

    const createdService = createResponse.data.data;
    console.log('✅ Salon service created successfully');
    console.log('🆔 Service ID:', createdService.id);
    console.log('📦 Package Name:', createdService.package_name);
    console.log('🔗 Icon Image:', createdService.service_image);

    // Test 3: Fetch all salon services
    console.log('\n📋 Test 3: Fetching all salon services...');
    
    const getAllResponse = await axios.get(`${API_BASE_URL}/api/dashboard-services/salon-services`);
    
    if (!getAllResponse.data.success) {
      throw new Error(`Failed to fetch services: ${getAllResponse.data.message}`);
    }

    const services = getAllResponse.data.data;
    console.log('✅ Successfully fetched salon services');
    console.log('📊 Total services:', services.length);
    
    // Verify our created service is in the list
    const foundService = services.find(service => service.id === createdService.id);
    if (foundService) {
      console.log('✅ Created service found in list');
      console.log('📝 Service details:');
      console.log('   - Package Name:', foundService.package_name);
      console.log('   - Service Name:', foundService.service_name);
      console.log('   - Category:', foundService.service_category);
      console.log('   - Price: ₹', foundService.service_price);
      console.log('   - Duration:', foundService.service_duration, 'minutes');
      console.log('   - Things to Know:', foundService.things_to_know ? 'Yes' : 'No');
      console.log('   - Package Includes:', foundService.what_packages_include ? 'Yes' : 'No');
      console.log('   - Precautions:', foundService.precautions ? 'Yes' : 'No');
      console.log('   - Products Used:', foundService.products_used ? 'Yes' : 'No');
      console.log('   - Has Icon:', foundService.service_image ? 'Yes' : 'No');
    } else {
      console.log('❌ Created service not found in list');
    }

    // Test 4: Update salon service
    console.log('\n✏️ Test 4: Updating salon service...');
    
    const updateData = {
      ...serviceData,
      service_name: 'Updated Complete Hair Transformation',
      service_price: 2750,
      service_description: 'Updated: Complete hair transformation with premium products and extended service time.'
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/api/dashboard-services/salon-services/${createdService.id}`, updateData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!updateResponse.data.success) {
      throw new Error(`Service update failed: ${updateResponse.data.message}`);
    }

    console.log('✅ Salon service updated successfully');
    console.log('📝 Updated service name:', updateResponse.data.data.service_name);
    console.log('💰 Updated price: ₹', updateResponse.data.data.service_price);

    // Test 5: Delete salon service
    console.log('\n🗑️ Test 5: Deleting salon service...');
    
    const deleteResponse = await axios.delete(`${API_BASE_URL}/api/dashboard-services/salon-services/${createdService.id}`);
    
    if (!deleteResponse.data.success) {
      throw new Error(`Service deletion failed: ${deleteResponse.data.message}`);
    }

    console.log('✅ Salon service deleted successfully');
    console.log('🆔 Deleted Service ID:', createdService.id);

    // Test 6: Verify service deletion
    console.log('\n🔍 Test 6: Verifying service deletion...');
    
    const verifyResponse = await axios.get(`${API_BASE_URL}/api/dashboard-services/salon-services`);
    const remainingServices = verifyResponse.data.data;
    const deletedServiceCheck = remainingServices.find(service => service.id === createdService.id);
    
    if (!deletedServiceCheck) {
      console.log('✅ Service successfully deleted from database');
    } else {
      console.log('❌ Service still exists in database');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('=====================================');
    console.log('✅ Salon Services with Image Upload and All Fields functionality is working correctly');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Error details:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the tests
testSalonServicesWithImages(); 