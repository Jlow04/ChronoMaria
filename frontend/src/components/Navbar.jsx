import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        ChronoMaria
      </Link>
      <ul className="navbar-nav">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/faculty">Faculty</Link></li>
        <li><Link to="/subjects">Subjects</Link></li>
        <li><Link to="/rooms">Rooms</Link></li>
        <li><Link to="/schedule">Schedule</Link></li>
        <li><Link to="/login">Logout</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
