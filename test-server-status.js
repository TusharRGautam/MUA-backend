const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/ping',
  method: 'GET'
};

console.log('Testing server connection to http://localhost:3001/api/ping');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('No more data in response.');
    testDashboardServices();
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.log('Server may not be running on port 3001.');
  process.exit(1);
});

req.end();

function testDashboardServices() {
  const endpoints = [
    '/api/dashboard-services/salon-services',
    '/api/dashboard-services/prp-services',
    '/api/dashboard-services/diagnostics-services'
  ];
  
  console.log('\nTesting dashboard service endpoints:');
  
  endpoints.forEach(endpoint => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'GET'
    };
    
    console.log(`Testing endpoint: ${endpoint}`);
    
    const req = http.request(options, (res) => {
      console.log(`STATUS for ${endpoint}: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (data.length > 100) {
          console.log(`BODY for ${endpoint}: ${data.substring(0, 100)}... (truncated)`);
        } else {
          console.log(`BODY for ${endpoint}: ${data}`);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`Problem with request to ${endpoint}: ${e.message}`);
    });
    
    req.end();
  });
}