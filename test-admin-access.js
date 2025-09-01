// Test script to verify admin access and RLS policies
const testAdminAccess = async () => {
  try {
    console.log('🔍 Testing admin access and RLS policies...');
    
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      'https://qznfggcxumubmjfmudat.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bmZnZ2N4dW11Ym1qZm11ZGF0Iiwicm9sZSI6ImFub24iLCJleHAiOjIwNjYxNTk3MDJ9.ff'
    );
    
    // Test 1: Check current user authentication
    console.log('📊 Checking current user authentication...');
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    if (!currentUser) {
      console.log('⚠️ No authenticated user found');
      return;
    }
    
    console.log('✅ Authenticated user:', currentUser.id);
    
    // Test 2: Check user profile and role
    console.log('📊 Checking user profile and role...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', currentUser.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }
    
    console.log('✅ User profile:', userProfile);
    
    // Test 3: Check if user can view all users (admin test)
    console.log('📊 Testing admin access to all users...');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Users access error:', usersError);
      console.log('🔍 This suggests RLS policies are blocking access');
    } else {
      console.log('✅ Successfully retrieved users:', allUsers.length);
      console.log('📝 Users by role:', {
        admins: allUsers.filter(u => u.role === 'admin').length,
        teachers: allUsers.filter(u => u.role === 'teacher').length,
        students: allUsers.filter(u => u.role === 'student').length
      });
      console.log('📋 All users:', allUsers);
    }
    
    // Test 4: Check RLS policy status
    console.log('📊 Checking RLS policy status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_rls_status', { table_name: 'users' });
    
    if (rlsError) {
      console.log('ℹ️ Could not check RLS status (function may not exist)');
    } else {
      console.log('✅ RLS status:', rlsStatus);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testAdminAccess();
