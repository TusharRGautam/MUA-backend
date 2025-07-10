# Quick Test Script for Solo Vendor Booking Algorithm

## 1. Create Test Data
node create_test_solo_vendors.js

## 2. Test the API Endpoints

### Test Matching API
curl -X POST http://localhost:3000/api/solo-vendor-booking/match \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["Haircut"],
    "services": [{"id": "1", "name": "Classic Cut", "category": "Haircut", "price": 500}]
  }'

### Test with Multiple Categories
curl -X POST http://localhost:3000/api/solo-vendor-booking/match \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["Bridal", "Makeup"],
    "services": [
      {"id": "1", "name": "Bridal Makeup", "category": "Bridal", "price": 3000},
      {"id": "2", "name": "Party Makeup", "category": "Makeup", "price": 1500}
    ]
  }'

### Test with Case Variations
curl -X POST http://localhost:3000/api/solo-vendor-booking/match \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["haircut", "FACIAL"],
    "services": [{"id": "1", "name": "Haircut Service", "category": "haircut", "price": 600}]
  }'

## Expected Outputs:
- Haircut: Should match Maya Solo Beauty, Raj Hair Specialist, Amit Grooming Studio
- Bridal+Makeup: Should match Priya Bridal Expert, Maya Solo Beauty  
- Case variations: Should handle case-insensitive matching

## Frontend Testing:
1. Start the backend server: npm start
2. Open the MUA-frontend app
3. Navigate to service-details page
4. Add services with categories
5. Click 'Book Now'
6. Check console logs for vendor matching results

