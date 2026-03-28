import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import GroqKeyModal from '../GroqKeyModal/GroqKeyModal';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetVideo, setShowKeyModal } = useAppContext();

  const nav = (path) => navigate(path);

  const goHome = () => {
    resetVideo();
    navigate('/');
  };

  const active = (path) => location.pathname === path ? 'nav-link nav-link--active' : 'nav-link';

  return (
    <div className="layout">
      {/* ── Header ── */}
      <header className="app-header">
        <button className="app-header__logo" onClick={goHome}>
          <span className="logo-bracket">[ </span>
          <span className="logo-text">LEARNWITHHAXX</span>
          <span className="logo-bracket"> ]</span>
        </button>

        <nav className="app-header__nav">
          <button className={active('/')} onClick={() => nav('/')}>DASHBOARD</button>
          <button className={active('/history')} onClick={() => nav('/history')}>HISTORY</button>
          <button className="nav-link" onClick={() => setShowKeyModal(true)}>API KEY 🔑</button>
        </nav>
      </header>

      {/* ── Main Content ── */}
      <main className="layout__main">
        {children}
      </main>

      {/* ── BYOK Modal ── */}
      <GroqKeyModal />
    </div>
  );
}
