// Test script to check form submission
// Run this in browser console to test the database connection

async function testFormSubmission() {
  const testData = {
    subject_id: 'test-subject-id',
    program_id: 'test-program-id', 
    level_id: 'test-level-id',
    is_compulsory: false,
    term: 'Annual',
    year: '2025/2026',
    paper_id: null
  };
  
  console.log('Testing with data:', testData);
  
  try {
    // Test the insert
    const { data, error } = await supabase
      .from('subject_offerings')
      .insert([testData])
      .select('id')
      .single();
      
    if (error) {
      console.error('Insert error:', error);
      return false;
    }
    
    console.log('Insert successful:', data);
    
    // Test the delete
    const { error: deleteError } = await supabase
      .from('subject_offerings')
      .delete()
      .eq('id', data.id);
      
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return false;
    }
    
    console.log('Delete successful');
    return true;
    
  } catch (err) {
    console.error('Test failed:', err);
    return false;
  }
}

// Run the test
testFormSubmission().then(success => {
  console.log('Test result:', success ? 'PASSED' : 'FAILED');
});
