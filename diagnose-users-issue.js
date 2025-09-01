// Diagnostic Script for Users Display Issue
// Run this in the browser console to debug the problem

const diagnoseUsersIssue = async () => {
  console.log('🔍 Starting Users Display Diagnosis...');
  
  try {
    // Step 1: Check authentication
    console.log('\n1️⃣ Checking Authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication Error:', authError);
      return;
    }
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    console.log('📧 User email:', user.email);
    
    // Step 2: Check user profile and role
    console.log('\n2️⃣ Checking User Profile...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile Error:', profileError);
      return;
    }
    
    if (!userProfile) {
      console.error('❌ No user profile found');
      return;
    }
    
    console.log('✅ User profile found:', userProfile);
    console.log('👤 User role:', userProfile.role);
    console.log('📊 User status:', userProfile.status);
    
    if (userProfile.role !== 'admin') {
      console.error('❌ User is not an admin. Role:', userProfile.role);
      console.log('💡 Only admin users can view all users');
      return;
    }
    
    // Step 3: Test direct database query
    console.log('\n3️⃣ Testing Database Query...');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Database Query Error:', usersError);
      return;
    }
    
    console.log('✅ Database query successful');
    console.log('📊 Total users in database:', allUsers?.length || 0);
    
    // Step 4: Analyze user distribution
    console.log('\n4️⃣ Analyzing User Distribution...');
    const userStats = {
      total: allUsers?.length || 0,
      admins: allUsers?.filter(u => u.role === 'admin').length || 0,
      teachers: allUsers?.filter(u => u.role === 'teacher').length || 0,
      students: allUsers?.filter(u => u.role === 'student').length || 0,
      nullRole: allUsers?.filter(u => !u.role || u.role === null).length || 0,
      otherRoles: allUsers?.filter(u => u.role && !['admin', 'teacher', 'student'].includes(u.role)).length || 0
    };
    
    console.log('📈 User Statistics:', userStats);
    
    // Step 5: Show sample users
    console.log('\n5️⃣ Sample Users:');
    if (allUsers && allUsers.length > 0) {
      allUsers.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || user.email} (${user.role || 'NO ROLE'}) - ${user.status || 'NO STATUS'}`);
      });
    } else {
      console.log('❌ No users found in database');
    }
    
    // Step 6: Check for data issues
    console.log('\n6️⃣ Checking for Data Issues...');
    
    const issues = [];
    
    if (userStats.nullRole > 0) {
      issues.push(`⚠️ ${userStats.nullRole} users have no role assigned`);
    }
    
    if (userStats.otherRoles > 0) {
      issues.push(`⚠️ ${userStats.otherRoles} users have unexpected roles`);
    }
    
    if (userStats.total === 0) {
      issues.push('❌ No users found in database');
    }
    
    if (userStats.admins === 0) {
      issues.push('⚠️ No admin users found');
    }
    
    if (userStats.teachers === 0) {
      issues.push('⚠️ No teacher users found');
    }
    
    if (userStats.students === 0) {
      issues.push('⚠️ No student users found');
    }
    
    if (issues.length > 0) {
      console.log('🚨 Issues Found:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ No obvious data issues found');
    }
    
    // Step 7: Test RLS policies
    console.log('\n7️⃣ Testing RLS Policies...');
    
    // Test if we can see users with different roles
    const testQueries = [
      { name: 'All Users', query: supabase.from('users').select('count') },
      { name: 'Admin Users', query: supabase.from('users').select('count').eq('role', 'admin') },
      { name: 'Teacher Users', query: supabase.from('users').select('count').eq('role', 'teacher') },
      { name: 'Student Users', query: supabase.from('users').select('count').eq('role', 'student') }
    ];
    
    for (const test of testQueries) {
      const { count, error } = await test.query;
      if (error) {
        console.log(`❌ ${test.name} query failed:`, error.message);
      } else {
        console.log(`✅ ${test.name}: ${count} users`);
      }
    }
    
    // Step 8: Recommendations
    console.log('\n8️⃣ Recommendations:');
    
    if (userStats.total === 0) {
      console.log('💡 Create some test users to verify the system works');
    }
    
    if (userStats.nullRole > 0) {
      console.log('💡 Update users with null roles to have proper roles (admin, teacher, student)');
    }
    
    if (userStats.otherRoles > 0) {
      console.log('💡 Check for users with unexpected roles and update them');
    }
    
    if (userStats.admins === 0) {
      console.log('💡 Create at least one admin user');
    }
    
    console.log('\n✅ Diagnosis Complete!');
    console.log('📋 Summary:');
    console.log(`- Total Users: ${userStats.total}`);
    console.log(`- Admins: ${userStats.admins}`);
    console.log(`- Teachers: ${userStats.teachers}`);
    console.log(`- Students: ${userStats.students}`);
    console.log(`- Issues Found: ${issues.length}`);
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
};

// Run the diagnosis
diagnoseUsersIssue();

// Export for manual use
window.diagnoseUsersIssue = diagnoseUsersIssue;
