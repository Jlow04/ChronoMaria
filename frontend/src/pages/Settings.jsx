import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { userService, auditLogService } from '../services/api';
import './Settings.css';

function Settings() {
  const [expandedSections, setExpandedSections] = useState({
    currentUsers: false,
    createUser: false,
    auditLogs: false
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    type: '', // 'success' | 'error'
    message: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    userId: null,
    username: ''
  });
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.username || null;
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
    return null;
  };

  useEffect(() => {
    if (expandedSections.currentUsers) {
      loadUsers();
    }
  }, [expandedSections.currentUsers]);

  useEffect(() => {
    if (expandedSections.auditLogs) {
      loadAuditLogs();
    }
  }, [expandedSections.auditLogs]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await auditLogService.getAll();
      setAuditLogs(data || []);
    } catch (err) {
      setError('Failed to load audit logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showConfirmation('error', 'Passwords do not match!');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const currentUsername = getCurrentUser();
      await userService.create(formData.username, formData.password, formData.email, currentUsername);
      showConfirmation('success', 'User created successfully!');
      setFormData({ username: '', password: '', confirmPassword: '', email: '' });
      // Reload users list if it's expanded
      if (expandedSections.currentUsers) {
        loadUsers();
      }
      // Reload audit logs if expanded
      if (expandedSections.auditLogs) {
        loadAuditLogs();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create user';
      setError(errorMsg);
      showConfirmation('error', 'Failed to create user: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setTempRole(user.role || 'Admin');
    setTempActive(user.is_active || false);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
  };

  const showConfirmation = (type, message) => {
    setConfirmationModal({
      show: true,
      type,
      message
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({
      show: false,
      type: '',
      message: ''
    });
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      setLoading(true);
      const user = users.find(u => u.id === userId);
      const currentUsername = getCurrentUser();
      await userService.update(userId, newRole, user.is_active, currentUsername);
      showConfirmation('success', 'User role updated!');
      loadUsers();
      // Reload audit logs if expanded
      if (expandedSections.auditLogs) {
        loadAuditLogs();
      }
    } catch (err) {
      showConfirmation('error', 'Failed to update role: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserActiveToggle = async (userId, newActive) => {
    try {
      setLoading(true);
      const user = users.find(u => u.id === userId);
      const currentUsername = getCurrentUser();
      await userService.update(userId, user.role, newActive, currentUsername);
      showConfirmation('success', 'User status updated!');
      loadUsers();
      // Reload audit logs if expanded
      if (expandedSections.auditLogs) {
        loadAuditLogs();
      }
    } catch (err) {
      showConfirmation('error', 'Failed to update status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserDelete = async (userId) => {
    try {
      setLoading(true);
      const user = users.find(u => u.id === userId);
      const currentUsername = getCurrentUser();
      await userService.delete(userId, currentUsername);
      showConfirmation('success', `User "${user.username}" deleted successfully!`);
      loadUsers();
      // Reload audit logs if expanded
      if (expandedSections.auditLogs) {
        loadAuditLogs();
      }
      setDeleteConfirmation({ show: false, userId: null, username: '' });
    } catch (err) {
      showConfirmation('error', 'Failed to delete user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmation = (userId, username) => {
    setDeleteConfirmation({ show: true, userId, username });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({ show: false, userId: null, username: '' });
  };

  return (
    <>
      <Navbar />
      <div className="settings-container page-content">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage system and user settings</p>
        </div>

        <div className="settings-layout">
          <div className="settings-sidebar">
            <div className="settings-menu">
              {/* Current Users Dropdown */}
              <div className={`dropdown-section ${expandedSections.currentUsers ? 'expanded' : ''}`}>
                <button 
                  className="dropdown-toggle"
                  onClick={() => toggleSection('currentUsers')}
                >
                  <span className="dropdown-icon">▼</span>
                  <span>Current Users</span>
                </button>
                {expandedSections.currentUsers && (
                  <div className="dropdown-content">
                    {loading ? (
                      <p className="loading-text">Loading users...</p>
                    ) : error ? (
                      <p className="error-text">{error}</p>
                    ) : users.length > 0 ? (
                      <div className="users-list">
                        {users.map((user) => (
                          <div key={user.id} className="user-item">
                            <div className="user-info">
                              <p><strong>Username:</strong> {user.username}</p>
                              <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                            </div>
                            
                            <div className="user-controls">
                              <div className="control-group">
                                <label>Role:</label>
                                <select 
                                  value={user.role || 'Admin'}
                                  onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                                  disabled={loading}
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Super Admin">Super Admin</option>
                                </select>
                              </div>
                              
                              <div className="control-group">
                                <label>Active:</label>
                                <div className="toggle-switch">
                                  <button
                                    className={`toggle-btn ${user.is_active ? 'active' : 'inactive'}`}
                                    onClick={() => handleUserActiveToggle(user.id, !user.is_active)}
                                    disabled={loading}
                                  >
                                    {user.is_active ? 'Yes' : 'No'}
                                  </button>
                                </div>
                              </div>

                              <div className="control-group">
                                <button
                                  className="trash-icon-btn"
                                  onClick={() => openDeleteConfirmation(user.id, user.username)}
                                  disabled={loading}
                                  title="Delete this user"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-text">No users found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Create New User Dropdown */}
              <div className={`dropdown-section ${expandedSections.createUser ? 'expanded' : ''}`}>
                <button 
                  className="dropdown-toggle"
                  onClick={() => toggleSection('createUser')}
                >
                  <span className="dropdown-icon">▼</span>
                  <span>Create New User</span>
                </button>
                {expandedSections.createUser && (
                  <div className="dropdown-content">
                    <form className="user-form" onSubmit={handleCreateUser}>
                      <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input 
                          type="text" 
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          placeholder="Enter username" 
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-wrapper">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter password" 
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="password-input-wrapper">
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm password" 
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            )}
                          </button>
                        </div>
                        {formData.password !== formData.confirmPassword && formData.confirmPassword !== '' && (
                          <p className="error-message">Passwords do not match</p>
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                          type="email" 
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter email" 
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading || formData.password !== formData.confirmPassword || !formData.password}>
                        {loading ? 'Creating...' : 'Create User'}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Audit Logs Dropdown */}
              <div className={`dropdown-section ${expandedSections.auditLogs ? 'expanded' : ''}`}>
                <button 
                  className="dropdown-toggle"
                  onClick={() => toggleSection('auditLogs')}
                >
                  <span className="dropdown-icon">▼</span>
                  <span>Audit Logs</span>
                </button>
                {expandedSections.auditLogs && (
                  <div className="dropdown-content">
                    {loading ? (
                      <p className="loading-text">Loading audit logs...</p>
                    ) : auditLogs.length > 0 ? (
                      <div className="audit-logs-table">
                        <table className="logs-table">
                          <thead>
                            <tr>
                              <th>Username</th>
                              <th>Target User</th>
                              <th>Action</th>
                              <th>Details</th>
                              <th>Date & Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.map((log, index) => (
                              <tr key={index}>
                                <td>{log.admin_username || 'System'}</td>
                                <td>{log.target_username}</td>
                                <td className={`action-badge ${log.action.toLowerCase()}`}>
                                  {log.action.replace(/_/g, ' ')}
                                </td>
                                <td className="details-cell">{log.details}</td>
                                <td className="date-cell">
                                  {new Date(log.created_at).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="no-logs">No audit logs available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmationModal.show && (
          <div className="modal-overlay" onClick={closeConfirmation}>
            <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
              <div className={`confirmation-icon ${confirmationModal.type}`}>
                {confirmationModal.type === 'success' ? '✓' : '!'}
              </div>
              <p className="confirmation-message">
                {confirmationModal.message}
              </p>
              <button 
                className="btn btn-primary confirmation-btn" 
                onClick={closeConfirmation}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div className="modal-overlay" onClick={closeDeleteConfirmation}>
            <div className="modal-content delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirmation-icon">🗑️</div>
              <p className="delete-confirmation-title">Delete User</p>
              <p className="delete-confirmation-message">
                Are you sure you want to Permanently Delete this User?
              </p>
              <p className="delete-confirmation-username">{deleteConfirmation.username}</p>
              <div className="delete-confirmation-buttons">
                <button 
                  className="btn btn-secondary" 
                  onClick={closeDeleteConfirmation}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleUserDelete(deleteConfirmation.userId)}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Settings;
