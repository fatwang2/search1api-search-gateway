#!/usr/bin/env node

/**
 * Test script to verify limit-based aggregation functionality
 * Run this after starting the dev server with `npm run dev`
 */

const BASE_URL = 'http://localhost:8787';

async function testRequest(url, description, expectedResultCount) {
  console.log(`\n=== ${description} ===`);
  console.log(`URL: ${url}`);
  console.log(`Expected results: ${expectedResultCount || 'variable'}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    const endTime = Date.now();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response time: ${endTime - startTime}ms`);
    
    if (data.error) {
      console.log(`❌ Error: ${data.error}`);
      return;
    }
    
    const actualCount = data.results?.length || 0;
    const aggregationInfo = data._aggregation;
    
    console.log(`✅ Results received: ${actualCount}`);
    
    if (aggregationInfo) {
      console.log(`📊 Aggregation info:`);
      console.log(`   - Requested: ${aggregationInfo.requested}`);
      console.log(`   - Returned: ${aggregationInfo.returned}`);
      console.log(`   - Pages fetched: ${aggregationInfo.pages_fetched}`);
    }
    
    if (expectedResultCount && actualCount !== expectedResultCount) {
      if (actualCount < expectedResultCount) {
        console.log(`ℹ️  Got ${actualCount} results (less than requested ${expectedResultCount}), likely due to limited available results`);
      } else {
        console.log(`⚠️  Got ${actualCount} results (more than expected ${expectedResultCount})`);
      }
    }
    
    // Show first few result titles for verification
    if (data.results && data.results.length > 0) {
      console.log(`📝 Sample results:`);
      data.results.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title || result.url || 'No title'}`);
      });
      if (data.results.length > 3) {
        console.log(`   ... and ${data.results.length - 3} more`);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('Testing limit-based aggregation functionality...');
  console.log('Make sure the dev server is running with `npm run dev`');
  console.log('📋 Note: Expected result counts may vary based on actual search API results');
  
  // Test 1: Small limit (should not trigger aggregation if first page has enough)
  await testRequest(
    `${BASE_URL}/search?q=javascript&categories=general&format=json&limit=5`,
    'Test 1: Small limit (5) - should get exactly 5 results',
    5
  );
  
  // Test 2: Medium limit (may trigger aggregation)
  await testRequest(
    `${BASE_URL}/search?q=javascript&categories=general&format=json&limit=15`,
    'Test 2: Medium limit (15) - may need 2 pages',
    15
  );
  
  // Test 3: Large limit (definitely needs aggregation)
  await testRequest(
    `${BASE_URL}/search?q=javascript&categories=general&format=json&limit=35`,
    'Test 3: Large limit (35) - should need 4+ pages',
    35
  );
  
  // Test 4: Very large limit (should hit max pages limit)
  await testRequest(
    `${BASE_URL}/search?q=javascript&categories=general&format=json&limit=100`,
    'Test 4: Very large limit (100) - should hit 5-page limit'
  );
  
  // Test 5: Query that may have limited results
  await testRequest(
    `${BASE_URL}/search?q=veryspecificanduncommonquery123456&categories=general&format=json&limit=20`,
    'Test 5: Limited results query - should stop early'
  );
  
  // Test 6: Backward compatibility - with pageno (should use original logic)
  await testRequest(
    `${BASE_URL}/search?q=javascript&categories=general&format=json&pageno=2&limit=15`,
    'Test 6: Backward compatibility - pageno provided (should ignore limit and use single-page)'
  );
  
  // Test 7: No limit parameter (should use default)
  await testRequest(
    `${BASE_URL}/search?q=javascript&categories=general&format=json`,
    'Test 7: No limit parameter - should use default (10)'
  );
  
  console.log('\n=== Test Summary ===');
  console.log('✅ All tests completed');
  console.log('📊 Check server logs to see:');
  console.log('   - "[INFO] [SearchRouter] Using aggregation mode with limit=X"');
  console.log('   - "[INFO] [Aggregator] Starting search aggregation with limit=X"');
  console.log('   - "[INFO] [Aggregator] Page X: got Y results, total so far: Z"');
  console.log('   - "[INFO] [Aggregator] Aggregation completed"');
  console.log('   - Cache hit/miss information');
  console.log('\n💡 Tips for testing:');
  console.log('   - Run the same test twice to see caching in action');
  console.log('   - Try different query terms to test various result volumes');
  console.log('   - Monitor response times for performance analysis');
}

// Run the tests
runTests().catch(console.error);