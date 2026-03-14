import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoNoBg from '../assets/LogoNoBg.png';

function Navbar() {
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
      </ul>
      <NavLink to="/login" className="navbar-logout">Logout</NavLink>
    </nav>
  );
}

export default Navbar;
