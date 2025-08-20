// Test script for approve-application edge function
const testEdgeFunction = async () => {
  try {
    console.log('🧪 Testing approve-application edge function...');
    
    // Test 1: Test mode
    const testResponse = await fetch('http://localhost:54321/functions/v1/approve-application', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        test_mode: true
      })
    });
    
    const testResult = await testResponse.json();
    console.log('✅ Test mode result:', testResult);
    
    if (testResponse.status !== 200) {
      console.error('❌ Test mode failed with status:', testResponse.status);
      return;
    }
    
    // Test 2: Try to fetch applications table
    console.log('🔍 Testing database connectivity...');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      'http://localhost:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
    
    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .limit(5);
    
    if (appsError) {
      console.error('❌ Error fetching applications:', appsError);
    } else {
      console.log('✅ Applications table accessible, found', apps.length, 'applications');
      if (apps.length > 0) {
        console.log('📝 Sample application:', apps[0]);
      }
    }
    
    // Test 3: Check if required tables exist
    const tables = ['users', 'levels', 'enrollments', 'programs'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.error(`❌ Table ${table} not accessible:`, error.message);
        } else {
          console.log(`✅ Table ${table} accessible`);
        }
      } catch (err) {
        console.error(`❌ Error checking table ${table}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testEdgeFunction();
