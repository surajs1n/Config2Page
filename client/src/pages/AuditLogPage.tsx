import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuditLog, AuditPagination, AUDIT_TYPES } from '../types/audit';
import ProfileDropdown from '../components/ProfileDropdown';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    action_type: ''
  });
  const [pagination, setPagination] = useState<AuditPagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Fetch logs on component mount and when filters/pagination change
  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format metadata for display
  const formatMetadata = (metadata: any): string => {
    if (!metadata) return 'No details';
    
    if (metadata.changes) {
      return metadata.changes.map((change: any) => (
        `${change.field}: ${change.oldValue} → ${change.newValue}`
      )).join(', ');
    }
    
    if (metadata.reason) {
      return `Reason: ${metadata.reason}`;
    }
    
    if (metadata.user_details) {
      return `User: ${metadata.user_details.email} (${metadata.user_details.role})`;
    }
    
    if (metadata.browser) {
      return `Browser: ${metadata.browser}`;
    }
    
    return JSON.stringify(metadata);
  };

  // Get action type color
  const getActionTypeColor = (actionType: string): string => {
    switch (actionType) {
      case AUDIT_TYPES.LOGIN_SUCCESS:
        return 'bg-green-100 text-green-800';
      case AUDIT_TYPES.LOGIN_FAILURE:
        return 'bg-red-100 text-red-800';
      case AUDIT_TYPES.CREATE_USER:
        return 'bg-blue-100 text-blue-800';
      case AUDIT_TYPES.EDIT_USER:
        return 'bg-yellow-100 text-yellow-800';
      case AUDIT_TYPES.DELETE_USER:
        return 'bg-purple-100 text-purple-800';
      case AUDIT_TYPES.LOGOUT:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch logs with filters and pagination
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.from) queryParams.append('from', filters.from);
      if (filters.to) queryParams.append('to', filters.to);
      if (filters.action_type) queryParams.append('action_type', filters.action_type);
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      const response = await axios.get(`${API_URL}/audit/logs?${queryParams.toString()}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({
      ...prev,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <div className="flex items-center space-x-4 ml-auto">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="from"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3"
              />
            </div>
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="to"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3"
              />
            </div>
            <div>
              <label htmlFor="action_type" className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                id="action_type"
                name="action_type"
                value={filters.action_type}
                onChange={handleFilterChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3"
              >
                <option value="">All Actions</option>
                {Object.values(AUDIT_TYPES).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilters({ from: '', to: '', action_type: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Logs table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="spinner"></div>
            <p>Loading audit logs...</p>
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
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionTypeColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.target ? `${log.target.first_name} ${log.target.last_name}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatMetadata(log.metadata)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1 border rounded-md ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 border rounded-md ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`px-3 py-1 border rounded-md ${
                  pagination.page === pagination.pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuditLogPage;
