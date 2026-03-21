import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  FaBars,
  FaBook,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCog,
  FaDoorOpen,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTimes,
} from 'react-icons/fa';
import logoNoBg from '../assets/LogoNoBg.png';

function Navbar() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setIsSuperAdmin(parsedUser.role === 'Super Admin');
    }

    const storedSidebarState = localStorage.getItem('sidebarOpen');
    if (storedSidebarState !== null) {
      setIsSidebarOpen(storedSidebarState === 'true');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarOpen', String(next));
      // Re-evaluate scroll state on toggle
      setIsScrolled(window.scrollY > 60);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar-toggle ${isSidebarOpen ? 'open' : 'closed'} ${isScrolled ? 'scrolled' : ''}`}
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Hide menu' : 'Show menu'}
        title={isSidebarOpen ? 'Hide menu' : 'Show menu'}
      >
        <span className="toggle-icon">{isSidebarOpen ? <FaTimes /> : <FaBars />}</span>
        <span className="toggle-text">{isSidebarOpen ? 'Hide Menu' : 'Show Menu'}</span>
      </button>

      <nav className={`nav-island ${isSidebarOpen ? 'open' : 'closed'}`}>
        <Link to="/dashboard" className="navbar-brand">
          <img src={logoNoBg} alt="ChronoMaria" className="navbar-logo" />
        </Link>

        <ul className="navbar-nav">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><FaTachometerAlt /></span>
              <span className="nav-label">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/faculty" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><FaChalkboardTeacher /></span>
              <span className="nav-label">Faculty</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/subjects" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><FaBook /></span>
              <span className="nav-label">Subjects</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/rooms" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><FaDoorOpen /></span>
              <span className="nav-label">Rooms</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/schedule" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><FaCalendarAlt /></span>
              <span className="nav-label">Schedule</span>
            </NavLink>
          </li>
          {isSuperAdmin && (
            <li>
              <NavLink to="/settings" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><FaCog /></span>
                <span className="nav-label">Settings</span>
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="top-right-logout">
        <NavLink to="/login" className="navbar-logout" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </NavLink>
      </div>
    </>
  );
}

export default Navbar;
