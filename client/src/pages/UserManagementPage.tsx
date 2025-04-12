import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User } from '../context/AuthContext';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// User edit form interface
interface UserEditForm {
  first_name: string;
  last_name: string;
  email: string;
  role: User['role'];
  password?: string; // Make password optional
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm>({
    first_name: '',
    last_name: '',
    email: '',
    role: 'user',
    password: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset form when mode changes
  useEffect(() => {
    if (mode === 'create') {
      setEditingUser(null);
      setEditForm({
        first_name: '',
        last_name: '',
        email: '',
        role: 'user',
        password: '',
      });
    } else if (mode === 'edit') {
      // Form is already set by handleEditClick
    } else {
      // Reset form when mode is null
      setEditForm({
        first_name: '',
        last_name: '',
        email: '',
        role: 'user',
        password: '',
      });
    }
  }, [mode]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data.users);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEditClick = (user: User) => {
    setMode('edit');
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      password: '', // Don't populate password for security
    });
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = { ...editForm };
      // Only include password if it's not empty
      if (payload.password === '') {
        delete payload.password;
      }

      if (mode === 'create') {
        await axios.post(`${API_URL}/users`, payload);
      } else if (mode === 'edit' && editingUser) {
        await axios.put(`${API_URL}/users/${editingUser.id}`, payload);
      }

      setMode(null);
      setEditingUser(null);
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      setError(err.response?.data?.message || `Error ${mode === 'create' ? 'creating' : 'updating'} user`);
    }
  };

  // Handle delete button click
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await axios.delete(`${API_URL}/users/${userToDelete.id}`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting user');
    }
  };

  // Check if current user can edit a specific user
  const canEdit = (targetUser: User): boolean => {
    if (!currentUser) return false;

    // Admin can edit all users
    if (currentUser.role === 'admin') return true;

    // Moderator can edit basic users and themselves
    if (currentUser.role === 'moderator') {
      return targetUser.role === 'user' || targetUser.id === currentUser.id;
    }

    // Basic users can only edit themselves
    return targetUser.id === currentUser.id;
  };

  // Check if current user can delete a specific user
  const canDelete = (targetUser: User): boolean => {
    if (!currentUser) return false;

    // Admin can delete all users except themselves
    if (currentUser.role === 'admin') {
      return targetUser.id !== currentUser.id;
    }

    // Moderator can delete basic users
    if (currentUser.role === 'moderator') {
      return targetUser.role === 'user';
    }

    // Basic users cannot delete any users
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <div className="flex items-center space-x-4">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setMode('create')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create User
              </button>
            )}
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'moderator'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {canEdit(user) && (
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete(user) && (
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create/Edit User Modal */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-[520px] overflow-hidden">
            <div className="px-12 py-4 border-b">
              <h3 className="text-lg font-medium">{mode === 'create' ? 'Create User' : 'Edit User'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-12 py-8 space-y-8 bg-gray-50">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    value={editForm.first_name}
                    onChange={handleInputChange}
                    className="block w-[448px] border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    value={editForm.last_name}
                    onChange={handleInputChange}
                    className="block w-[448px] border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    className="block w-[448px] border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-white"
                  />
                </div>
                {/* Only show role field for admin or moderator editing a user */}
                {currentUser && mode === 'create' && currentUser.role === 'admin' && (
                  <div className="space-y-2">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      name="role"
                      id="role"
                      value={editForm.role}
                      onChange={handleInputChange}
                      className="block w-[448px] border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-white"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
                {currentUser && mode === 'edit' && editingUser && (
                  currentUser.role === 'admin' ||
                  (currentUser.role === 'moderator' && editingUser.role === 'user')
                ) && (
                    <div className="space-y-2">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select
                        name="role"
                        id="role"
                        value={editForm.role}
                        onChange={handleInputChange}
                        className="block w-[448px] border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-white"
                      >
                        <option value="user">User</option>
                        {currentUser.role === 'admin' && (
                          <>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={editForm.password || ''}
                    onChange={handleInputChange}
                    className="block w-[448px] border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-white"
                  />
                </div>
              </div>
              <div className="px-12 py-4 bg-white border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode(null);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-12 py-4 border-b">
              <h3 className="text-lg font-medium">Confirm Delete</h3>
            </div>
            <div className="px-12 py-4">
              <p>
                Are you sure you want to delete {userToDelete.first_name} {userToDelete.last_name}?
                This action cannot be undone.
              </p>
            </div>
            <div className="px-12 py-4 bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
