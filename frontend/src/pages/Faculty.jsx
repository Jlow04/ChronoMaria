import React, { useEffect, useMemo, useState } from 'react';
import { FaBuilding, FaChalkboardTeacher, FaStar } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { facultyService, subjectService } from '../services/api';
import './Faculty.css';

const emptyFaculty = {
  name: '',
  email: '',
  department: '',
  max_units: '',
  preferred_subjects: []
};

function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState(emptyFaculty);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);

  useEffect(() => {
    loadFaculty();
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadFaculty = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await facultyService.getAll();
      // Parse preferred_subjects from JSON string to array if needed
      const parsedData = data.map(item => ({
        ...item,
        preferred_subjects: typeof item.preferred_subjects === 'string' && item.preferred_subjects.trim()
          ? item.preferred_subjects.split(',').map(s => s.trim()).filter(Boolean)
          : Array.isArray(item.preferred_subjects) ? item.preferred_subjects : []
      }));
      setFaculty(parsedData);
    } catch (error) {
      console.error('Error loading faculty:', error);
      setError('Unable to load faculty right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const availableSubjects = useMemo(() => {
    const facultyDepartment = normalizeText(currentFaculty.department);
    if (!facultyDepartment) {
      return [];
    }

    return subjects.filter((subject) => {
      const subjectDepartment = normalizeText(subject.department);
      const isDepartmentMatch = subjectDepartment === facultyDepartment;
      const isCommonSubject = /common/.test(subjectDepartment);
      return isDepartmentMatch || isCommonSubject;
    });
  }, [subjects, currentFaculty.department]);

  const toggleSubjectSelection = (subjectId) => {
    const normalizedId = String(subjectId);
    setCurrentFaculty(prev => {
      const current = Array.isArray(prev.preferred_subjects) ? prev.preferred_subjects : [];
      const isSelected = current.includes(normalizedId);
      
      return {
        ...prev,
        preferred_subjects: isSelected
          ? current.filter(id => id !== normalizedId)
          : [...current, normalizedId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!String(currentFaculty.department || '').trim()) {
      setError('Please choose one department before saving.');
      return;
    }
    try {
      const dataToSubmit = {
        ...currentFaculty,
        // Convert array to comma-separated string for storage
        preferred_subjects: Array.isArray(currentFaculty.preferred_subjects) 
          ? currentFaculty.preferred_subjects.join(',')
          : currentFaculty.preferred_subjects
      };

      if (currentFaculty.id) {
        await facultyService.update(currentFaculty.id, dataToSubmit);
      } else {
        await facultyService.create(dataToSubmit);
      }
      setShowModal(false);
      setCurrentFaculty(emptyFaculty);
      setShowDepartmentPicker(false);
      setShowSubjectPicker(false);
      loadFaculty();
    } catch (error) {
      console.error('Error saving faculty:', error);
      setError('Unable to save faculty details. Please try again.');
    }
  };

  const handleEdit = (item) => {
    // Parse preferred_subjects as array when editing
    const parsed = {
      ...item,
      preferred_subjects: typeof item.preferred_subjects === 'string' && item.preferred_subjects.trim()
        ? item.preferred_subjects.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(item.preferred_subjects) ? item.preferred_subjects : []
    };
    setCurrentFaculty(parsed);
    setShowDepartmentPicker(false);
    setShowSubjectPicker(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      setError('');
      try {
        await facultyService.delete(id);
        loadFaculty();
      } catch (error) {
        console.error('Error deleting faculty:', error);
        setError('Unable to delete faculty at the moment.');
      }
    }
  };

  const departments = useMemo(() => {
    return Array.from(new Set(faculty.map((item) => String(item.department || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [faculty]);

  const departmentOptions = useMemo(() => {
    const fromFaculty = faculty.map((item) => String(item.department || '').trim()).filter(Boolean);
    const fromSubjects = subjects.map((item) => String(item.department || '').trim()).filter(Boolean);
    return Array.from(new Set([...fromFaculty, ...fromSubjects])).sort((a, b) => a.localeCompare(b));
  }, [faculty, subjects]);

  const averageMaxUnits = useMemo(() => {
    if (faculty.length === 0) {
      return 0;
    }
    const total = faculty.reduce((sum, item) => sum + (Number(item.max_units) || 0), 0);
    return (total / faculty.length).toFixed(1);
  }, [faculty]);

  const withPreferencesCount = useMemo(() => {
    return faculty.filter((item) => {
      const prefs = item.preferred_subjects;
      return Array.isArray(prefs) ? prefs.length > 0 : String(prefs || '').trim().length > 0;
    }).length;
  }, [faculty]);

  const filteredFaculty = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = faculty.filter((item) => {
      const matchesSearch = !keyword
        || String(item.name || '').toLowerCase().includes(keyword)
        || String(item.email || '').toLowerCase().includes(keyword)
        || String(item.department || '').toLowerCase().includes(keyword);
      const matchesDepartment = departmentFilter === 'all' || item.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });

    filtered.sort((a, b) => {
      const leftRaw = a[sortKey];
      const rightRaw = b[sortKey];
      const numericSort = sortKey === 'max_units';
      const left = numericSort ? Number(leftRaw || 0) : String(leftRaw || '').toLowerCase();
      const right = numericSort ? Number(rightRaw || 0) : String(rightRaw || '').toLowerCase();

      if (left < right) return sortDirection === 'asc' ? -1 : 1;
      if (left > right) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [faculty, searchTerm, departmentFilter, sortKey, sortDirection]);

  const resetFacultyModal = () => {
    setShowModal(false);
    setCurrentFaculty(emptyFaculty);
    setShowSubjectPicker(false);
    setShowDepartmentPicker(false);
  };

  const selectDepartment = (department) => {
    setCurrentFaculty((prev) => ({
      ...prev,
      department,
      preferred_subjects: prev.department === department ? prev.preferred_subjects : [],
    }));
    setShowDepartmentPicker(false);
    setShowSubjectPicker(false);
  };

  const selectedSubjectLabels = useMemo(() => {
    const selectedIds = Array.isArray(currentFaculty.preferred_subjects) ? currentFaculty.preferred_subjects : [];
    return selectedIds
      .map((id) => subjects.find((subject) => String(subject.id) === String(id)))
      .filter(Boolean)
      .map((subject) => `${subject.code} - ${subject.name}`);
  }, [currentFaculty.preferred_subjects, subjects]);

  return (
    <div className={`app ${showSubjectPicker ? 'subject-picker-open' : ''}`}>
      <Navbar />
      <div className="container page-content">
        <div className="page-header">
          <h1>Faculty Management</h1>
          <p>Manage faculty members and their information</p>
        </div>

        {error && <div className="faculty-alert">{error}</div>}

        <div className="faculty-overview">
          <div className="faculty-stat-card">
            <div className="faculty-stat-head">
              <span className="faculty-stat-icon"><FaChalkboardTeacher /></span>
              <p className="faculty-stat-label">Total Faculty</p>
            </div>
            <h3>{faculty.length}</h3>
          </div>
          <div className="faculty-stat-card">
            <div className="faculty-stat-head">
              <span className="faculty-stat-icon"><FaBuilding /></span>
              <p className="faculty-stat-label">Departments</p>
            </div>
            <h3>{departments.length}</h3>
          </div>
          <div className="faculty-stat-card">
            <div className="faculty-stat-head">
              <span className="faculty-stat-icon"><FaStar /></span>
              <p className="faculty-stat-label">With Preferences</p>
            </div>
            <h3>{withPreferencesCount}</h3>
            <p className="faculty-stat-subtext">Avg max units: {averageMaxUnits}</p>
          </div>
        </div>

        <div className="card faculty-toolbar-card">
          <div className="faculty-toolbar">
            <div className="faculty-search-wrap">
              <label htmlFor="faculty-search">Search</label>
              <input
                id="faculty-search"
                type="text"
                className="faculty-search-input"
                placeholder="Search name, email, or department"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="faculty-filter-wrap">
              <label htmlFor="faculty-department-filter">Department</label>
              <select
                id="faculty-department-filter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            <div className="faculty-filter-wrap">
              <label htmlFor="faculty-sort-key">Sort By</label>
              <select
                id="faculty-sort-key"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="department">Department</option>
                <option value="max_units">Max Units</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary faculty-sort-direction"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>

          <div className="actions faculty-actions">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add Faculty
            </button>
          </div>
        </div>

        <div className="card">
          <div className="faculty-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Max Units</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {loading ? (
                    <tr>
                        <td colSpan="5" className="faculty-empty-cell">Loading faculty...</td>
                    </tr>
                  ) : (
                      filteredFaculty.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="faculty-empty-cell">No faculty match your current filters.</td>
                        </tr>
                      ) : (
                      filteredFaculty.map(item => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.email}</td>
                            <td>{item.department}</td>
                            <td>{item.max_units}</td>
                            <td className="faculty-actions-cell">
                              <button className="btn btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                              <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                            </td>
                          </tr>
                    ))
                      )
                    )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{currentFaculty.id ? 'Edit Faculty' : 'Add Faculty'}</h2>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={currentFaculty.name}
                    onChange={(e) => setCurrentFaculty({ ...currentFaculty, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={currentFaculty.email}
                    onChange={(e) => setCurrentFaculty({ ...currentFaculty, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <button
                    type="button"
                    className="faculty-subjects-picker-btn"
                    onClick={() => setShowDepartmentPicker(true)}
                  >
                    {currentFaculty.department || 'Choose department'}
                  </button>
                </div>
                <div className="form-group">
                  <label>Max Units</label>
                  <input
                    type="number"
                    value={currentFaculty.max_units}
                    onChange={(e) => setCurrentFaculty({ ...currentFaculty, max_units: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Preferred Subjects</label>
                  <button
                    type="button"
                    className="faculty-subjects-picker-btn"
                    onClick={() => setShowSubjectPicker(true)}
                    disabled={!currentFaculty.department}
                  >
                    {selectedSubjectLabels.length > 0
                      ? `${selectedSubjectLabels.length} subject(s) selected`
                      : 'Choose preferred subjects'}
                  </button>
                  {!currentFaculty.department && (
                    <p className="faculty-subjects-hint">Select a department first to load subject choices.</p>
                  )}
                  {selectedSubjectLabels.length > 0 && (
                    <div className="faculty-selected-subjects">
                      {selectedSubjectLabels.map((label) => (
                        <span key={label} className="faculty-subject-tag">{label}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetFacultyModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal && showSubjectPicker && (
          <div className="modal-overlay" onClick={() => setShowSubjectPicker(false)}>
            <div className="modal-content faculty-subjects-picker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Preferred Subjects</h2>
              </div>
              <div className="faculty-subjects-picker-body">
                <p className="faculty-subjects-hint">
                  Available subjects for <strong>{currentFaculty.department}</strong> (including common subjects):
                </p>
                {availableSubjects.length === 0 ? (
                  <p className="faculty-subjects-empty">No matching subjects found.</p>
                ) : (
                  <div className="faculty-subjects-picker-list">
                    {availableSubjects.map((subject) => (
                      <label key={subject.id} className="faculty-subject-option">
                        <input
                          type="checkbox"
                          checked={Array.isArray(currentFaculty.preferred_subjects) && currentFaculty.preferred_subjects.includes(String(subject.id))}
                          onChange={() => toggleSubjectSelection(subject.id)}
                        />
                        <span>{subject.code} - {subject.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => setShowSubjectPicker(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && showDepartmentPicker && (
          <div className="modal-overlay" onClick={() => setShowDepartmentPicker(false)}>
            <div className="modal-content faculty-subjects-picker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Choose Department</h2>
              </div>
              <div className="faculty-subjects-picker-body">
                {departmentOptions.length === 0 ? (
                  <p className="faculty-subjects-empty">No departments available yet.</p>
                ) : (
                  <div className="faculty-subjects-picker-list">
                    {departmentOptions.map((department) => (
                      <label key={department} className="faculty-subject-option">
                        <input
                          type="checkbox"
                          checked={currentFaculty.department === department}
                          onChange={() => selectDepartment(department)}
                        />
                        <span className="faculty-department-option-content">
                          <span>{department}</span>
                          {currentFaculty.department === department && (
                            <span className="faculty-department-option-check" aria-hidden="true">✓</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => setShowDepartmentPicker(false)}>
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

export default Faculty;
