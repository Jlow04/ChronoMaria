import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { facultyService } from '../services/api';

const normalize = (value = '') => value.toLowerCase().trim();

const facultySearchText = (item) => normalize(`${item.name || ''} ${item.email || ''} ${item.department || ''}`);

const levenshteinDistance = (a, b) => {
  const s = normalize(a);
  const t = normalize(b);

  if (!s.length) return t.length;
  if (!t.length) return s.length;

  const matrix = Array.from({ length: s.length + 1 }, () => Array(t.length + 1).fill(0));

  for (let i = 0; i <= s.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= t.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[s.length][t.length];
};

const getMatchScore = (item, query) => {
  const q = normalize(query);
  if (!q) return 0;

  const text = facultySearchText(item);
  if (!text) return 0;

  if (text.startsWith(q)) return 1;

  const includeIndex = text.indexOf(q);
  if (includeIndex >= 0) {
    return 0.9 - Math.min(includeIndex * 0.01, 0.3);
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;

  let bestScore = 0;
  for (const word of words) {
    const distance = levenshteinDistance(q, word);
    const maxLen = Math.max(q.length, word.length);
    const score = maxLen ? 1 - distance / maxLen : 0;
    if (score > bestScore) {
      bestScore = score;
    }
  }

  return bestScore * 0.85;
};

const getClosestMatches = (items, query, limit = 25) => {
  const threshold = 0.4;
  return items
    .map((item) => ({ item, score: getMatchScore(item, query) }))
    .filter((entry) => entry.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
};

const sortFacultyList = (items, sortBy, sortOrder) => {
  const sorted = [...items];
  const direction = sortOrder === 'desc' ? -1 : 1;

  sorted.sort((a, b) => {
    const aValue = a?.[sortBy];
    const bValue = b?.[sortBy];

    if (sortBy === 'max_units' || sortBy === 'id') {
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      return (aNum - bNum) * direction;
    }

    const aText = String(aValue || '').toLowerCase();
    const bText = String(bValue || '').toLowerCase();
    return aText.localeCompare(bText) * direction;
  });

  return sorted;
};

const getDirectMatches = (items, query) => {
  const term = normalize(query);
  if (!term) return items;

  return items.filter((item) => facultySearchText(item).includes(term));
};

function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState({
    name: '',
    email: '',
    department: '',
    max_units: '',
    preferred_subjects: ''
  });

  useEffect(() => {
    loadFaculty();
  }, [searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const query = searchInput.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    setSuggestions(getClosestMatches(allFaculty, query, 5));
  }, [searchInput, allFaculty]);

  const loadFaculty = async () => {
    try {
      const options = { sortBy, sortOrder };

      const data = await facultyService.getAll(options);
      const sortedData = sortFacultyList(data, sortBy, sortOrder);
      setAllFaculty(sortedData);

      if (!searchQuery) {
        setFaculty(sortedData);
        return;
      }

      const directMatches = getDirectMatches(sortedData, searchQuery);
      if (directMatches.length > 0) {
        setFaculty(directMatches);
        return;
      }

      setFaculty(sortFacultyList(getClosestMatches(sortedData, searchQuery), sortBy, sortOrder));
    } catch (error) {
      console.error('Error loading faculty:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentFaculty.id) {
        await facultyService.update(currentFaculty.id, currentFaculty);
      } else {
        await facultyService.create(currentFaculty);
      }
      setShowModal(false);
      setCurrentFaculty({ name: '', email: '', department: '', max_units: '', preferred_subjects: '' });
      loadFaculty();
    } catch (error) {
      console.error('Error saving faculty:', error);
    }
  };

  const handleEdit = (item) => {
    setCurrentFaculty(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await facultyService.delete(id);
        loadFaculty();
      } catch (error) {
        console.error('Error deleting faculty:', error);
      }
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const applySuggestion = (item) => {
    setSearchInput(item.name || '');
    setSearchQuery(item.name || '');
    setSuggestions([]);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(column);
    setSortOrder('asc');
  };

  const sortIndicator = (column) => {
    if (sortBy !== column) {
      return '↕';
    }

    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Faculty Management</h1>
          <p>Manage faculty members and their information</p>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add Faculty
          </button>
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '260px', flex: '1', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search name, email, or department"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{ width: '100%' }}
              />
              {suggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid rgba(171, 209, 255, 0.9)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 24px rgba(40, 75, 120, 0.14)',
                    zIndex: 20,
                    overflow: 'hidden'
                  }}
                >
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => applySuggestion(item)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(171, 209, 255, 0.4)',
                        padding: '10px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#4a6585' }}>{item.department} • {item.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
            <button className="btn btn-secondary" onClick={clearSearch}>Clear</button>
          </div>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Sort by Name"
                >
                  Name {sortIndicator('name')}
                </th>
                <th
                  onClick={() => handleSort('email')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Sort by Email"
                >
                  Email {sortIndicator('email')}
                </th>
                <th
                  onClick={() => handleSort('department')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Sort by Department"
                >
                  Department {sortIndicator('department')}
                </th>
                <th
                  onClick={() => handleSort('max_units')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Sort by Max Units"
                >
                  Max Units {sortIndicator('max_units')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No faculty members found</td>
                </tr>
              ) : (
                faculty.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.department}</td>
                    <td>{item.max_units}</td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                      {' '}
                      <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowModal(false);
                    setCurrentFaculty({ name: '', email: '', department: '', max_units: '', preferred_subjects: '' });
                  }}>
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
