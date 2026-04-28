import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { userService, auditLogService } from '../services/api';
import {
  getScheduleSettings,
  normalizeScheduleSettings,
  resetScheduleSettings,
  saveScheduleSettings,
} from '../services/scheduleSettings';
import './Settings.css';

function Settings() {
  const [expandedSections, setExpandedSections] = useState({
    currentUsers: false,
    createUser: false,
    scheduleConfig: false,
    auditLogs: false,
    helpManual: false
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
  const [scheduleConfig, setScheduleConfig] = useState(getScheduleSettings());
  const [scheduleConfigMessage, setScheduleConfigMessage] = useState('');
  const [activeScheduleInfo, setActiveScheduleInfo] = useState('');
  const [overlayPrompt, setOverlayPrompt] = useState('');
  const [shakeConfirmationModal, setShakeConfirmationModal] = useState(false);
  const [shakeDeleteModal, setShakeDeleteModal] = useState(false);

  const smuEmailPattern = /^hed-[a-z0-9._-]{2,}@smu\.edu\.ph$/i;
  const trimmedEmail = formData.email.trim();
  const passwordChecks = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password),
  };
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const isPasswordMatch = formData.password !== '' && formData.password === formData.confirmPassword;
  const isSmuEmailValid = smuEmailPattern.test(trimmedEmail);
  const canSubmitCreateUser =
    !loading &&
    formData.username.trim() !== '' &&
    isPasswordStrong &&
    isPasswordMatch &&
    isSmuEmailValid;

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
    if (!isPasswordStrong) {
      showConfirmation('error', 'Password does not meet all required guidelines.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showConfirmation('error', 'Passwords do not match!');
      return;
    }
    if (!isSmuEmailValid) {
      showConfirmation('error', 'Please enter a valid SMU corporate email (hed-__@smu.edu.ph).');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const currentUsername = getCurrentUser();
      await userService.create(formData.username, formData.password, trimmedEmail, currentUsername);
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
    setOverlayPrompt('');
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
    setOverlayPrompt('');
  };

  const triggerSettingsOverlayAttention = (type) => {
    setOverlayPrompt('Please finish this window first before returning to the page.');
    if (type === 'confirmation') {
      setShakeConfirmationModal(true);
      setTimeout(() => setShakeConfirmationModal(false), 380);
      return;
    }
    setShakeDeleteModal(true);
    setTimeout(() => setShakeDeleteModal(false), 380);
  };

  const handleScheduleConfigChange = (field, value) => {
    setScheduleConfig(prev => {
      const next = {
        ...prev,
        [field]: value,
      };
      return next;
    });
    setScheduleConfigMessage('');
  };

  const handleSaveScheduleConfig = () => {
    const normalized = saveScheduleSettings(scheduleConfig);
    setScheduleConfig(normalized);
    setScheduleConfigMessage('Schedule configuration saved.');
  };

  const handleResetScheduleConfig = () => {
    const defaults = resetScheduleSettings();
    setScheduleConfig(defaults);
    setScheduleConfigMessage('Schedule configuration reset to defaults.');
  };

  const toggleScheduleInfo = (field) => {
    setActiveScheduleInfo((prev) => (prev === field ? '' : field));
  };

  const schedulePreview = normalizeScheduleSettings(scheduleConfig);

  const scheduleInfoContent = {
    max_generations: {
      label: 'Max Generations',
      description: 'Controls how many improvement cycles the algorithm can run before stopping.',
      impact: schedulePreview.max_generations < 100
        ? 'Lower value is faster but may stop before finding a better schedule.'
        : 'Higher value explores more combinations and may improve schedule quality at the cost of extra time.',
    },
    population_size: {
      label: 'Population Size',
      description: 'Sets how many candidate schedules are evaluated in each generation.',
      impact: schedulePreview.population_size < 40
        ? 'Smaller populations run faster but reduce variety, which can miss stronger solutions.'
        : 'Larger populations improve variety and stability but increase processing time per generation.',
    },
    mutation_rate: {
      label: 'Mutation Rate',
      description: 'Determines how much random variation is introduced to candidate schedules.',
      impact: schedulePreview.mutation_rate < 0.08
        ? 'Lower mutation keeps solutions stable but can get stuck in local optima.'
        : 'Higher mutation improves exploration but too much can make convergence noisy.',
    },
    max_runtime_seconds: {
      label: 'Max Runtime',
      description: 'Hard time limit for each scheduling run, even if generations are not yet complete.',
      impact: schedulePreview.max_runtime_seconds < 20
        ? 'Short runtime gives quick results, but complex loads may end early.'
        : 'Longer runtime allows deeper search when load constraints are harder to satisfy.',
    },
  };

  const helpSections = [
    {
      key: 'faculty',
      title: 'Faculty',
      summary: 'Use the Faculty page to manage instructors, filter them by department, and assign preferred subjects before generating schedules.',
      steps: [
        'Open Faculty to add or edit an instructor profile.',
        'Choose the department first so the subject picker only shows matching subjects.',
        'Use Edit and Delete carefully because they update the records used by schedule generation.',
      ],
      tips: [
        'Keep max units realistic so the scheduler does not overload a faculty member.',
        'Add preferred subjects only after the department is set.',
      ],
    },
    {
      key: 'subjects',
      title: 'Subjects',
      summary: 'Subjects define the course load that the scheduler can place into the timetable.',
      steps: [
        'Add all active subjects before generating a schedule.',
        'Include the correct department and weekly hours for each subject.',
        'Use the search and filter tools to keep the subject list organized.',
      ],
      tips: [
        'A complete subject list improves schedule quality.',
        'Department mismatches can prevent the scheduler from finding valid matches.',
      ],
    },
    {
      key: 'rooms',
      title: 'Rooms',
      summary: 'Rooms provide the physical space constraints that the scheduler uses when building the final timetable.',
      steps: [
        'Add each available room with the correct building and capacity.',
        'Choose the room type so the schedule stays realistic.',
        'Remove or update rooms only when the inventory changes.',
      ],
      tips: [
        'If room capacity is too small, some subjects may not fit.',
        'Keep room records current before each new schedule run.',
      ],
    },
    {
      key: 'schedule',
      title: 'Schedule',
      summary: 'Schedule generation combines faculty, subjects, rooms, and settings into one optimized output.',
      steps: [
        'Confirm that faculty, subjects, and rooms are complete first.',
        'Review the schedule settings if you want a faster or deeper search.',
        'Hover over Generate Schedule for a quick reminder, then click it to run the algorithm.',
      ],
      tips: [
        'Higher generations and population values can improve quality but may take longer.',
        'Use Print Generated List after a schedule is created for reporting or records.',
      ],
    },
    {
      key: 'users',
      title: 'Users & Security',
      summary: 'The Settings area is also where admins manage users, audit logs, and schedule configuration.',
      steps: [
        'Use Current Users to change roles, toggle active status, or delete a user.',
        'Create New User with a valid SMU corporate email and a strong password.',
        'Use Audit Logs to verify who changed what and when.',
      ],
      tips: [
        'Save schedule settings after changing values so they are applied immediately.',
        'If you need a password reminder, the create-user section shows the validation rules.',
      ],
    },
  ];

  return (
    <div className="app">
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
                        <ul className="password-guidelines" aria-live="polite">
                          <li className={passwordChecks.minLength ? 'met' : 'unmet'}>
                            <span className="guide-check">{passwordChecks.minLength ? '✓' : '○'}</span>
                            At least 8 characters
                          </li>
                          <li className={passwordChecks.hasUppercase ? 'met' : 'unmet'}>
                            <span className="guide-check">{passwordChecks.hasUppercase ? '✓' : '○'}</span>
                            At least 1 uppercase letter
                          </li>
                          <li className={passwordChecks.hasLowercase ? 'met' : 'unmet'}>
                            <span className="guide-check">{passwordChecks.hasLowercase ? '✓' : '○'}</span>
                            At least 1 lowercase letter
                          </li>
                          <li className={passwordChecks.hasNumber ? 'met' : 'unmet'}>
                            <span className="guide-check">{passwordChecks.hasNumber ? '✓' : '○'}</span>
                            At least 1 number
                          </li>
                          <li className={passwordChecks.hasSpecial ? 'met' : 'unmet'}>
                            <span className="guide-check">{passwordChecks.hasSpecial ? '✓' : '○'}</span>
                            At least 1 special character
                          </li>
                        </ul>
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
                          placeholder="hed-__@smu.edu.ph"
                          required
                        />
                        <p className={`email-guide ${isSmuEmailValid ? 'met' : 'unmet'}`}>
                          <span className="guide-check">{isSmuEmailValid ? '✓' : '○'}</span>
                          Must match SMU corporate format: hed-__@smu.edu.ph
                        </p>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={!canSubmitCreateUser}>
                        {loading ? 'Creating...' : 'Create User'}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div className={`dropdown-section ${expandedSections.scheduleConfig ? 'expanded' : ''}`}>
                <button
                  className="dropdown-toggle"
                  onClick={() => toggleSection('scheduleConfig')}
                >
                  <span className="dropdown-icon">▼</span>
                  <span>Schedule Configuration</span>
                </button>
                {expandedSections.scheduleConfig && (
                  <div className="dropdown-content">
                    <div className="schedule-config-grid">
                      <div className="form-group">
                        <div className="setting-label-row">
                          <label htmlFor="schedule-max-generations">Max Generations</label>
                          <button
                            type="button"
                            className={`setting-info-btn ${activeScheduleInfo === 'max_generations' ? 'active' : ''}`}
                            onClick={() => toggleScheduleInfo('max_generations')}
                            aria-label="About Max Generations"
                            title="About Max Generations"
                          >
                            i
                          </button>
                        </div>
                        <input
                          id="schedule-max-generations"
                          type="number"
                          min="20"
                          max="1000"
                          value={scheduleConfig.max_generations}
                          onChange={(e) => handleScheduleConfigChange('max_generations', e.target.value)}
                        />
                        {activeScheduleInfo === 'max_generations' && (
                          <div className="setting-info-popover" role="status" aria-live="polite">
                            <p className="setting-info-title">{scheduleInfoContent.max_generations.label}</p>
                            <p>{scheduleInfoContent.max_generations.description}</p>
                            <p><strong>Current value:</strong> {schedulePreview.max_generations}</p>
                            <p>{scheduleInfoContent.max_generations.impact}</p>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <div className="setting-label-row">
                          <label htmlFor="schedule-population-size">Population Size</label>
                          <button
                            type="button"
                            className={`setting-info-btn ${activeScheduleInfo === 'population_size' ? 'active' : ''}`}
                            onClick={() => toggleScheduleInfo('population_size')}
                            aria-label="About Population Size"
                            title="About Population Size"
                          >
                            i
                          </button>
                        </div>
                        <input
                          id="schedule-population-size"
                          type="number"
                          min="10"
                          max="300"
                          value={scheduleConfig.population_size}
                          onChange={(e) => handleScheduleConfigChange('population_size', e.target.value)}
                        />
                        {activeScheduleInfo === 'population_size' && (
                          <div className="setting-info-popover" role="status" aria-live="polite">
                            <p className="setting-info-title">{scheduleInfoContent.population_size.label}</p>
                            <p>{scheduleInfoContent.population_size.description}</p>
                            <p><strong>Current value:</strong> {schedulePreview.population_size}</p>
                            <p>{scheduleInfoContent.population_size.impact}</p>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <div className="setting-label-row">
                          <label htmlFor="schedule-mutation-rate">Mutation Rate</label>
                          <button
                            type="button"
                            className={`setting-info-btn ${activeScheduleInfo === 'mutation_rate' ? 'active' : ''}`}
                            onClick={() => toggleScheduleInfo('mutation_rate')}
                            aria-label="About Mutation Rate"
                            title="About Mutation Rate"
                          >
                            i
                          </button>
                        </div>
                        <input
                          id="schedule-mutation-rate"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="0.5"
                          value={scheduleConfig.mutation_rate}
                          onChange={(e) => handleScheduleConfigChange('mutation_rate', e.target.value)}
                        />
                        {activeScheduleInfo === 'mutation_rate' && (
                          <div className="setting-info-popover" role="status" aria-live="polite">
                            <p className="setting-info-title">{scheduleInfoContent.mutation_rate.label}</p>
                            <p>{scheduleInfoContent.mutation_rate.description}</p>
                            <p><strong>Current value:</strong> {schedulePreview.mutation_rate}</p>
                            <p>{scheduleInfoContent.mutation_rate.impact}</p>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <div className="setting-label-row">
                          <label htmlFor="schedule-max-runtime">Max Runtime (seconds)</label>
                          <button
                            type="button"
                            className={`setting-info-btn ${activeScheduleInfo === 'max_runtime_seconds' ? 'active' : ''}`}
                            onClick={() => toggleScheduleInfo('max_runtime_seconds')}
                            aria-label="About Max Runtime"
                            title="About Max Runtime"
                          >
                            i
                          </button>
                        </div>
                        <input
                          id="schedule-max-runtime"
                          type="number"
                          min="5"
                          max="180"
                          value={scheduleConfig.max_runtime_seconds}
                          onChange={(e) => handleScheduleConfigChange('max_runtime_seconds', e.target.value)}
                        />
                        {activeScheduleInfo === 'max_runtime_seconds' && (
                          <div className="setting-info-popover" role="status" aria-live="polite">
                            <p className="setting-info-title">{scheduleInfoContent.max_runtime_seconds.label}</p>
                            <p>{scheduleInfoContent.max_runtime_seconds.description}</p>
                            <p><strong>Current value:</strong> {schedulePreview.max_runtime_seconds}s</p>
                            <p>{scheduleInfoContent.max_runtime_seconds.impact}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="schedule-preview-card">
                      <p><strong>Applied Preview</strong></p>
                      <p>Generations: {schedulePreview.max_generations}</p>
                      <p>Population: {schedulePreview.population_size}</p>
                      <p>Mutation: {schedulePreview.mutation_rate}</p>
                      <p>Runtime: {schedulePreview.max_runtime_seconds}s</p>
                    </div>

                    {scheduleConfigMessage && <p className="schedule-config-message">{scheduleConfigMessage}</p>}

                    <div className="schedule-config-actions">
                      <button type="button" className="btn btn-secondary" onClick={handleResetScheduleConfig}>
                        Reset Defaults
                      </button>
                      <button type="button" className="btn btn-primary" onClick={handleSaveScheduleConfig}>
                        Save Configuration
                      </button>
                    </div>
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

              <div className={`dropdown-section help-section ${expandedSections.helpManual ? 'expanded' : ''}`}>
                <button
                  className="dropdown-toggle"
                  onClick={() => toggleSection('helpManual')}
                >
                  <span className="dropdown-icon">▼</span>
                  <span>Help & Documentation</span>
                </button>
                {expandedSections.helpManual && (
                  <div className="dropdown-content help-content">
                    <div className="help-intro-card">
                      <p className="help-intro-title">Quick guide to the main features</p>
                      <p>
                        Use this section when you need a reminder about how the system fits together.
                        The pages below are the ones most people use when building and maintaining schedules.
                      </p>
                    </div>

                    <div className="help-grid">
                      {helpSections.map((section) => (
                        <article key={section.key} className="help-card">
                          <h3>{section.title}</h3>
                          <p className="help-summary">{section.summary}</p>

                          <div className="help-block">
                            <h4>How to use it</h4>
                            <ol>
                              {section.steps.map((step) => (
                                <li key={step}>{step}</li>
                              ))}
                            </ol>
                          </div>

                          <div className="help-block help-tips">
                            <h4>Tips</h4>
                            <ul>
                              {section.tips.map((tip) => (
                                <li key={tip}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmationModal.show && (
          <div className="modal-overlay" onClick={() => triggerSettingsOverlayAttention('confirmation')}>
            <div className={`modal-content confirmation-modal ${shakeConfirmationModal ? 'modal-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
              {overlayPrompt && <p className="modal-focus-prompt">{overlayPrompt}</p>}
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
          <div className="modal-overlay" onClick={() => triggerSettingsOverlayAttention('delete')}>
            <div className={`modal-content delete-confirmation-modal ${shakeDeleteModal ? 'modal-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
              {overlayPrompt && <p className="modal-focus-prompt">{overlayPrompt}</p>}
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
    </div>
  );
}

export default Settings;
