const express = require('express');

// Copy the validation function from vendorRoutes.js
const validateAndNormalizeImageUrl = (imageUrl, fieldName = 'image') => {
  // Allow empty/null values
  if (!imageUrl || imageUrl.trim() === '') {
    return { 
      isValid: true, 
      normalizedUrl: '' 
    };
  }

  // Reject base64 data URLs
  if (imageUrl.startsWith('data:image/') || imageUrl.includes('base64')) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: `${fieldName} cannot be base64 data. Please upload image to Google Drive and provide the link.`
    };
  }

  // Reject extremely long URLs (likely base64 or corrupted data)
  if (imageUrl.length > 500) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: `${fieldName} URL is too long (${imageUrl.length} characters). Maximum allowed is 500 characters.`
    };
  }

  // Check if it's a Google Drive link
  if (imageUrl.includes('drive.google.com')) {
    // Extract file ID and normalize to direct download format
    const patterns = [
      /\/uc\?id=([a-zA-Z0-9_-]+)/,  // https://drive.google.com/uc?id=FILE_ID
      /\/file\/d\/([a-zA-Z0-9_-]+)/, // https://drive.google.com/file/d/FILE_ID/view
      /id=([a-zA-Z0-9_-]+)/          // Any link with id= parameter
    ];

    for (const pattern of patterns) {
      const match = imageUrl.match(pattern);
      if (match && match[1]) {
        // Normalize to direct download format for better compatibility
        const normalizedUrl = `https://drive.usercontent.google.com/download?id=${match[1]}`;
        return {
          isValid: true,
          normalizedUrl: normalizedUrl
        };
      }
    }

    // If it contains drive.google.com but we couldn't extract file ID
    return {
      isValid: false,
      normalizedUrl: '',
      error: `${fieldName} appears to be a Google Drive link but file ID could not be extracted. Please use a valid Google Drive sharing link.`
    };
  }

  // Check if it's a local storage link
  if (imageUrl.includes('/static/uploads/')) {
    // Ensure it's an absolute URL
    if (imageUrl.startsWith('http')) {
      return { isValid: true, normalizedUrl: imageUrl };
    } else {
      return { isValid: true, normalizedUrl: `http://localhost:3000${imageUrl}` };
    }
  }

  // Check if it's a placeholder URL
  if (imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder.com')) {
    return { isValid: true, normalizedUrl: imageUrl };
  }

  // For any other URL format, validate it's a proper URL
  try {
    new URL(imageUrl);
    return { isValid: true, normalizedUrl: imageUrl };
  } catch (error) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: `${fieldName} must be a valid URL. Supported formats: Google Drive links, local storage links, or standard URLs.`
    };
  }
};

// Test cases
console.log('='.repeat(80));
console.log('TESTING IMAGE URL VALIDATION');
console.log('='.repeat(80));

const testCases = [
  {
    name: 'Valid Google Drive Link (file/d format)',
    url: 'https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing'
  },
  {
    name: 'Valid Google Drive Link (uc?id format)',
    url: 'https://drive.google.com/uc?id=1ABC123xyz'
  },
  {
    name: 'Base64 Data URL (SHOULD BE REJECTED)',
    url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  },
  {
    name: 'Very Long URL (SHOULD BE REJECTED)',
    url: 'https://example.com/' + 'a'.repeat(500)
  },
  {
    name: 'Valid Placeholder URL',
    url: 'https://via.placeholder.com/150/cccccc/ffffff?text=No+Image'
  },
  {
    name: 'Valid Local Storage URL',
    url: '/static/uploads/services/image.jpg'
  },
  {
    name: 'Empty URL (SHOULD BE ALLOWED)',
    url: ''
  },
  {
    name: 'Invalid Google Drive Link (SHOULD BE REJECTED)',
    url: 'https://drive.google.com/invalid-format'
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log(`Input URL: ${testCase.url.length > 100 ? testCase.url.substring(0, 100) + '...' : testCase.url}`);
  
  const result = validateAndNormalizeImageUrl(testCase.url, 'test_image');
  
  console.log(`Valid: ${result.isValid}`);
  if (result.isValid) {
    console.log(`Normalized URL: ${result.normalizedUrl.length > 100 ? result.normalizedUrl.substring(0, 100) + '...' : result.normalizedUrl}`);
  } else {
    console.log(`Error: ${result.error}`);
  }
  console.log('-'.repeat(40));
});

console.log('\n' + '='.repeat(80));
console.log('VALIDATION TEST COMPLETE');
console.log('='.repeat(80)); 