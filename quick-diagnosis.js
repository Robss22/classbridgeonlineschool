// Quick Diagnosis Script
// Copy and paste this into your browser console on the users management page

const quickDiagnosis = async () => {
  console.log('🔍 Quick Diagnosis Starting...');
  
  try {
    // Check what users are being returned
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Query Error:', error);
      return;
    }
    
    console.log('📊 Total users returned:', users?.length || 0);
    
    if (users && users.length > 0) {
      console.log('📋 Users found:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || user.email} (${user.role || 'NO ROLE'})`);
      });
      
      // Count by role
      const counts = {
        admin: users.filter(u => u.role === 'admin').length,
        teacher: users.filter(u => u.role === 'teacher').length,
        student: users.filter(u => u.role === 'student').length,
        other: users.filter(u => u.role && !['admin', 'teacher', 'student'].includes(u.role)).length,
        null: users.filter(u => !u.role).length
      };
      
      console.log('\n📈 Role Distribution:');
      console.log(`- Admins: ${counts.admin}`);
      console.log(`- Teachers: ${counts.teacher}`);
      console.log(`- Students: ${counts.student}`);
      console.log(`- Other roles: ${counts.other}`);
      console.log(`- Null roles: ${counts.null}`);
      
      // Identify the issue
      if (counts.admin > 0 && counts.teacher === 0 && counts.student === 0) {
        console.log('\n🚨 ISSUE IDENTIFIED: Only admin users exist in database');
        console.log('💡 SOLUTION: Create teacher and student users');
      } else if (counts.admin === 0) {
        console.log('\n🚨 ISSUE IDENTIFIED: No admin users found');
        console.log('💡 SOLUTION: Create at least one admin user');
      } else if (counts.teacher > 0 || counts.student > 0) {
        console.log('\n✅ Data looks good - users exist for all roles');
        console.log('💡 If UI still shows 0, check RLS policies');
      }
      
    } else {
      console.log('❌ No users found in database');
      console.log('💡 SOLUTION: Create some test users');
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
};

// Run the diagnosis
quickDiagnosis();
