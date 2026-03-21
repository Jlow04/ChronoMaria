import React, { useEffect, useMemo, useState } from 'react';
import { FaBuilding, FaChalkboardTeacher, FaStar } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { facultyService } from '../services/api';
import './Faculty.css';

const emptyFaculty = {
  name: '',
  email: '',
  department: '',
  max_units: '',
  preferred_subjects: ''
};

function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState(emptyFaculty);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await facultyService.getAll();
      setFaculty(data);
    } catch (error) {
      console.error('Error loading faculty:', error);
      setError('Unable to load faculty right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (currentFaculty.id) {
        await facultyService.update(currentFaculty.id, currentFaculty);
      } else {
        await facultyService.create(currentFaculty);
      }
      setShowModal(false);
      setCurrentFaculty(emptyFaculty);
      loadFaculty();
    } catch (error) {
      console.error('Error saving faculty:', error);
      setError('Unable to save faculty details. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setCurrentFaculty(item);
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

  const averageMaxUnits = useMemo(() => {
    if (faculty.length === 0) {
      return 0;
    }
    const total = faculty.reduce((sum, item) => sum + (Number(item.max_units) || 0), 0);
    return (total / faculty.length).toFixed(1);
  }, [faculty]);

  const withPreferencesCount = useMemo(() => {
    return faculty.filter((item) => String(item.preferred_subjects || '').trim().length > 0).length;
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
  };

  return (
    <div className="app">
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
                ) : filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="faculty-empty-cell">No faculty match your current filters.</td>
                  </tr>
                ) : (
                  filteredFaculty.map((item) => (
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
                  <input
                    type="text"
                    value={currentFaculty.department}
                    onChange={(e) => setCurrentFaculty({ ...currentFaculty, department: e.target.value })}
                    required
                  />
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
                  <input
                    type="text"
                    value={currentFaculty.preferred_subjects}
                    onChange={(e) => setCurrentFaculty({ ...currentFaculty, preferred_subjects: e.target.value })}
                  />
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
      </div>
    </div>
  );
}

export default Faculty;
