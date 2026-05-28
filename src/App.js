import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SpotPage from './pages/SpotPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Redirects logged-in users away from public-only pages (home, login, register)
function PublicOnly({ children }) {
  const user = JSON.parse(localStorage.getItem('cv_user') || 'null');
  if (!user) return children;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

// Requires a specific role; redirects otherwise
function RequireRole({ role, children }) {
  const user = JSON.parse(localStorage.getItem('cv_user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function App() {
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('cv_just_logged_in');
    if (justLoggedIn) {
      sessionStorage.removeItem('cv_just_logged_in');
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<PublicOnly><Home /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/spot/:slug" element={<RequireRole role="user"><SpotPage /></RequireRole>} />
        <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
        <Route path="/dashboard" element={<RequireRole role="user"><UserDashboard /></RequireRole>} />
      </Routes>
    </Router>
  );
}

export default App;