import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Faculty from './pages/Faculty';
import Subjects from './pages/Subjects';
import Rooms from './pages/Rooms';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
