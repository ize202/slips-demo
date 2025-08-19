const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPerformance() {
  console.log('Testing database performance...\n');
  
  // Test 1: Get suggested products (home screen)
  console.log('1. Testing get_suggested_products():');
  let start = Date.now();
  const result1 = await supabase.rpc('get_suggested_products');
  let elapsed = Date.now() - start;
  console.log(`   - Returned ${result1.data ? result1.data.length : 0} products in ${elapsed}ms`);
  if (result1.error) console.log('   - Error:', result1.error.message);
  
  // Test 2: Search for "protein"
  console.log('\n2. Testing search for "protein":');
  start = Date.now();
  const result2 = await supabase.rpc('search_supplements', { query: 'protein', limit_count: 20 });
  elapsed = Date.now() - start;
  console.log(`   - Returned ${result2.data ? result2.data.length : 0} products in ${elapsed}ms`);
  if (result2.error) console.log('   - Error:', result2.error.message);
  
  // Test 3: Search for brand "NOW"
  console.log('\n3. Testing search for brand "NOW":');
  start = Date.now();
  const result3 = await supabase.rpc('search_supplements', { query: 'NOW', limit_count: 20 });
  elapsed = Date.now() - start;
  console.log(`   - Returned ${result3.data ? result3.data.length : 0} products in ${elapsed}ms`);
  if (result3.error) console.log('   - Error:', result3.error.message);
  
  // Test 4: Search for "vitamin c"
  console.log('\n4. Testing search for "vitamin c":');
  start = Date.now();
  const result4 = await supabase.rpc('search_supplements', { query: 'vitamin c', limit_count: 20 });
  elapsed = Date.now() - start;
  console.log(`   - Returned ${result4.data ? result4.data.length : 0} products in ${elapsed}ms`);
  if (result4.error) console.log('   - Error:', result4.error.message);
  
  // Test 5: UPC scan
  console.log('\n5. Testing UPC scan "765704991183":');
  start = Date.now();
  const result5 = await supabase.rpc('search_supplements', { query: '765704991183', limit_count: 1 });
  elapsed = Date.now() - start;
  console.log(`   - Returned ${result5.data ? result5.data.length : 0} products in ${elapsed}ms`);
  if (result5.error) console.log('   - Error:', result5.error.message);
  
  console.log('\n✅ Performance test complete');
  
  // Show target performance
  console.log('\nTarget performance for mobile app:');
  console.log('  - Home screen load: <100ms');
  console.log('  - Search queries: <200ms');
  console.log('  - UPC scan: <50ms');
}

testPerformance().catch(console.error);