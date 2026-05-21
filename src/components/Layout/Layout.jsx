import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import BottomNav from './BottomNav.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function Layout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        {/* pb-[calc(64px+env(safe-area-inset-bottom,0px))] on mobile so content doesn't hide under bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-[80px] md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
