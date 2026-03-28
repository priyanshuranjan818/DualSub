import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import PlayerPage from './pages/PlayerPage';
import HistoryPage from './pages/HistoryPage';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AppProvider>
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/player"  element={<PlayerPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </AppProvider>
    </HashRouter>
  </React.StrictMode>
);
