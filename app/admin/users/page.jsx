'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AddTeacherForm from './AddTeacherForm';
import AssignClassForm from './AssignClassForm';
import { useRouter } from 'next/navigation';



export default function TeachersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [editUser, setEditUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', password: '', role: '' });
  const [editLoading, setEditLoading] = useState(false);
  const dropdownRefs = useRef({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [showAdmins, setShowAdmins] = useState(false);
  const [showTeachers, setShowTeachers] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  // Assign class modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  // Success message state
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Function to create teacher record if it doesn't exist
  const ensureTeacherRecord = async (userId) => {
    try {
      // Check if teacher record already exists
      const { data: existingTeacher, error: checkError } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('user_id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ [ensureTeacherRecord] Error checking existing teacher:', checkError);
        return null;
      }
      
      if (existingTeacher) {
        console.log('✅ [ensureTeacherRecord] Teacher record already exists for user:', userId);
        return existingTeacher.teacher_id;
      }
      
      // Create new teacher record
      const { data: newTeacher, error: createError } = await supabase
        .from('teachers')
        .insert([{ user_id: userId }])
        .select('teacher_id')
        .single();
      
      if (createError) {
        console.error('❌ [ensureTeacherRecord] Error creating teacher record:', createError);
        return null;
      }
      
      console.log('✅ [ensureTeacherRecord] Created new teacher record:', newTeacher.teacher_id);
      return newTeacher.teacher_id;
    } catch (error) {
      console.error('❌ [ensureTeacherRecord] Unexpected error:', error);
      return null;
    }
  };

  // Use useCallback to avoid unnecessary re-renders
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch admins and students from users table
      const { data: regularUsers, error: regularError } = await supabase
      .from('users')
        .select('*')
        .in('role', ['admin', 'student']);
      if (regularError) {
        setError('Failed to load users: ' + regularError.message);
        setUsers([]);
        setLoading(false);
        return;
      }

      // First, try to fetch from teachers_with_users view
      let teachersData = null;
      let teachersError = null;
      
      const { data: viewData, error: viewError } = await supabase
        .from('teachers_with_users')
      .select('*');
      
      console.log('🔍 [fetchUsers] teachers_with_users view result:', { data: viewData, error: viewError });
      
      if (viewError) {
        console.warn('⚠️ [fetchUsers] teachers_with_users view failed, trying fallback approach');
        teachersError = viewError;
      } else if (viewData && viewData.length > 0) {
        teachersData = viewData;
        console.log('✅ [fetchUsers] Using teachers_with_users view data');
      } else {
        console.warn('⚠️ [fetchUsers] teachers_with_users view is empty, trying fallback approach');
      }

      // Fallback: If view is empty or fails, fetch teachers from users table and join with teachers table
      if (!teachersData || teachersData.length === 0) {
        console.log('🔄 [fetchUsers] Using fallback: fetching teachers from users table');
        
        // Get all users with role 'teacher'
        const { data: teacherUsers, error: teacherUsersError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'teacher');
        
        if (teacherUsersError) {
          console.error('❌ [fetchUsers] Failed to fetch teacher users:', teacherUsersError);
          setError('Failed to load teachers: ' + teacherUsersError.message);
          setUsers([]);
          setLoading(false);
          return;
        }
        
        console.log('🔍 [fetchUsers] Teacher users found:', teacherUsers);
        
        if (teacherUsers && teacherUsers.length > 0) {
          // For each teacher user, try to get their teacher record or create one if it doesn't exist
          const teacherPromises = teacherUsers.map(async (user) => {
            const { data: teacherRecord, error: teacherError } = await supabase
              .from('teachers')
              .select('*')
              .eq('user_id', user?.id ?? '')
              .single();
            
            let finalTeacherRecord = teacherRecord;
            
            if (teacherError && teacherError.code === 'PGRST116') { // PGRST116 = no rows returned
              console.log(`ℹ️ [fetchUsers] No teacher record found for user ${user.id}, creating one...`);
              const newTeacherId = await ensureTeacherRecord(user.id);
              if (newTeacherId) {
                // Fetch the newly created teacher record
                const { data: newTeacherRecord } = await supabase
                  .from('teachers')
                  .select('*')
                  .eq('teacher_id', newTeacherId)
                  .single();
                finalTeacherRecord = newTeacherRecord;
              }
            } else if (teacherError) {
              console.warn(`⚠️ [fetchUsers] Error fetching teacher record for user ${user.id}:`, teacherError);
            }
            
            return {
              user,
              teacherRecord: finalTeacherRecord
            };
          });
          
          const teacherResults = await Promise.all(teacherPromises);
          console.log('🔍 [fetchUsers] Teacher results:', teacherResults);
          
          // Transform the data to match expected format
          teachersData = teacherResults.map(({ user, teacherRecord }) => {
            const transformed = {
              // User data
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              first_name: user.first_name,
              last_name: user.last_name,
              role: 'teacher',
              phone: user.phone,
              status: user.status,
              // Teacher data (if exists)
              teacher_id: teacherRecord?.teacher_id || null,
              user_id: user.id,
              program_id: teacherRecord?.program_id || null,
              bio: teacherRecord?.bio || null,
            };
            
            // Log warning if teacher_id is still null after creation attempt
            if (!transformed.teacher_id) {
              console.warn(`⚠️ [fetchUsers] Teacher record creation failed for user ${user.id}`);
            }
            
            return transformed;
          });
          
          console.log('✅ [fetchUsers] Transformed teacher data:', teachersData);
        } else {
          teachersData = [];
          console.log('ℹ️ [fetchUsers] No teacher users found in users table');
        }
      }

      // Transform teachers data to match the expected format (if not already transformed)
      const transformedTeachers = (teachersData || []).map(teacher => {
        const transformed = {
          id: teacher.user_id || teacher.id, // This is the user ID from users table
          teacher_id: teacher.teacher_id, // This is the teacher ID from teachers table
          user_id: teacher.user_id || teacher.id, // This is the user ID for the users table operations
          email: teacher.email,
          full_name: teacher.full_name,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          role: 'teacher',
          phone: teacher.phone,
          status: teacher.status,
          program_id: teacher.program_id,
          bio: teacher.bio,
        };
        console.log('🔄 [fetchUsers] Transformed teacher:', transformed);
        return transformed;
      });

      // Combine regular users and transformed teachers
      const allUsers = [...(regularUsers || []), ...transformedTeachers];
      console.log('✅ [fetchUsers] Final combined users array:', allUsers);
      setUsers(allUsers);
    } catch (error) {
      console.error('❌ [fetchUsers] Unexpected error:', error);
      setError('An unexpected error occurred: ' + error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler for successful teacher addition
  const handleAddTeacherSuccess = () => {
    console.log('🔄 [handleAddTeacherSuccess] Refreshing users list...');
    fetchUsers(); // Auto-refresh the list
  };

  // Handler for successful subject assignment
  const handleAssignClassSuccess = () => {
    const teacherName = selectedTeacher?.full_name || `${selectedTeacher?.first_name || ''} ${selectedTeacher?.last_name || ''}`.trim();
    
    // Extract form data from the current form state
    const extractFormData = () => {
      try {
        const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-30');
        const form = modal?.querySelector('form');
        if (!form) return {};
        
        const formData = {};
        
        // Get all select elements
        const selects = form.querySelectorAll('select');
        
        // Get level (second select element)
        if (selects.length >= 2) {
          const levelSelect = selects[1];
          if (levelSelect && levelSelect.value) {
            const selectedOption = levelSelect.options[levelSelect.selectedIndex];
            if (selectedOption && selectedOption.text !== 'Select Level') {
              formData.level = selectedOption.text;
            }
          }
        }
        
        // Get subject (third select element)
        if (selects.length >= 3) {
          const subjectSelect = selects[2];
          if (subjectSelect && subjectSelect.value) {
            const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
            if (selectedOption && selectedOption.text !== 'Select Subject') {
              formData.subject = selectedOption.text;
            }
          }
        }
        
        // Get class teacher status
        const classTutorCheckbox = form.querySelector('input[type="checkbox"]');
        if (classTutorCheckbox) {
          formData.isClassTeacher = classTutorCheckbox.checked;
        }
        
        return formData;
      } catch (error) {
        console.error('Error extracting form data:', error);
        return {};
      }
    };
    
    // Extract form data
    const formData = extractFormData();
    
    // Build comprehensive success message
    let message = `Teacher "${teacherName}" has been successfully assigned`;
    
    if (formData.level) {
      message += ` to ${formData.level}`;
    }
    
    if (formData.subject) {
      if (formData.level) {
        message += ` for ${formData.subject}`;
      } else {
        message += ` for ${formData.subject}`;
      }
    }
    
    if (formData.isClassTeacher) {
      message += ` and as Class Teacher`;
    }
    
    message += "!";
    
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    
    // Close modal and refresh data
    setShowAssignModal(false);
    setSelectedTeacher(null);
    fetchUsers();
  };

  // Handle edit modal open
  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`,
      phone: user.phone || '',
      password: '',
      role: user.role || 'student',
    });
    setShowEditModal(true);
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    // Update name, phone, and role
    const updates = {
      full_name: editForm.name,
      phone: editForm.phone,
      role: editForm.role,
    };
    let error = null;
    // Secure password change
    if (editForm.password) {
      try {
        const res = await fetch('/api/admin/change-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: editUser.id, newPassword: editForm.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Password change failed');
        alert('Password updated successfully.');
      } catch (err) {
        alert('Password update error: ' + err.message);
        setEditLoading(false);
        return;
      }
    }
    const { error: updateError } = await supabase.from('users').update(normalizeForInsert(updates)).eq('id', editUser.id);
    error = updateError;
    if (error) alert('Update error: ' + error.message);
    else {
      setShowEditModal(false);
      fetchUsers();
    }
    setEditLoading(false);
  };

  if (loading) return <div className="py-12 text-center text-lg text-gray-700">Loading teachers...</div>;
  if (error) return <div className="text-red-600 py-12 text-center">{error}</div>;

  // Group users by role
  const admins = users.filter(u => u.role === 'admin');
  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl font-inter">
      <div className="mb-8 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Users Management</h1>
            <p className="text-lg text-gray-600">Manage teacher and admin accounts and assignments</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/admin/register-new-user')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
            >
              + Add New User
            </button>
            <button
              onClick={() => { setShowAssignModal(true); setSelectedTeacher(null); }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition"
            >
              Assign Teacher Class/Subject
            </button>
          </div>
        </div>
      </div>
      {/* Admins Section - Collapsible */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-blue-700 font-semibold focus:outline-none"
          onClick={() => setShowAdmins(v => !v)}
        >
          <span>Admins</span>
          <span className={`transform transition-transform ${showAdmins ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showAdmins && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow mt-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.status || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 relative">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                      >Actions ▾</button>
                      {openDropdownId === user.id && (
                        <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10 w-32">
                          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setOpenDropdownId(null); handleOpenEdit(user); }}>Edit</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={async () => { setOpenDropdownId(null); if (confirm('Are you sure you want to delete this user?')) { setLoading(true); const { error } = await supabase.from('users').delete().eq('id', user.id); if (error) alert('Delete error: ' + error.message); else fetchUsers(); setLoading(false); } }}>Delete</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100" onClick={async () => { setOpenDropdownId(null); if (user.status === 'inactive') { if (confirm('Activate this user?')) { setLoading(true); const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', user.id); if (error) alert('Activate error: ' + error.message); else fetchUsers(); setLoading(false); } } else { if (confirm('Deactivate this user?')) { setLoading(true); const { error } = await supabase.from('users').update({ status: 'inactive' }).eq('id', user.id); if (error) alert('Deactivate error: ' + error.message); else fetchUsers(); setLoading(false); } } }}> {user.status === 'inactive' ? 'Activate' : 'Deactivate'}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Teachers Section - Collapsible */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-blue-700 font-semibold focus:outline-none"
          onClick={() => setShowTeachers(v => !v)}
        >
          <span>Teachers</span>
          <span className={`transform transition-transform ${showTeachers ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showTeachers && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow mt-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.status || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 relative">
                      <button className="text-blue-600 hover:underline" onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}>Actions ▾</button>
                      {openDropdownId === user.id && (
                        <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10 w-40">
                          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setOpenDropdownId(null); handleOpenEdit(user); }}>Edit</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={async () => { setOpenDropdownId(null); if (confirm('Are you sure you want to delete this user?')) { setLoading(true); const { error } = await supabase.from('users').delete().eq('id', user.id); if (error) alert('Delete error: ' + error.message); else fetchUsers(); setLoading(false); } }}>Delete</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100" onClick={async () => { setOpenDropdownId(null); if (user.status === 'inactive') { if (confirm('Activate this user?')) { setLoading(true); const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', user.id); if (error) alert('Activate error: ' + error.message); else fetchUsers(); setLoading(false); } } else { if (confirm('Deactivate this user?')) { setLoading(true); const { error } = await supabase.from('users').update({ status: 'inactive' }).eq('id', user.id); if (error) alert('Deactivate error: ' + error.message); else fetchUsers(); setLoading(false); } } }}> {user.status === 'inactive' ? 'Activate' : 'Deactivate'}</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100" onClick={() => { setOpenDropdownId(null); setSelectedTeacher(user); setShowAssignModal(true); }}>Assign Class/Subject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-blue-700 font-semibold focus:outline-none"
          onClick={() => setShowStudents(v => !v)}
        >
          <span>Students</span>
          <span className={`transform transition-transform ${showStudents ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showStudents && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow mt-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.status || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 relative">
                      <button className="text-blue-600 hover:underline" onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}>Actions ▾</button>
                      {openDropdownId === user.id && (
                        <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10 w-32">
                          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setOpenDropdownId(null); handleOpenEdit(user); }}>Edit</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={async () => { setOpenDropdownId(null); if (confirm('Are you sure you want to delete this user?')) { setLoading(true); const { error } = await supabase.from('users').delete().eq('id', user.id); if (error) alert('Delete error: ' + error.message); else fetchUsers(); setLoading(false); } }}>Delete</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100" onClick={async () => { setOpenDropdownId(null); if (user.status === 'inactive') { if (confirm('Activate this user?')) { setLoading(true); const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', user.id); if (error) alert('Activate error: ' + error.message); else fetchUsers(); setLoading(false); } } else { if (confirm('Deactivate this user?')) { setLoading(true); const { error } = await supabase.from('users').update({ status: 'inactive' }).eq('id', user.id); if (error) alert('Deactivate error: ' + error.message); else fetchUsers(); setLoading(false); } } }}> {user.status === 'inactive' ? 'Activate' : 'Deactivate'}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => { setShowSuccessMessage(false); setSuccessMessage(''); }}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowEditModal(false)}
              title="Close"
            >&times;</button>
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                disabled={!!editLoading}
              >{editLoading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Assign Class Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => { setShowAssignModal(false); setSelectedTeacher(null); }}
              title="Close"
            >&times;</button>
            {!selectedTeacher ? (
              <div>
                <h2 className="text-lg font-semibold mb-4">Select Teacher</h2>
                <select
                  className="w-full border p-2 rounded mb-4"
                  onChange={e => {
                    const teacherId = e.target.value;
                    const teacherObj = teachers.find(t => t.id === teacherId);
                    setSelectedTeacher(teacherObj || null);
                  }}
                  defaultValue=""
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name || `${t.first_name || ''} ${t.last_name || ''}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <AssignClassForm
                teacher={selectedTeacher}
                onSuccess={handleAssignClassSuccess}
                onCancel={() => { setShowAssignModal(false); setSelectedTeacher(null); }}
              />
            )}
          </div>
        </div>
      )}
      {/* Remove modal logic */}
    </div>
  );
}
