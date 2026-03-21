import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { FaBookOpen, FaCalendarCheck, FaDoorOpen, FaSignal, FaWandMagicSparkles } from 'react-icons/fa6';
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
        schedulesCount: 0,
        loading: false
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const isReady = stats.facultyCount > 0 && stats.subjectsCount > 0 && stats.roomsCount > 0;
  const readinessText = isReady ? 'Ready to generate schedules' : 'Missing required setup data';
  const readinessTone = isReady ? 'ready' : 'warning';

  return (
    <div className="app">
      <Navbar />
      <div className="container page-content">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Overview of the faculty loading system</p>
        </div>

        <div className="dashboard-bento">
          <article className="bento-card stat-card stat-card-primary">
            <div className="stat-top">
              <span className="stat-icon"><FaSignal /></span>
              <span className={`stat-badge ${readinessTone}`}>{stats.loading ? 'Checking...' : readinessText}</span>
            </div>
            <h3>System Readiness</h3>
            <p className="stat-number">{stats.loading ? '...' : (isReady ? '100%' : 'Needs Setup')}</p>
            <p className="stat-subtext">Generation pipeline status</p>
          </article>

          <article className="bento-card stat-card">
            <div className="stat-top">
              <span className="stat-icon"><FaChalkboardTeacher /></span>
            </div>
            <h3>Total Faculty</h3>
            <p className="stat-number">{stats.loading ? '...' : stats.facultyCount}</p>
            <p className="stat-subtext">Assignable instructors</p>
          </article>

          <article className="bento-card stat-card">
            <div className="stat-top">
              <span className="stat-icon"><FaBookOpen /></span>
            </div>
            <h3>Total Subjects</h3>
            <p className="stat-number">{stats.loading ? '...' : stats.subjectsCount}</p>
            <p className="stat-subtext">Active course offerings</p>
          </article>

          <article className="bento-card stat-card">
            <div className="stat-top">
              <span className="stat-icon"><FaDoorOpen /></span>
            </div>
            <h3>Total Rooms</h3>
            <p className="stat-number">{stats.loading ? '...' : stats.roomsCount}</p>
            <p className="stat-subtext">Available room inventory</p>
          </article>

          <article className="bento-card stat-card">
            <div className="stat-top">
              <span className="stat-icon"><FaCalendarCheck /></span>
            </div>
            <h3>Schedules Generated</h3>
            <p className="stat-number">{stats.loading ? '...' : stats.schedulesCount}</p>
            <p className="stat-subtext">Generated schedule snapshots</p>
          </article>

          <article className="bento-card bento-links bento-links-wide">
            <h2>Quick Actions</h2>
            <div className="bento-link-group">
              <Link to="/faculty" className="bento-link">Manage Faculty</Link>
              <Link to="/subjects" className="bento-link">Manage Subjects</Link>
              <Link to="/rooms" className="bento-link">Manage Rooms</Link>
              <Link to="/schedule" className="bento-link bento-link-primary"><FaWandMagicSparkles /> Generate Schedules</Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
