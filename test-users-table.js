// Test script to check users table structure and data
const testUsersTable = async () => {
  try {
    console.log('🔍 Testing users table structure and data...');
    
    const { createClient } = require('@supabase/supabase/supabase-js');
    
    const supabase = createClient(
      'https://qznfggcxumubmjfmudat.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bmZnZ2N4dW11Ym1qZm11ZGF0Iiwicm9sZSI6ImFub24iLCJleHAiOjIwNjYxNTk3MDJ9.ff'
    );
    
    // Test 1: Check users table structure
    console.log('📊 Checking users table structure...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, first_name, last_name')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log('✅ Users table accessible, found', users.length, 'users');
      console.log('📝 Sample users:', users);
    }
    
    // Test 2: Check resources table with users join
    console.log('📊 Checking resources table with users join...');
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select(`
        resource_id, title, uploaded_by,
        users!uploaded_by(id, full_name, email, first_name, last_name)
      `)
      .limit(5);
    
    if (resourcesError) {
      console.error('❌ Error fetching resources:', resourcesError);
    } else {
      console.log('✅ Resources table accessible, found', resources.length, 'resources');
      console.log('📝 Sample resources with users:', resources);
      
      // Check each resource
      resources.forEach((resource, index) => {
        console.log(`📋 Resource ${index + 1}:`, {
          title: resource.title,
          uploaded_by_id: resource.uploaded_by,
          user_data: resource.users,
          display_name: resource.users?.full_name || resource.users?.email || `ID: ${resource.uploaded_by}` || 'Unknown'
        });
      });
    }
    
    // Test 3: Check if there are users without full_name
    console.log('📊 Checking users without full_name...');
    const { data: usersWithoutName, error: nameError } = await supabase
      .from('users')
      .select('id, full_name, email, first_name, last_name')
      .or('full_name.is.null,full_name.eq.')
      .limit(10);
    
    if (nameError) {
      console.error('❌ Error checking users without name:', nameError);
    } else {
      console.log('⚠️ Users without full_name:', usersWithoutName.length);
      if (usersWithoutName.length > 0) {
        console.log('📝 Users without full_name:', usersWithoutName);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testUsersTable();
