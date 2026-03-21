import React, { useEffect, useMemo, useState } from 'react';
import { FaBookOpen, FaClock, FaSitemap } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { subjectService } from '../services/api';
import './Subjects.css';

const emptySubject = {
  code: '',
  name: '',
  units: '',
  hours_per_week: '',
  department: ''
};

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(emptySubject);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [departmentPrompt, setDepartmentPrompt] = useState('');
  const [shakeDepartmentPicker, setShakeDepartmentPicker] = useState(false);
  const [mainModalPrompt, setMainModalPrompt] = useState('');
  const [shakeMainModal, setShakeMainModal] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      setError('Unable to load subjects right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!String(currentSubject.department || '').trim()) {
      setError('Please choose one department before saving.');
      return;
    }
    try {
      if (currentSubject.id) {
        await subjectService.update(currentSubject.id, currentSubject);
      } else {
        await subjectService.create(currentSubject);
      }
      setShowModal(false);
      setCurrentSubject(emptySubject);
      setShowDepartmentPicker(false);
      loadSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      setError('Unable to save subject. Please verify details and try again.');
    }
  };

  const handleEdit = (item) => {
    setCurrentSubject(item);
    setShowDepartmentPicker(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      setError('');
      try {
        await subjectService.delete(id);
        loadSubjects();
      } catch (error) {
        console.error('Error deleting subject:', error);
        setError('Unable to delete subject at the moment.');
      }
    }
  };

  const departments = useMemo(() => {
    return Array.from(new Set(subjects.map((item) => String(item.department || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [subjects]);

  const totalWeeklyHours = useMemo(() => {
    return subjects.reduce((sum, item) => sum + (Number(item.hours_per_week) || 0), 0);
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = subjects.filter((item) => {
      const matchesSearch = !keyword
        || String(item.code || '').toLowerCase().includes(keyword)
        || String(item.name || '').toLowerCase().includes(keyword)
        || String(item.department || '').toLowerCase().includes(keyword);
      const matchesDepartment = departmentFilter === 'all' || item.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });

    filtered.sort((a, b) => {
      const leftRaw = a[sortKey];
      const rightRaw = b[sortKey];
      const left = typeof leftRaw === 'number' ? leftRaw : String(leftRaw || '').toLowerCase();
      const right = typeof rightRaw === 'number' ? rightRaw : String(rightRaw || '').toLowerCase();

      if (left < right) return sortDirection === 'asc' ? -1 : 1;
      if (left > right) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [subjects, searchTerm, departmentFilter, sortKey, sortDirection]);

  const resetSubjectModal = () => {
    setShowModal(false);
    setCurrentSubject(emptySubject);
    setShowDepartmentPicker(false);
    setDepartmentPrompt('');
    setMainModalPrompt('');
  };

  const triggerSubjectModalAttention = () => {
    setMainModalPrompt('Please finish this window first before returning to the page.');
    setShakeMainModal(true);
    setTimeout(() => setShakeMainModal(false), 380);
  };

  const triggerDepartmentAttention = () => {
    setDepartmentPrompt('Please finish this window first before returning to the page.');
    setShakeDepartmentPicker(true);
    setTimeout(() => setShakeDepartmentPicker(false), 380);
  };

  const selectDepartment = (department) => {
    setCurrentSubject((prev) => ({
      ...prev,
      department,
    }));
    setShowDepartmentPicker(false);
  };

  return (
    <div className="app">
      <Navbar />
      <div className="container page-content">
        <div className="page-header">
          <h1>Subject Management</h1>
          <p>Manage subjects and course offerings</p>
        </div>

        {error && <div className="subjects-alert">{error}</div>}

        <div className="subjects-overview">
          <div className="subjects-stat-card">
            <div className="subjects-stat-head">
              <span className="subjects-stat-icon"><FaBookOpen /></span>
              <p className="subjects-stat-label">Total Subjects</p>
            </div>
            <h3>{subjects.length}</h3>
          </div>
          <div className="subjects-stat-card">
            <div className="subjects-stat-head">
              <span className="subjects-stat-icon"><FaClock /></span>
              <p className="subjects-stat-label">Hours per Week (All)</p>
            </div>
            <h3>{totalWeeklyHours}</h3>
          </div>
          <div className="subjects-stat-card">
            <div className="subjects-stat-head">
              <span className="subjects-stat-icon"><FaSitemap /></span>
              <p className="subjects-stat-label">Departments</p>
            </div>
            <h3>{departments.length}</h3>
          </div>
        </div>

        <div className="card subjects-toolbar-card">
          <div className="subjects-toolbar">
            <div className="subjects-search-wrap">
              <label htmlFor="subjects-search">Search</label>
              <input
                id="subjects-search"
                type="text"
                className="subjects-search-input"
                placeholder="Search code, name, or department"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="subjects-filter-wrap">
              <label htmlFor="subjects-department-filter">Department</label>
              <select
                id="subjects-department-filter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            <div className="subjects-filter-wrap">
              <label htmlFor="subjects-sort-key">Sort By</label>
              <select
                id="subjects-sort-key"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="code">Code</option>
                <option value="department">Department</option>
                <option value="units">Units</option>
                <option value="hours_per_week">Hours/Week</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary subjects-sort-direction"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>

          <div className="actions subjects-actions">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add Subject
            </button>
          </div>
        </div>

        <div className="card">
          <div className="subjects-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Units</th>
                  <th>Hours/Week</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="subjects-empty-cell">Loading subjects...</td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="subjects-empty-cell">No subjects match your current filters.</td>
                  </tr>
                ) : (
                  filteredSubjects.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td>{item.units}</td>
                      <td>{item.hours_per_week}</td>
                      <td>{item.department}</td>
                      <td className="subjects-actions-cell">
                        <button className="btn btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal" onClick={triggerSubjectModalAttention}>
            <div className={`modal-content ${shakeMainModal ? 'modal-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{currentSubject.id ? 'Edit Subject' : 'Add Subject'}</h2>
              </div>
              {mainModalPrompt && <p className="modal-focus-prompt">{mainModalPrompt}</p>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Code</label>
                  <input
                    type="text"
                    value={currentSubject.code}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, code: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={currentSubject.name}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Units</label>
                  <input
                    type="number"
                    value={currentSubject.units}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, units: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hours per Week</label>
                  <input
                    type="number"
                    value={currentSubject.hours_per_week}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, hours_per_week: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <button
                    type="button"
                    className="subjects-department-picker-btn"
                    onClick={() => setShowDepartmentPicker(true)}
                  >
                    {currentSubject.department || 'Choose department'}
                  </button>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetSubjectModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal && showDepartmentPicker && (
          <div className="modal-overlay" onClick={triggerDepartmentAttention}>
            <div className={`modal-content subjects-department-picker-modal ${shakeDepartmentPicker ? 'modal-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Choose Department</h2>
              </div>
              {departmentPrompt && <p className="modal-focus-prompt">{departmentPrompt}</p>}
              <div className="subjects-department-picker-body">
                {departments.length === 0 ? (
                  <p className="subjects-department-empty">No departments available yet.</p>
                ) : (
                  <div className="subjects-department-picker-list">
                    {departments.map((department) => (
                      <label key={department} className="subjects-department-option">
                        <input
                          type="checkbox"
                          checked={currentSubject.department === department}
                          onChange={() => selectDepartment(department)}
                        />
                        <span className="subjects-department-option-content">
                          <span>{department}</span>
                          {currentSubject.department === department && (
                            <span className="subjects-department-option-check" aria-hidden="true">✓</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => {
                  setDepartmentPrompt('');
                  setShowDepartmentPicker(false);
                }}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subjects;
