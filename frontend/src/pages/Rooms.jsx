import React, { useEffect, useMemo, useState } from 'react';
import { FaDoorOpen, FaFlask, FaUsers } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { roomService } from '../services/api';
import './Rooms.css';

const emptyRoom = {
  room_code: '',
  description: '',
  capacity: '',
  department: '',
  room_type: '',
  subject_type: '',
  status: 'Available',
  common_room: false,
};

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(emptyRoom);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState('room_code');
  const [sortDirection, setSortDirection] = useState('asc');
  const [modalPrompt, setModalPrompt] = useState('');
  const [shakeMainModal, setShakeMainModal] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await roomService.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setError('Unable to load rooms right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (currentRoom.id) {
        await roomService.update(currentRoom.id, currentRoom);
      } else {
        await roomService.create(currentRoom);
      }
      setShowModal(false);
      setCurrentRoom(emptyRoom);
      loadRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      setError('Unable to save room details. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setCurrentRoom(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      setError('');
      try {
        await roomService.delete(id);
        loadRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
        setError('Unable to delete room at the moment.');
      }
    }
  };

  const roomTypes = useMemo(() => {
    return Array.from(new Set(rooms.map((item) => String(item.room_type || item.type || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [rooms]);

  const totalCapacity = useMemo(() => {
    return rooms.reduce((sum, item) => sum + (Number(item.capacity) || 0), 0);
  }, [rooms]);

  const labRooms = useMemo(() => {
    return rooms.filter((item) => String(item.room_type || item.type || '').toLowerCase().includes('lab')).length;
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = rooms.filter((item) => {
      const matchesSearch = !keyword
        || String(item.room_number || '').toLowerCase().includes(keyword)
        || String(item.room_code || '').toLowerCase().includes(keyword)
        || String(item.building || item.description || '').toLowerCase().includes(keyword)
        || String(item.type || item.room_type || '').toLowerCase().includes(keyword)
        || String(item.room_department || item.department || '').toLowerCase().includes(keyword)
        || String(item.subject_type || '').toLowerCase().includes(keyword);
      const matchesType = typeFilter === 'all' || (item.room_type || item.type) === typeFilter;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      const leftRaw = a[sortKey];
      const rightRaw = b[sortKey];
      const numericSort = sortKey === 'capacity';
      const left = numericSort ? Number(leftRaw || 0) : String(leftRaw || '').toLowerCase();
      const right = numericSort ? Number(rightRaw || 0) : String(rightRaw || '').toLowerCase();

      if (left < right) return sortDirection === 'asc' ? -1 : 1;
      if (left > right) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rooms, searchTerm, typeFilter, sortKey, sortDirection]);

  const resetRoomModal = () => {
    setShowModal(false);
    setCurrentRoom(emptyRoom);
    setModalPrompt('');
  };

  const triggerRoomModalAttention = () => {
    setModalPrompt('Please finish this window first before returning to the page.');
    setShakeMainModal(true);
    setTimeout(() => setShakeMainModal(false), 380);
  };

  return (
    <div className="app">
      <Navbar />
      <div className="container page-content">
        <div className="page-header">
          <h1>Room Management</h1>
          <p>Manage classroom and room assignments</p>
        </div>

        {error && <div className="rooms-alert">{error}</div>}

        <div className="rooms-overview">
          <div className="rooms-stat-card">
            <div className="rooms-stat-head">
              <span className="rooms-stat-icon"><FaDoorOpen /></span>
              <p className="rooms-stat-label">Total Rooms</p>
            </div>
            <h3>{rooms.length}</h3>
          </div>
          <div className="rooms-stat-card">
            <div className="rooms-stat-head">
              <span className="rooms-stat-icon"><FaUsers /></span>
              <p className="rooms-stat-label">Total Capacity</p>
            </div>
            <h3>{totalCapacity}</h3>
          </div>
          <div className="rooms-stat-card">
            <div className="rooms-stat-head">
              <span className="rooms-stat-icon"><FaFlask /></span>
              <p className="rooms-stat-label">Lab Rooms</p>
            </div>
            <h3>{labRooms}</h3>
          </div>
        </div>

        <div className="card rooms-toolbar-card">
          <div className="rooms-toolbar">
            <div className="rooms-search-wrap">
              <label htmlFor="rooms-search">Search</label>
              <input
                id="rooms-search"
                type="text"
                className="rooms-search-input"
                placeholder="Search room code, description, or type"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rooms-filter-wrap">
              <label htmlFor="rooms-type-filter">Room Type</label>
              <select
                id="rooms-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="rooms-filter-wrap">
              <label htmlFor="rooms-sort-key">Sort By</label>
              <select
                id="rooms-sort-key"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="room_code">Room Code</option>
                <option value="building">Description</option>
                <option value="capacity">Capacity</option>
                <option value="room_type">Room Type</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary rooms-sort-direction"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>

          <div className="actions rooms-actions">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add Room
            </button>
          </div>
        </div>

        <div className="card">
          <div className="rooms-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Room Code</th>
                  <th>Description</th>
                  <th>Capacity</th>
                  <th>Department</th>
                  <th>Room Type</th>
                  <th>Subject Type</th>
                  <th>Status</th>
                  <th>Common Room</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="rooms-empty-cell">Loading rooms...</td>
                  </tr>
                ) : filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="rooms-empty-cell">No rooms match your current filters.</td>
                  </tr>
                ) : (
                  filteredRooms.map((item) => (
                    <tr key={item.id}>
                      <td>{item.room_code || item.room_number}</td>
                      <td>{item.description || item.building}</td>
                      <td>{item.capacity}</td>
                      <td>{item.department || item.room_department || '-'}</td>
                      <td>{item.room_type || item.type || '-'}</td>
                      <td>{item.subject_type || '-'}</td>
                      <td>{item.status || 'Available'}</td>
                      <td>{item.common_room || item.is_common_room ? 'Yes' : 'No'}</td>
                      <td className="rooms-actions-cell">
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
          <div className="modal" onClick={triggerRoomModalAttention}>
            <div className={`modal-content ${shakeMainModal ? 'modal-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{currentRoom.id ? 'Edit Room' : 'Add Room'}</h2>
              </div>
              {modalPrompt && <p className="modal-focus-prompt">{modalPrompt}</p>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Room Code</label>
                  <input
                    type="text"
                    value={currentRoom.room_code || currentRoom.room_number || ''}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, room_code: e.target.value, room_number: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={currentRoom.description || currentRoom.building || ''}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, description: e.target.value, building: e.target.value })}
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
                  <label>Department</label>
                  <input
                    type="text"
                    value={currentRoom.department || currentRoom.room_department || ''}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, department: e.target.value, room_department: e.target.value })}
                    disabled={Boolean(currentRoom.common_room || currentRoom.is_common_room)}
                    placeholder={Boolean(currentRoom.common_room || currentRoom.is_common_room) ? 'Any department (common room)' : 'e.g., Computer Science'}
                  />
                </div>
                <div className="form-group">
                  <label>Room Type</label>
                  <select
                    value={currentRoom.room_type || currentRoom.type || ''}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, room_type: e.target.value, type: e.target.value })}
                    required
                  >
                    <option value="">Select Room Type</option>
                    <option value="Lecture Room">Lecture Room</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Biology Lab">Biology Lab</option>
                    <option value="Engineering Lab">Engineering Lab</option>
                    <option value="Physics Lab">Physics Lab</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject Type</label>
                  <select
                    value={currentRoom.subject_type || ''}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, subject_type: e.target.value })}
                    required
                  >
                    <option value="">Select Subject Type</option>
                    <option value="Lecture Room">Lecture Room</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Biology Lab">Biology Lab</option>
                    <option value="Engineering Lab">Engineering Lab</option>
                    <option value="Physics Lab">Physics Lab</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={currentRoom.status || 'Available'}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, status: e.target.value })}
                    required
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(currentRoom.common_room || currentRoom.is_common_room)}
                      onChange={(e) => setCurrentRoom({
                        ...currentRoom,
                        common_room: e.target.checked,
                        is_common_room: e.target.checked,
                        department: e.target.checked ? '' : currentRoom.department,
                        room_department: e.target.checked ? '' : currentRoom.room_department,
                      })}
                    />{' '}
                    Common Room (if checked, can be used by any department)
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Legacy Type (optional)
                  </label>
                  <select
                    value={currentRoom.type || currentRoom.room_type || ''}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, type: e.target.value, room_type: e.target.value })}
                  >
                    <option value="">Auto from Room Type</option>
                    <option value="Lecture Room">Lecture Room</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Computer Lab">Computer Lab</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetRoomModal}>
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
