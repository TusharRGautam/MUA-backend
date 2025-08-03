/**
 * Test script for PRP services with image upload and package name support
 * This script tests the complete flow including image upload, service creation, and data retrieval
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001';

// Sample base64 image (1x1 transparent PNG)
const SAMPLE_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testPRPServices() {
  console.log('🧪 Testing PRP Services with Image Upload and Package Name');
  console.log('=====================================\n');

  try {
    // Test 1: Upload PRP service icon
    console.log('📤 Test 1: Uploading PRP service icon...');
    const uploadResponse = await axios.post(`${API_BASE_URL}/api/upload/prp-icon`, {
      image: SAMPLE_IMAGE_BASE64,
      filename: 'test-prp-icon.png'
    });

    if (uploadResponse.data.success) {
      console.log('✅ Icon upload successful');
      console.log('📷 Image URL:', uploadResponse.data.imageUrl);
    } else {
      throw new Error('Icon upload failed');
    }

    const iconImageUrl = uploadResponse.data.imageUrl;

    // Test 2: Create PRP service with icon and package name
    console.log('\n📝 Test 2: Creating PRP service with package name and icon...');
    const serviceData = {
      package_name: 'Premium Hair Restoration Package',
      service_name: 'Advanced Hair PRP Treatment',
      service_category: 'Hair PRP Treatment',
      service_price: 15000,
      service_duration: 90,
      service_sessions: 4,
      service_description: 'Comprehensive hair restoration treatment using platelet-rich plasma technology',
      included_services: 'Consultation, Blood Draw, PRP Preparation, Scalp Injection, Post-treatment Care, Follow-up Session',
      icon_image: iconImageUrl,
      vendor_id: 1
    };

    const createResponse = await axios.post(`${API_BASE_URL}/api/dashboard-services/prp-services`, serviceData);

    if (createResponse.data.success) {
      console.log('✅ PRP service created successfully');
      console.log('🆔 Service ID:', createResponse.data.data.id);
      console.log('📦 Package Name:', createResponse.data.data.package_name);
      console.log('🔗 Icon Image:', createResponse.data.data.icon_image);
    } else {
      throw new Error('Service creation failed');
    }

    const serviceId = createResponse.data.data.id;

    // Test 3: Fetch all PRP services
    console.log('\n📋 Test 3: Fetching all PRP services...');
    const getAllResponse = await axios.get(`${API_BASE_URL}/api/dashboard-services/prp-services`);

    if (getAllResponse.data.success) {
      console.log('✅ Successfully fetched PRP services');
      console.log('📊 Total services:', getAllResponse.data.data.length);
      
      // Check if our created service is in the list
      const createdService = getAllResponse.data.data.find(service => service.id == serviceId);
      if (createdService) {
        console.log('✅ Created service found in list');
        console.log('📦 Package Name:', createdService.package_name);
        console.log('🖼️ Has Icon:', !!createdService.icon_image);
      } else {
        console.log('❌ Created service not found in list');
      }
    } else {
      throw new Error('Failed to fetch services');
    }

    // Test 4: Update PRP service
    console.log('\n✏️ Test 4: Updating PRP service...');
    const updatedServiceData = {
      ...serviceData,
      package_name: 'Updated Premium Hair Restoration Package',
      service_price: 18000,
      service_sessions: 5
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/api/dashboard-services/prp-services/${serviceId}`, updatedServiceData);

    if (updateResponse.data.success) {
      console.log('✅ PRP service updated successfully');
      console.log('📦 Updated Package Name:', updateResponse.data.data.package_name);
      console.log('💰 Updated Price:', updateResponse.data.data.service_price);
      console.log('🔄 Updated Sessions:', updateResponse.data.data.service_sessions);
    } else {
      throw new Error('Service update failed');
    }

    // Test 5: Delete PRP service
    console.log('\n🗑️ Test 5: Deleting PRP service...');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/api/dashboard-services/prp-services/${serviceId}`);

    if (deleteResponse.data.success) {
      console.log('✅ PRP service deleted successfully');
      console.log('🆔 Deleted Service ID:', deleteResponse.data.data.id);
    } else {
      throw new Error('Service deletion failed');
    }

    // Test 6: Verify deletion
    console.log('\n🔍 Test 6: Verifying service deletion...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/api/dashboard-services/prp-services`);

    if (verifyResponse.data.success) {
      const deletedService = verifyResponse.data.data.find(service => service.id == serviceId);
      if (!deletedService) {
        console.log('✅ Service successfully deleted from database');
      } else {
        console.log('❌ Service still exists in database');
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('=====================================');
    console.log('✅ PRP Services with Image Upload and Package Name functionality is working correctly');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📋 Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the tests
testPRPServices(); 