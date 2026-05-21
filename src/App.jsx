import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore.js';
import Layout from './components/Layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MapView from './pages/MapView.jsx';
import Guests from './pages/Guests.jsx';
import CheckIn from './pages/CheckIn.jsx';
import CheckOut from './pages/CheckOut.jsx';
import Maintenance from './pages/Maintenance.jsx';
import AuditLog from './pages/AuditLog.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  const initializeData = useStore(s => s.initializeData);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="mapa" element={<MapView />} />
        <Route path="huespedes" element={<Guests />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="checkout" element={<CheckOut />} />
        <Route path="mantenimiento" element={<Maintenance />} />
        <Route path="auditoria" element={<AuditLog />} />
        <Route path="configuracion" element={<Settings />} />
        <Route path="perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
