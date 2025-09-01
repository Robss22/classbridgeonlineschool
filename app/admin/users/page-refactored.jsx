'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeForInsert } from '@/utils/normalizeForInsert';

import { useUsers } from './hooks/useUsers';
import UserTable from './components/UserTable';
import EditUserModal from './components/EditUserModal';
import SuccessMessage from './components/SuccessMessage';
import AssignClassForm from './AssignClassForm';

export default function UsersManagementPage() {
  const router = useRouter();
  const {
    users,
    loading,
    error,
    fetchUsers,
    updateUser,
    deleteUser,
    toggleUserStatus,
  } = useUsers();

  // UI State
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [showAdmins, setShowAdmins] = useState(true);
  const [showTeachers, setShowTeachers] = useState(true);
  const [showStudents, setShowStudents] = useState(true);
  
  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  
  // Success Message State
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users by role
  const admins = users.filter(u => u.role === 'admin');
  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');

  // Event Handlers
  const handleEditUser = (user) => {
    setEditUser(user);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (formData) => {
    setEditLoading(true);
    
    try {
      // Handle password change if provided
      if (formData.password) {
        const res = await fetch('/api/admin/change-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: editUser.id, 
            newPassword: formData.password 
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Password change failed');
        }
      }
      
      // Update user data
      const updates = {
        full_name: formData.name,
        phone: formData.phone,
        role: formData.role,
      };
      
      const result = await updateUser(editUser.id, normalizeForInsert(updates, ['full_name', 'phone', 'role']));
      
      if (result.success) {
        showSuccess(`User "${formData.name}" updated successfully!`);
        setShowEditModal(false);
        setEditUser(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      alert('Update error: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    const result = await deleteUser(user.id);
    
    if (result.success) {
      showSuccess(`User "${user.full_name || user.email}" deleted successfully!`);
    } else {
      alert('Delete error: ' + result.error);
    }
    
    setOpenDropdownId(null);
  };

  const handleToggleStatus = async (user) => {
    const action = user.status !== 'inactive' ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }
    
    const result = await toggleUserStatus(user.id, user.status);
    
    if (result.success) {
      showSuccess(`User ${action}d successfully!`);
    } else {
      alert(`${action.charAt(0).toUpperCase() + action.slice(1)} error: ` + result.error);
    }
    
    setOpenDropdownId(null);
  };

  const handleAssignClass = (teacher) => {
    setSelectedTeacher(teacher);
    setShowAssignModal(true);
  };

  const handleAssignClassSuccess = () => {
    const teacherName = selectedTeacher?.full_name || 
      `${selectedTeacher?.first_name || ''} ${selectedTeacher?.last_name || ''}`.trim();
    
    showSuccess(`Teacher "${teacherName}" has been successfully assigned!`);
    setShowAssignModal(false);
    setSelectedTeacher(null);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setSuccessMessage('');
    }, 3000);
  };

  // Loading and Error States
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="py-12 text-center text-lg text-gray-700">
          Loading users...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-red-600 py-12 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl font-inter">
      {/* Header */}
      <div className="mb-8 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Users Management</h1>
            <p className="text-lg text-gray-600">
              Manage teacher and admin accounts and assignments
            </p>
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

      {/* Admins Section */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-blue-700 font-semibold focus:outline-none"
          onClick={() => setShowAdmins(v => !v)}
        >
          <span>Admins ({admins.length})</span>
          <span className={`transform transition-transform ${showAdmins ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showAdmins && (
          <UserTable
            users={admins}
            role="admin"
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        )}
      </div>

      {/* Teachers Section */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-blue-700 font-semibold focus:outline-none"
          onClick={() => setShowTeachers(v => !v)}
        >
          <span>Teachers ({teachers.length})</span>
          <span className={`transform transition-transform ${showTeachers ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showTeachers && (
          <UserTable
            users={teachers}
            role="teacher"
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onAssignClass={handleAssignClass}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        )}
      </div>

      {/* Students Section */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-blue-700 font-semibold focus:outline-none"
          onClick={() => setShowStudents(v => !v)}
        >
          <span>Students ({students.length})</span>
          <span className={`transform transition-transform ${showStudents ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showStudents && (
          <UserTable
            users={students}
            role="student"
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        )}
      </div>

      {/* Success Message */}
      <SuccessMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onClose={() => setShowSuccessMessage(false)}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editUser}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        loading={editLoading}
      />

      {/* Assign Class Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => { setShowAssignModal(false); setSelectedTeacher(null); }}
              title="Close"
            >
              &times;
            </button>
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
    </div>
  );
}
