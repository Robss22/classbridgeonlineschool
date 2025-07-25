'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AddTeacherForm from './AddTeacherForm';
import { useRouter } from 'next/navigation';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [editUser, setEditUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', password: '', role: '' });
  const [editLoading, setEditLoading] = useState(false);
  const dropdownRefs = useRef({});
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Use useCallback to avoid unnecessary re-renders
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) {
      setError('Failed to load users: ' + error.message);
      setTeachers([]);
    } else {
      setTeachers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler for successful teacher addition
  const handleAddTeacherSuccess = () => {
    fetchUsers(); // Auto-refresh the list
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
    const { error: updateError } = await supabase.from('users').update(updates).eq('id', editUser.id);
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl font-inter">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Users</h1>
        <button
          onClick={() => router.push('/admin/register-new-user')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
        >
          + Add New User
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Bio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.role || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.bio || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.status || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 relative">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                  >Actions ▾</button>
                  {openDropdownId === user.id && (
                    <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10 w-32">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => { setOpenDropdownId(null); handleOpenEdit(user); }}
                      >Edit</button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={async () => {
                          setOpenDropdownId(null);
                          if (confirm('Are you sure you want to delete this user?')) {
                            setLoading(true);
                            const { error } = await supabase.from('users').delete().eq('id', user.id);
                            if (error) alert('Delete error: ' + error.message);
                            else fetchUsers();
                            setLoading(false);
                          }
                        }}
                      >Delete</button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                        onClick={async () => {
                          setOpenDropdownId(null);
                          if (user.status === 'inactive') {
                            if (confirm('Activate this user?')) {
                              setLoading(true);
                              const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', user.id);
                              if (error) alert('Activate error: ' + error.message);
                              else fetchUsers();
                              setLoading(false);
                            }
                          } else {
                            if (confirm('Deactivate this user?')) {
                              setLoading(true);
                              const { error } = await supabase.from('users').update({ status: 'inactive' }).eq('id', user.id);
                              if (error) alert('Deactivate error: ' + error.message);
                              else fetchUsers();
                              setLoading(false);
                            }
                          }
                        }}
                        // No longer disable button for inactive
                      >{user.status === 'inactive' ? 'Activate' : 'Deactivate'}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
                disabled={editLoading}
              >{editLoading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Remove modal logic */}
    </div>
  );
}
