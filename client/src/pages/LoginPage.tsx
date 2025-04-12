import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [isFirstUser, setIsFirstUser] = useState<boolean>(false);
  const [adminFormData, setAdminFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const { login, initAdmin, error, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check if this is the first user setup
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/check-first-user`);
        setIsFirstUser(response.data.isFirstUser);
      } catch (error) {
        console.error('Error checking first user status:', error);
        setIsFirstUser(false); // Default to normal login if check fails
      }
    };
    checkFirstUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    } catch (err) {
      // Error is handled by auth context
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await initAdmin(adminFormData);
      navigate('/');
    } catch (err) {
      // Error is handled by auth context
    }
  };

  if (isFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-center text-3xl font-bold">First-Time Setup</h2>
            <p className="mt-2 text-center text-gray-600">
              Create your admin account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAdminSetup}>
            <div className="space-y-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={adminFormData.first_name}
                  onChange={handleAdminInputChange}
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={adminFormData.last_name}
                  onChange={handleAdminInputChange}
                />
              </div>
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium">
                  Email
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={adminFormData.email}
                  onChange={handleAdminInputChange}
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium">
                  Password
                </label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={adminFormData.password}
                  onChange={handleAdminInputChange}
                />
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Admin Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Sign in</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
