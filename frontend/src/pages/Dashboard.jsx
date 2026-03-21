import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { facultyService, subjectService, roomService, scheduleService } from '../services/api';
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

      const scheduleCount = await scheduleService.count();

      setStats({
        facultyCount: faculty.length,
        subjectsCount: subjects.length,
        roomsCount: rooms.length,
        schedulesCount: scheduleCount.count || 0,
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
      <div className="container page-content">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Overview of the faculty loading system</p>
        </div>

        <div className="dashboard-bento">
          <article className="bento-card stat-card">
            <h3>Total Faculty</h3>
            <p className="stat-number">{stats.loading ? '...' : stats.facultyCount}</p>
          </article>

          <article className="bento-card stat-card">
            <h3>Total Subjects</h3>
            <p className="stat-number">{stats.loading ? '...' : stats.subjectsCount}</p>
          </article>

          <article className="bento-card stat-card">
            <h3>Total Rooms</h3>
            <p className="stat-number">{stats.loading ? '...' : stats.roomsCount}</p>
          </article>

          <article className="bento-card stat-card">
            <h3>Schedules Generated</h3>
            <p className="stat-number">{stats.loading ? '...' : stats.schedulesCount}</p>
          </article>

          <article className="bento-card bento-overview">
            <h2>Operations Overview</h2>
            {stats.loading ? (
              <p className="overview-note">Loading statistics...</p>
            ) : (
              <ul className="overview-list">
                <li>System status: Connected and ready</li>
                <li>{stats.facultyCount} faculty members available for assignment</li>
                <li>{stats.subjectsCount} active subjects in the offering pool</li>
                <li>{stats.roomsCount} rooms available for scheduling</li>
              </ul>
            )}
          </article>

          <article className="bento-card bento-links">
            <h2>Quick Actions</h2>
            <div className="bento-link-group">
              <Link to="/faculty" className="bento-link">Manage Faculty</Link>
              <Link to="/subjects" className="bento-link">Manage Subjects</Link>
              <Link to="/rooms" className="bento-link">Manage Rooms</Link>
              <Link to="/schedule" className="bento-link">Generate Schedules</Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
