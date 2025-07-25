'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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

  if (loading) return <div className="py-12 text-center text-lg text-gray-700">Loading teachers...</div>;
  if (error) return <div className="text-red-600 py-12 text-center">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl font-inter">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Users</h1>
        <button
          onClick={() => router.push('/admin/add-new-user')}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Remove modal logic */}
    </div>
  );
}
