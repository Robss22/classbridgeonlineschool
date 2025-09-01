// Test Users Query Script
// Run this in the browser console to see what's happening with the users query

const testUsersQuery = async () => {
  console.log('🔍 Testing Users Query...');
  
  try {
    // Test 1: Check authentication
    console.log('\n1️⃣ Checking Authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth Error:', authError);
      return;
    }
    
    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    console.log('🆔 User ID:', user.id);
    
    // Test 2: Check user profile
    console.log('\n2️⃣ Checking User Profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile Error:', profileError);
      return;
    }
    
    console.log('✅ Profile found:', profile);
    console.log('👤 Role:', profile.role);
    
    // Test 3: Query all users (this is what the page does)
    console.log('\n3️⃣ Querying All Users...');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Users Query Error:', usersError);
      return;
    }
    
    console.log('✅ Users query successful');
    console.log('📊 Total users returned:', allUsers?.length || 0);
    
    // Test 4: Analyze the results
    console.log('\n4️⃣ Analyzing Results...');
    if (allUsers && allUsers.length > 0) {
      console.log('📋 All Users:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || user.email} (${user.role || 'NO ROLE'}) - ${user.status || 'NO STATUS'}`);
      });
      
      // Count by role
      const counts = {
        admin: allUsers.filter(u => u.role === 'admin').length,
        teacher: allUsers.filter(u => u.role === 'teacher').length,
        student: allUsers.filter(u => u.role === 'student').length,
        null: allUsers.filter(u => !u.role).length,
        other: allUsers.filter(u => u.role && !['admin', 'teacher', 'student'].includes(u.role)).length
      };
      
      console.log('\n📈 Role Distribution:');
      console.log(`- Admins: ${counts.admin}`);
      console.log(`- Teachers: ${counts.teacher}`);
      console.log(`- Students: ${counts.student}`);
      console.log(`- Null roles: ${counts.null}`);
      console.log(`- Other roles: ${counts.other}`);
      
    } else {
      console.log('❌ No users returned from query');
    }
    
    // Test 5: Test different query approaches
    console.log('\n5️⃣ Testing Different Query Approaches...');
    
    // Test with count
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Count query failed:', countError.message);
    } else {
      console.log('✅ Count query successful:', count, 'total users');
    }
    
    // Test role-specific queries
    const roles = ['admin', 'teacher', 'student'];
    for (const role of roles) {
      const { data: roleUsers, error: roleError } = await supabase
        .from('users')
        .select('*')
        .eq('role', role);
      
      if (roleError) {
        console.log(`❌ ${role} query failed:`, roleError.message);
      } else {
        console.log(`✅ ${role} query: ${roleUsers?.length || 0} users`);
      }
    }
    
    // Test 6: Check for RLS issues
    console.log('\n6️⃣ Checking for RLS Issues...');
    
    // Try to query without any filters
    const { data: rawUsers, error: rawError } = await supabase
      .from('users')
      .select('*');
    
    if (rawError) {
      console.log('❌ Raw query failed:', rawError.message);
      console.log('💡 This might indicate an RLS policy issue');
    } else {
      console.log('✅ Raw query successful:', rawUsers?.length || 0, 'users');
    }
    
    console.log('\n✅ Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testUsersQuery();

// Export for manual use
window.testUsersQuery = testUsersQuery;
