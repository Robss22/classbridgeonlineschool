// Debug script to test the approve-application edge function
const testEdgeFunction = async () => {
  try {
    console.log('🧪 Testing approve-application edge function directly...');
    
    // Test the edge function with test mode
    const response = await fetch('https://qznfggcxumubmjfmudat.supabase.co/functions/v1/approve-application', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bmZnZ2N4dW11Ym1qZm11ZGF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU4MzcwMiwiZXhwIjoyMDY2MTU5NzAyfQ.ff'
      },
      body: JSON.stringify({
        test_mode: true
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📊 Response body:', result);
    
    if (response.ok) {
      console.log('✅ Edge function test successful!');
    } else {
      console.error('❌ Edge function test failed with status:', response.status);
      console.error('❌ Error details:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testEdgeFunction();
