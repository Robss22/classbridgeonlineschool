import React from 'react';

const UserTable = ({ 
  users, 
  role, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onAssignClass,
  openDropdownId,
  setOpenDropdownId 
}) => {
  // const getRoleDisplayName = (role) => {
  //   return role.charAt(0).toUpperCase() + role.slice(1) + 's';
  // };

  const getEmptyMessage = (role) => {
    switch (role) {
      case 'admin':
        return 'No admin users found. Click "Add New User" to create an admin account.';
      case 'teacher':
        return 'No teacher users found. Click "Add New User" to create teacher accounts.';
      case 'student':
        return 'No student users found. Students typically register through the application process.';
      default:
        return 'No users found.';
    }
  };

  return (
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
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                {getEmptyMessage(role)}
              </td>
            </tr>
          ) : (
            users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.status || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 relative">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                  >
                    Actions ▾
                  </button>
                  {openDropdownId === user.id && (
                    <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10 w-40">
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" 
                        onClick={() => { setOpenDropdownId(null); onEdit(user); }}
                      >
                        Edit
                      </button>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" 
                        onClick={() => onDelete(user)}
                      >
                        Delete
                      </button>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100" 
                        onClick={() => onToggleStatus(user)}
                      >
                        {user.status === 'inactive' ? 'Activate' : 'Deactivate'}
                      </button>
                      {role === 'teacher' && onAssignClass && (
                        <button 
                          className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100" 
                          onClick={() => { setOpenDropdownId(null); onAssignClass(user); }}
                        >
                          Assign Class/Subject
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
