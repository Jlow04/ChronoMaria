import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { roomService } from '../services/api';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({
    room_number: '',
    building: '',
    capacity: '',
    type: ''
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomService.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentRoom.id) {
        await roomService.update(currentRoom.id, currentRoom);
      } else {
        await roomService.create(currentRoom);
      }
      setShowModal(false);
      setCurrentRoom({ room_number: '', building: '', capacity: '', type: '' });
      loadRooms();
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleEdit = (item) => {
    setCurrentRoom(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomService.delete(id);
        loadRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Room Management</h1>
          <p>Manage classroom and room assignments</p>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add Room
          </button>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Building</th>
                <th>Capacity</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No rooms found</td>
                </tr>
              ) : (
                rooms.map((item) => (
                  <tr key={item.id}>
                    <td>{item.room_number}</td>
                    <td>{item.building}</td>
                    <td>{item.capacity}</td>
                    <td>{item.type}</td>
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
                <h2>{currentRoom.id ? 'Edit Room' : 'Add Room'}</h2>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Room Number</label>
                  <input
                    type="text"
                    value={currentRoom.room_number}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, room_number: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Building</label>
                  <input
                    type="text"
                    value={currentRoom.building}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, building: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    type="number"
                    value={currentRoom.capacity}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={currentRoom.type}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, type: e.target.value })}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Classroom">Classroom</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowModal(false);
                    setCurrentRoom({ room_number: '', building: '', capacity: '', type: '' });
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

export default Rooms;
