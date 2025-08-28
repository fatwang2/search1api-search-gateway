#!/usr/bin/env node

/**
 * Test script to verify pagination logic
 * Run this after starting the dev server with `npm run dev`
 */

const BASE_URL = 'http://localhost:8787';

async function testRequest(url, description) {
  console.log(`\n=== ${description} ===`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response keys: ${Object.keys(data).join(', ')}`);
    
    if (data.error) {
      console.log(`Error: ${data.error}`);
    } else if (data.results) {
      console.log(`Results count: ${data.results.length}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('Testing pagination logic...');
  console.log('Make sure the dev server is running with `npm run dev`');
  
  // Test 1: Request without pageno parameter
  await testRequest(
    `${BASE_URL}/search?q=javascript`,
    'Test 1: No pageno parameter (should auto-add pageno=1, then pageno=2 if empty)'
  );
  
  // Test 2: Request with specific pageno
  await testRequest(
    `${BASE_URL}/search?q=javascript&pageno=3`,
    'Test 2: With pageno=3 (should use user-provided pageno)'
  );
  
  // Test 3: Request that might return empty results
  await testRequest(
    `${BASE_URL}/search?q=abcdefghijklmnopqrstuvwxyz123456789nonexistent`,
    'Test 3: Query likely to return empty results (should trigger failover)'
  );
  
  console.log('\n=== Test Complete ===');
  console.log('Check the server logs to see:');
  console.log('1. "[DEBUG] [SearchRouter] Request function called with endpoint: ..., pageNo: ..."');
  console.log('2. "[DEBUG] [SearchRouter] Auto-adding pageno=X to request params" (for tests 1 & 3)');
  console.log('3. "[DEBUG] [SearchRouter] Using user-provided pageno=3" (for test 2)');
  console.log('4. "[INFO] [FailoverUtil] Attempting request to ... with pageno=..."');
  console.log('5. "[INFO] [FailoverUtil] Empty result from ... with pageno=..., trying next page" (if empty results)');
}

// Run the tests
runTests().catch(console.error);