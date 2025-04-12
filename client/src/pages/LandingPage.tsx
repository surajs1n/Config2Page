import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Config2Page</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-700">
                  Welcome, {user.first_name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Config2Page</h2>
          <p className="mb-6 text-gray-600">
            A role-based user management system with responsive interface.
          </p>

          {/* Role-specific welcome message */}
          {user && (
            <div className="mb-8 p-4 bg-blue-50 rounded-md">
              {user.role === 'admin' && (
                <p className="text-blue-800">
                  As an administrator, you have full access to manage all users and their permissions.
                </p>
              )}
              {user.role === 'moderator' && (
                <p className="text-blue-800">
                  As a moderator, you can manage basic users and edit your own details.
                </p>
              )}
              {user.role === 'user' && (
                <p className="text-blue-800">
                  As a user, you can view all users and edit your own details.
                </p>
              )}
            </div>
          )}

          {/* Navigation cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium mb-2">User Management</h3>
              <p className="text-gray-600 mb-4">
                View, edit, and manage users based on your role permissions.
              </p>
              <Link
                to="/users"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to User Management
              </Link>
            </div>

            <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium mb-2">Your Profile</h3>
              <p className="text-gray-600 mb-4">
                View and edit your personal information.
              </p>
              {user && (
                <Link
                  to={`/users/${user.id}`}
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  View Profile
                </Link>
              )}
            </div>

            {/* Audit Logs Card (Admin Only) */}
            {user?.role === 'admin' && (
              <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-medium mb-2">Audit Logs</h3>
                <p className="text-gray-600 mb-4">
                  View system activity and user action logs.
                </p>
                <Link
                  to="/audit-logs"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  View Audit Logs
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Config2Page. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
