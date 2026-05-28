import React, { useState, useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,700;9..40,800;9..40,900&display=swap');

  nav, nav * { font-family: 'DM Sans', sans-serif; }

  .cv-logo-text {
    -webkit-text-stroke: 0.7px currentColor;
    letter-spacing: 0.18em;
    font-weight: 900;
    font-size: 1.05rem;
    text-transform: uppercase;
  }

  @keyframes navFadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dropdownIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .cv-nav-link {
    color: inherit;
    text-decoration: none;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 0;
    border-bottom: 2px solid transparent;
    transition: border-color 0.2s ease, opacity 0.2s ease;
    opacity: 0.65;
    cursor: pointer;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .cv-nav-link:hover { opacity: 1; }
  .cv-nav-link.active { border-bottom-color: currentColor; opacity: 1; }

  .cv-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #333;
    cursor: pointer;
    transition: background 0.15s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
  }
  .cv-dropdown-item:hover { background: #f5f5f5; }
  .cv-dropdown-item.danger { color: #c0392b; }
  .cv-dropdown-item.danger:hover { background: #fff5f5; }

  .nav-register-btn {
    transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .nav-register-btn:hover {
    transform: translateY(-1px);
  }
  .profile-btn {
    transition: all 0.2s ease;
  }
  .profile-btn:hover {
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    .cv-nav-center { display: none !important; }
    .cv-nav-register { display: none !important; }
    .cv-nav-root { padding-left: 16px !important; padding-right: 16px !important; }
    .cv-logo-text { font-size: 0.78rem !important; letter-spacing: 0.12em !important; }
    .cv-logo-img { width: 24px !important; height: 24px !important; }
  }
`;

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

export default function Navbar() {
  const nav = useNavigate();
  const navigate = nav;
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('cv_user') || 'null');
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setShowLogoutModal(false);
    setDropdownOpen(false);
  }, [location.pathname]);
  const dropdownRef = useRef(null);

  const isHome = location.pathname === '/';
  const isDashboard = ['/dashboard', '/admin'].includes(location.pathname);
  const isSpotPage = location.pathname.startsWith('/spot/');
  const hideNav = ['/login', '/register'].includes(location.pathname);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = ['contact', 'spots', 'about'];
      let current = 'home';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) { current = id; break; }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('cv_user');
    setShowLogoutModal(false);
    nav('/login');
  };

  const isTransparent = isHome && !scrolled;
  const textColor = isTransparent ? '#fff' : '#111';

  if (hideNav) return null;

  const handleScrollNav = (e, sectionId) => {
    e.preventDefault();
    if (isHome) scrollToSection(sectionId);
    else { nav('/'); setTimeout(() => scrollToSection(sectionId), 400); }
  };

  return (
    <>
      <style>{css}</style>

      <nav
        className="cv-nav-root fixed top-0 left-0 right-0 flex items-center justify-between px-10"
        style={{
          height: '64px',
          zIndex: 200,
          color: textColor,
          background: isTransparent ? 'transparent' : 'rgba(255,255,255,0.97)',
          borderBottom: isTransparent ? 'none' : '1px solid rgba(0,0,0,0.07)',
          boxShadow: isTransparent ? 'none' : '0 2px 24px rgba(0,0,0,0.05)',
          backdropFilter: isTransparent ? 'none' : 'blur(14px)',
          transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, color 0.4s ease',
          animation: 'navFadeIn 0.5s ease forwards',
        }}
      >
        {/* Logo */}
        <Link
          to={user?.role === 'admin' ? '/admin' : user?.role === 'user' ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 no-underline"
          style={{ color: textColor, transition: 'color 0.35s ease' }}
        >
          <img
            src="/images/logo.png"
            alt="ClickVentures"
            className="w-8 h-8 object-contain"
            style={{
              filter: isTransparent ? 'brightness(0) invert(1)' : 'brightness(0)',
              transition: 'filter 0.35s ease',
            }}
          />
          <span className="cv-logo-text">CLICKVENTURES</span>
        </Link>

        {/* Center nav links — hidden on mobile */}
        <div className="cv-nav-center absolute left-1/2 -translate-x-1/2 flex items-center gap-7">
          {!isDashboard && !isSpotPage && (
            <>
              <button
                className={`cv-nav-link${activeSection === 'home' ? ' active' : ''}`}
                style={{ color: textColor }}
                onClick={() => { if (isHome) window.scrollTo({ top: 0, behavior: 'smooth' }); else navigate('/'); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                  <path d="M9 21V12h6v9"/>
                </svg>
                Home
              </button>

              <button
                className={`cv-nav-link${activeSection === 'about' ? ' active' : ''}`}
                style={{ color: textColor }}
                onClick={e => handleScrollNav(e, 'about')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                About
              </button>

              <button
                className={`cv-nav-link${activeSection === 'spots' ? ' active' : ''}`}
                style={{ color: textColor }}
                onClick={e => handleScrollNav(e, 'spots')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Spots
              </button>

              <button
                className={`cv-nav-link${activeSection === 'contact' ? ' active' : ''}`}
                style={{ color: textColor }}
                onClick={e => handleScrollNav(e, 'contact')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Contact
              </button>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-auto">
          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="profile-btn flex items-center gap-2 rounded-full cursor-pointer border"
                style={{
                  padding: '4px 12px 4px 4px',
                  background: isTransparent ? 'rgba(255,255,255,0.12)' : '#f4f4f4',
                  borderColor: isTransparent ? 'rgba(255,255,255,0.28)' : '#e0e0e0',
                  backdropFilter: isTransparent ? 'blur(6px)' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = isTransparent ? 'rgba(255,255,255,0.22)' : '#ececec'}
                onMouseLeave={e => e.currentTarget.style.background = isTransparent ? 'rgba(255,255,255,0.12)' : '#f4f4f4'}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                  style={{
                    background: isTransparent ? 'rgba(255,255,255,0.25)' : '#111',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  {(user.first_name || user.last_name || user.username).slice(0, 1).toUpperCase()}
                </div>
                <span
                  className="text-xs font-semibold truncate"
                  style={{ maxWidth: '90px', color: textColor, transition: 'color 0.35s ease' }}
                >
                  {user.role === 'admin' ? 'Admin' : (user.first_name || user.username)}
                </span>
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  style={{ transition: 'transform 0.2s ease', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke={textColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 bg-white rounded-xl border border-gray-100 p-1.5"
                  style={{
                    top: 'calc(100% + 10px)',
                    width: '210px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.06)',
                    zIndex: 300,
                    animation: 'dropdownIn 0.18s ease forwards',
                  }}
                >
                  <div className="px-3.5 py-2.5 border-b border-gray-100 mb-1">
                    <div className="text-sm font-bold text-gray-900">{user.username}</div>
                    <div className="text-xs text-gray-400 capitalize mt-0.5">{user.role} account</div>
                  </div>
                  <button
                    className="cv-dropdown-item danger"
                    onClick={() => { setDropdownOpen(false); setShowLogoutModal(true); }}
                  >
                    <LogOut size={13} color="#c0392b" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`cv-nav-link${location.pathname === '/login' ? ' active' : ''}`}
                style={{ color: textColor }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login
              </Link>

              <Link to="/register" className="no-underline cv-nav-register">
                <button
                  className="nav-register-btn flex items-center gap-1.5 text-white font-black uppercase tracking-wider cursor-pointer rounded-md"
                  style={{
                    background: isTransparent ? 'rgba(255,255,255,0.14)' : '#111',
                    border: isTransparent ? '1px solid rgba(255,255,255,0.5)' : '1px solid #111',
                    padding: '7px 18px',
                    fontSize: '0.72rem',
                    letterSpacing: '0.1em',
                    backdropFilter: isTransparent ? 'blur(4px)' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isTransparent ? 'rgba(255,255,255,0.24)' : '#333'}
                  onMouseLeave={e => e.currentTarget.style.background = isTransparent ? 'rgba(255,255,255,0.14)' : '#111'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Register
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {!isHome && <div className="h-16" />}

      {/* Logout modal */}
      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.45)', animation: 'overlayIn 0.2s ease forwards' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl w-full p-8"
            style={{ maxWidth: '360px', boxShadow: '0 24px 64px rgba(0,0,0,0.15)', animation: 'modalIn 0.22s ease forwards' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: '#fff5f5' }}>
              <LogOut size={22} color="#c0392b" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Sign out?</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              You'll need to log in again to access your dashboard and saved content.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-lg text-sm font-bold text-gray-500 border border-gray-200 bg-white cursor-pointer transition-colors duration-150"
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 py-3 rounded-lg text-sm font-bold text-white border-none cursor-pointer transition-all duration-150"
                style={{ background: '#c0392b' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#a93226'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}