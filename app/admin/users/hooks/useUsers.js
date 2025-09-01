import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Verify admin authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        throw new Error('Authentication required. Please log in.');
      }

      // Verify admin role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !userProfile || userProfile.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Fetch all users
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        throw new Error(`Failed to load users: ${usersError.message}`);
      }

      // Fetch teacher records for teachers
      const { data: teacherRecords, error: teacherError } = await supabase
        .from('teachers')
        .select('teacher_id, user_id');

      if (teacherError) {
        console.warn('Could not fetch teacher records:', teacherError.message);
      }

      // Create a map of user_id to teacher_id
      const teacherIdMap = {};
      if (teacherRecords) {
        teacherRecords.forEach(teacher => {
          teacherIdMap[teacher.user_id] = teacher.teacher_id;
        });
      }

      // Transform and validate user data
      const transformedUsers = (allUsers || []).map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        phone: user.phone,
        status: user.status,
        created_at: user.created_at,
        teacher_id: user.role === 'teacher' ? teacherIdMap[user.id] || null : null,
        user_id: user.id,
      }));

      setUsers(transformedUsers);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId, updates) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
      
      // Refresh users list
      await fetchUsers();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId) => {
    try {
      // First, get the user details to understand what type of user we're deleting
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // If it's a teacher, we need to handle teacher-specific cleanup
      if (userData.role === 'teacher') {
        // Get the teacher_id
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('teacher_id')
          .eq('user_id', userId)
          .single();
        
        if (teacherError) throw teacherError;
        if (!teacherData) throw new Error('Teacher profile not found');

        // Delete related live classes first (if table exists)
        try {
          const { error: liveClassesError } = await supabase
            .from('live_classes')
            .delete()
            .eq('teacher_id', teacherData.teacher_id);
          
          if (liveClassesError) {
            console.warn('Could not delete live classes:', liveClassesError.message);
            // Continue with deletion even if live classes deletion fails
          }
        } catch (liveClassErr) {
          console.warn('Live classes table might not exist or have different structure:', liveClassErr.message);
          // Continue with deletion
        }

        // Delete related timetables (if table exists)
        try {
          const { error: timetablesError } = await supabase
            .from('timetables')
            .delete()
            .eq('teacher_id', teacherData.teacher_id);
          
          if (timetablesError) {
            console.warn('Could not delete timetables:', timetablesError.message);
            // Continue with deletion even if timetables deletion fails
          }
        } catch (timetableErr) {
          console.warn('Timetables table might not exist or have different structure:', timetableErr.message);
          // Continue with deletion
        }

        // Delete the teacher record
        const { error: teacherDeleteError } = await supabase
          .from('teachers')
          .delete()
          .eq('teacher_id', teacherData.teacher_id);
        
        if (teacherDeleteError) throw teacherDeleteError;
      }

      // If it's a student, handle student-specific cleanup
      if (userData.role === 'student') {
        // Delete student timetable assignments (if table exists)
        try {
          const { error: studentTimetablesError } = await supabase
            .from('student_timetables')
            .delete()
            .eq('student_id', userId);
          
          if (studentTimetablesError) {
            console.warn('Could not delete student timetables:', studentTimetablesError.message);
          }
        } catch (studentTimetableErr) {
          console.warn('Student timetables table might not exist:', studentTimetableErr.message);
        }

        // Delete live class participants (if table exists)
        try {
          const { error: participantsError } = await supabase
            .from('live_class_participants')
            .delete()
            .eq('student_id', userId);
          
          if (participantsError) {
            console.warn('Could not delete live class participants:', participantsError.message);
          }
        } catch (participantsErr) {
          console.warn('Live class participants table might not exist:', participantsErr.message);
        }
      }

      // Finally, delete the user record
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      // Refresh users list
      await fetchUsers();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchUsers]);

  const toggleUserStatus = useCallback(async (userId, currentStatus) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    return await updateUser(userId, { status: newStatus });
  }, [updateUser]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUser,
    deleteUser,
    toggleUserStatus,
  };
};
