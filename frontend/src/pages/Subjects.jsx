import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { subjectService } from '../services/api';

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({
    code: '',
    name: '',
    units: '',
    hours_per_week: '',
    department: ''
  });

  useEffect(() => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentSubject.id) {
        await subjectService.update(currentSubject.id, currentSubject);
      } else {
        await subjectService.create(currentSubject);
      }
      setShowModal(false);
      setCurrentSubject({ code: '', name: '', units: '', hours_per_week: '', department: '' });
      loadSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };

  const handleEdit = (item) => {
    setCurrentSubject(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectService.delete(id);
        loadSubjects();
      } catch (error) {
        console.error('Error deleting subject:', error);
      }
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Subject Management</h1>
          <p>Manage subjects and course offerings</p>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add Subject
          </button>
        </div>

        <div className="card">
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
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No subjects found</td>
                </tr>
              ) : (
                subjects.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.units}</td>
                    <td>{item.hours_per_week}</td>
                    <td>{item.department}</td>
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
                <h2>{currentSubject.id ? 'Edit Subject' : 'Add Subject'}</h2>
              </div>
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
                  <input
                    type="text"
                    value={currentSubject.department}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, department: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowModal(false);
                    setCurrentSubject({ code: '', name: '', units: '', hours_per_week: '', department: '' });
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

export default Subjects;
