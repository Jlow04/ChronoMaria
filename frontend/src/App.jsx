import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Faculty from './pages/Faculty';
import Subjects from './pages/Subjects';
import Rooms from './pages/Rooms';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import './App.css';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

function IdleSessionGuard() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/login') {
      return undefined;
    }

    if (!localStorage.getItem('user')) {
      return undefined;
    }

    let timeoutId;

    const logoutForInactivity = () => {
      localStorage.removeItem('user');
      navigate('/login', {
        replace: true,
        state: { reason: 'idle-timeout' },
      });
    };

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutForInactivity, IDLE_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <IdleSessionGuard />
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
