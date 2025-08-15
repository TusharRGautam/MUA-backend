/**
 * Performance Testing Script for MUA Backend Optimizations
 * 
 * This script tests the implemented optimizations including:
 * - Database query performance with new indexes
 * - API response times with caching
 * - Error handling efficiency
 * - Memory usage patterns
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const { query } = require('../db');

class PerformanceTester {
  constructor(apiBaseUrl = 'http://localhost:3000/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.results = {
      databaseTests: [],
      apiTests: [],
      cacheTests: [],
      errorHandlingTests: [],
      summary: {}
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Performance Testing Suite...\n');
    
    try {
      await this.testDatabasePerformance();
      await this.testApiPerformance();
      await this.testCacheEfficiency();
      await this.testErrorHandling();
      
      this.generateReport();
      console.log('\n✅ Performance testing completed successfully!');
    } catch (error) {
      console.error('❌ Performance testing failed:', error);
    }
  }

  async testDatabasePerformance() {
    console.log('📊 Testing Database Performance...');
    
    const dbTests = [
      {
        name: 'Booking Query with Indexes',
        query: `
          SELECT * FROM booking_all_details_of_user_to_vendor 
          WHERE user_id = 1 AND booking_status = 'pending'
          ORDER BY created_at DESC LIMIT 10
        `,
        params: []
      },
      {
        name: 'Vendor Search with Full-text Index',
        query: `
          SELECT sr_no, person_name, business_name, ratings_average
          FROM registration_and_other_details
          WHERE verification_status = 'verified'
            AND to_tsvector('english', 
                COALESCE(person_name, '') || ' ' || 
                COALESCE(business_name, '') || ' ' || 
                COALESCE(business_description, '')
              ) @@ plainto_tsquery('english', 'makeup artist')
          LIMIT 20
        `,
        params: []
      },
      {
        name: 'Service Category Filter',
        query: `
          SELECT id, service_name, category, price, duration
          FROM our_services_section 
          WHERE category = 'makeup' 
            AND toggle_gender_services = 'female'
            AND business_type = 'single'
          ORDER BY price ASC
          LIMIT 15
        `,
        params: []
      },
      {
        name: 'Popular Vendors Weighted Query',
        query: `
          SELECT 
            r.sr_no as id,
            r.person_name,
            r.business_name,
            COALESCE(r.ratings_average, 0) as rating,
            COUNT(DISTINCT b.id) as booking_count,
            COUNT(DISTINCT s.id) as services_count
          FROM registration_and_other_details r
          LEFT JOIN booking_all_details_of_user_to_vendor b ON r.sr_no = b.vendor_id 
            AND b.created_at >= NOW() - INTERVAL '30 days'
            AND b.booking_status = 'completed'
          LEFT JOIN our_services_section s ON r.sr_no = s.vendor_id
          WHERE r.verification_status = 'verified'
          GROUP BY r.sr_no, r.person_name, r.business_name, r.ratings_average
          ORDER BY 
            (COALESCE(r.ratings_average, 0) * 0.4) + 
            (COUNT(DISTINCT b.id) * 0.4) + 
            (COUNT(DISTINCT s.id) * 0.2) DESC
          LIMIT 12
        `,
        params: []
      }
    ];

    for (const test of dbTests) {
      const startTime = performance.now();
      
      try {
        const result = await query(test.query, test.params);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        this.results.databaseTests.push({
          name: test.name,
          executionTime: Math.round(executionTime * 100) / 100,
          rowCount: result.rows.length,
          status: 'success'
        });
        
        console.log(`  ✅ ${test.name}: ${Math.round(executionTime)}ms (${result.rows.length} rows)`);
      } catch (error) {
        this.results.databaseTests.push({
          name: test.name,
          executionTime: -1,
          error: error.message,
          status: 'failed'
        });
        
        console.log(`  ❌ ${test.name}: Failed - ${error.message}`);
      }
    }
  }

  async testApiPerformance() {
    console.log('\n🌐 Testing API Performance...');
    
    const apiTests = [
      {
        name: 'Get Popular Vendors (with cache)',
        endpoint: '/vendors-optimized/popular?limit=12',
        method: 'GET'
      },
      {
        name: 'Get Vendor Details (with cache)',
        endpoint: '/vendors-optimized/1/complete',
        method: 'GET'
      },
      {
        name: 'Search Vendors (with cache)',
        endpoint: '/vendors-optimized/search?q=makeup&type=full',
        method: 'GET'
      },
      {
        name: 'Get User Bookings (paginated)',
        endpoint: '/bookings-optimized?page=1&limit=10',
        method: 'GET',
        requiresAuth: true
      },
      {
        name: 'Get Component Data (cached)',
        endpoint: '/component-data/artist/1',
        method: 'GET'
      }
    ];

    for (const test of apiTests) {
      await this.performApiTest(test);
    }
  }

  async performApiTest(test) {
    const url = `${this.apiBaseUrl}${test.endpoint}`;
    const startTime = performance.now();
    
    try {
      const config = {
        method: test.method,
        url,
        timeout: 10000
      };

      if (test.requiresAuth) {
        // For testing purposes, skip auth-required endpoints or add test token
        console.log(`  ⏭️  Skipping ${test.name} (requires auth)`);
        return;
      }

      const response = await axios(config);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.results.apiTests.push({
        name: test.name,
        endpoint: test.endpoint,
        executionTime: Math.round(executionTime * 100) / 100,
        statusCode: response.status,
        dataSize: JSON.stringify(response.data).length,
        cached: response.headers['x-cache'] === 'HIT',
        status: 'success'
      });
      
      const cacheStatus = response.headers['x-cache'] === 'HIT' ? '(CACHED)' : '(FRESH)';
      console.log(`  ✅ ${test.name}: ${Math.round(executionTime)}ms ${cacheStatus}`);
      
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.results.apiTests.push({
        name: test.name,
        endpoint: test.endpoint,
        executionTime: Math.round(executionTime * 100) / 100,
        error: error.message,
        statusCode: error.response?.status || 0,
        status: 'failed'
      });
      
      console.log(`  ❌ ${test.name}: ${Math.round(executionTime)}ms - ${error.message}`);
    }
  }

  async testCacheEfficiency() {
    console.log('\n💾 Testing Cache Efficiency...');
    
    // Test the same endpoint multiple times to test cache hit rate
    const testEndpoint = '/vendors-optimized/popular?limit=12';
    const iterations = 5;
    const results = [];
    
    console.log(`  Testing ${testEndpoint} ${iterations} times...`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const response = await axios.get(`${this.apiBaseUrl}${testEndpoint}`);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        results.push({
          iteration: i + 1,
          executionTime: Math.round(executionTime * 100) / 100,
          cached: response.headers['x-cache'] === 'HIT',
          status: 'success'
        });
        
        const cacheStatus = response.headers['x-cache'] === 'HIT' ? 'CACHED' : 'FRESH';
        console.log(`    ${i + 1}. ${Math.round(executionTime)}ms (${cacheStatus})`);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({
          iteration: i + 1,
          executionTime: -1,
          cached: false,
          error: error.message,
          status: 'failed'
        });
        
        console.log(`    ${i + 1}. Failed - ${error.message}`);
      }
    }
    
    const cacheHits = results.filter(r => r.cached).length;
    const averageTime = results
      .filter(r => r.executionTime > 0)
      .reduce((sum, r) => sum + r.executionTime, 0) / results.length;
    
    this.results.cacheTests.push({
      endpoint: testEndpoint,
      totalRequests: iterations,
      cacheHits,
      hitRate: `${((cacheHits / iterations) * 100).toFixed(1)}%`,
      averageResponseTime: Math.round(averageTime * 100) / 100,
      results
    });
    
    console.log(`  📊 Cache hit rate: ${cacheHits}/${iterations} (${((cacheHits / iterations) * 100).toFixed(1)}%)`);
    console.log(`  📊 Average response time: ${Math.round(averageTime)}ms`);
  }

  async testErrorHandling() {
    console.log('\n⚠️  Testing Error Handling...');
    
    const errorTests = [
      {
        name: 'Not Found Error',
        endpoint: '/vendors-optimized/99999',
        expectedStatus: 404
      },
      {
        name: 'Invalid Search Query',
        endpoint: '/vendors-optimized/search?q=',
        expectedStatus: 400
      },
      {
        name: 'Invalid Pagination',
        endpoint: '/vendors-optimized?page=-1&limit=1000',
        expectedStatus: 200 // Should handle gracefully with defaults
      }
    ];

    for (const test of errorTests) {
      const startTime = performance.now();
      
      try {
        const response = await axios.get(`${this.apiBaseUrl}${test.endpoint}`);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        const isExpectedStatus = response.status === test.expectedStatus;
        
        this.results.errorHandlingTests.push({
          name: test.name,
          endpoint: test.endpoint,
          expectedStatus: test.expectedStatus,
          actualStatus: response.status,
          executionTime: Math.round(executionTime * 100) / 100,
          handled: isExpectedStatus,
          status: 'success'
        });
        
        const statusIcon = isExpectedStatus ? '✅' : '⚠️';
        console.log(`  ${statusIcon} ${test.name}: ${response.status} (${Math.round(executionTime)}ms)`);
        
      } catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        const actualStatus = error.response?.status || 0;
        const isExpectedStatus = actualStatus === test.expectedStatus;
        
        this.results.errorHandlingTests.push({
          name: test.name,
          endpoint: test.endpoint,
          expectedStatus: test.expectedStatus,
          actualStatus,
          executionTime: Math.round(executionTime * 100) / 100,
          handled: isExpectedStatus,
          error: error.message,
          status: isExpectedStatus ? 'success' : 'failed'
        });
        
        const statusIcon = isExpectedStatus ? '✅' : '❌';
        console.log(`  ${statusIcon} ${test.name}: ${actualStatus} (${Math.round(executionTime)}ms)`);
      }
    }
  }

  generateReport() {
    console.log('\n📊 PERFORMANCE TESTING REPORT');
    console.log('='.repeat(50));
    
    // Database Performance Summary
    console.log('\n📊 Database Performance:');
    const dbSuccessful = this.results.databaseTests.filter(t => t.status === 'success');
    const avgDbTime = dbSuccessful.reduce((sum, t) => sum + t.executionTime, 0) / dbSuccessful.length;
    console.log(`  Average Query Time: ${Math.round(avgDbTime)}ms`);
    console.log(`  Successful Queries: ${dbSuccessful.length}/${this.results.databaseTests.length}`);
    
    // API Performance Summary
    console.log('\n🌐 API Performance:');
    const apiSuccessful = this.results.apiTests.filter(t => t.status === 'success');
    const avgApiTime = apiSuccessful.reduce((sum, t) => sum + t.executionTime, 0) / apiSuccessful.length;
    const cachedRequests = apiSuccessful.filter(t => t.cached).length;
    console.log(`  Average API Response Time: ${Math.round(avgApiTime)}ms`);
    console.log(`  Successful Requests: ${apiSuccessful.length}/${this.results.apiTests.length}`);
    console.log(`  Cache Hits: ${cachedRequests}/${apiSuccessful.length}`);
    
    // Cache Efficiency Summary
    console.log('\n💾 Cache Performance:');
    if (this.results.cacheTests.length > 0) {
      const cacheTest = this.results.cacheTests[0];
      console.log(`  Cache Hit Rate: ${cacheTest.hitRate}`);
      console.log(`  Average Response Time: ${cacheTest.averageResponseTime}ms`);
    }
    
    // Error Handling Summary
    console.log('\n⚠️  Error Handling:');
    const errorTestsHandled = this.results.errorHandlingTests.filter(t => t.handled);
    console.log(`  Properly Handled: ${errorTestsHandled.length}/${this.results.errorHandlingTests.length}`);
    
    // Overall Summary
    const totalTests = this.results.databaseTests.length + 
                      this.results.apiTests.length + 
                      this.results.errorHandlingTests.length;
    const totalSuccessful = dbSuccessful.length + 
                           apiSuccessful.length + 
                           errorTestsHandled.length;
    
    console.log('\n🎯 Overall Results:');
    console.log(`  Success Rate: ${totalSuccessful}/${totalTests} (${((totalSuccessful/totalTests)*100).toFixed(1)}%)`);
    console.log(`  Average Performance: ${Math.round((avgDbTime + avgApiTime) / 2)}ms`);
    
    // Performance Recommendations
    console.log('\n💡 Recommendations:');
    if (avgDbTime > 100) {
      console.log('  ⚠️  Database queries are slow. Consider adding more indexes.');
    } else {
      console.log('  ✅ Database performance is good.');
    }
    
    if (avgApiTime > 500) {
      console.log('  ⚠️  API responses are slow. Consider optimizing queries and caching.');
    } else {
      console.log('  ✅ API performance is good.');
    }
    
    if (cachedRequests < apiSuccessful.length * 0.3) {
      console.log('  ⚠️  Low cache hit rate. Review caching strategy.');
    } else {
      console.log('  ✅ Cache performance is good.');
    }

    // Save results to file
    this.saveResults();
  }

  async saveResults() {
    const fs = require('fs').promises;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-test-results-${timestamp}.json`;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.databaseTests.length + this.results.apiTests.length + this.results.errorHandlingTests.length,
        databaseTests: this.results.databaseTests.length,
        apiTests: this.results.apiTests.length,
        cacheTests: this.results.cacheTests.length,
        errorHandlingTests: this.results.errorHandlingTests.length
      },
      results: this.results
    };
    
    try {
      await fs.writeFile(filename, JSON.stringify(reportData, null, 2));
      console.log(`\n📄 Results saved to: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests().catch(console.error);
}

module.exports = PerformanceTester;