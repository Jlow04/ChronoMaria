import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { facultyService, subjectService, roomService } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    facultyCount: 0,
    subjectsCount: 0,
    roomsCount: 0,
    schedulesCount: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [faculty, subjects, rooms] = await Promise.all([
        facultyService.getAll(),
        subjectService.getAll(),
        roomService.getAll()
      ]);

      setStats({
        facultyCount: faculty.length,
        subjectsCount: subjects.length,
        roomsCount: rooms.length,
        schedulesCount: 0, // TODO: Add schedules tracking
        loading: false
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Overview of the faculty loading system</p>
        </div>
        
        <div className="dashboard-grid">
          <div className="card stat-card">
            <h3>Total Faculty</h3>
            <p className="stat-number">
              {stats.loading ? '...' : stats.facultyCount}
            </p>
          </div>
          <div className="card stat-card">
            <h3>Total Subjects</h3>
            <p className="stat-number">
              {stats.loading ? '...' : stats.subjectsCount}
            </p>
          </div>
          <div className="card stat-card">
            <h3>Total Rooms</h3>
            <p className="stat-number">
              {stats.loading ? '...' : stats.roomsCount}
            </p>
          </div>
          <div className="card stat-card">
            <h3>Schedules Generated</h3>
            <p className="stat-number">
              {stats.loading ? '...' : stats.schedulesCount}
            </p>
          </div>
        </div>

        <div className="card">
          <h2>Quick Stats</h2>
          {stats.loading ? (
            <p>Loading statistics...</p>
          ) : (
            <div style={{ padding: '10px 0' }}>
              <p>✅ System is connected to database</p>
              <p>✅ {stats.facultyCount} faculty members ready for scheduling</p>
              <p>✅ {stats.subjectsCount} subjects available</p>
              <p>✅ {stats.roomsCount} rooms available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
