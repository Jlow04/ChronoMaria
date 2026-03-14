import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoNoBg from '../assets/LogoNoBg.png';

function Navbar() {
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsSuperAdmin(parsedUser.role === 'Super Admin');
    }
  }, []);

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <img src={logoNoBg} alt="ChronoMaria" className="navbar-logo" />
      </Link>
      <ul className="navbar-nav">
        <li><NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink></li>
        <li><NavLink to="/faculty" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Faculty</NavLink></li>
        <li><NavLink to="/subjects" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Subjects</NavLink></li>
        <li><NavLink to="/rooms" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Rooms</NavLink></li>
        <li><NavLink to="/schedule" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Schedule</NavLink></li>
        {isSuperAdmin && (
          <li><NavLink to="/settings" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Settings</NavLink></li>
        )}
      </ul>
      <div className="navbar-actions">
        <NavLink to="/login" className="navbar-logout">Logout</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
