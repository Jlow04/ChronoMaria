import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { facultyService } from '../services/api';

function Faculty() {
  const [faculty, setFaculty] = useState([]);
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
  }, []);

  const loadFaculty = async () => {
    try {
      const data = await facultyService.getAll();
      setFaculty(data);
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

        <div className="card">
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
