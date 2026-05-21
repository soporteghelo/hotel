import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, Users, LogIn, LogOut, Wrench,
  ClipboardList, Settings, Building2, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'recepcionista', 'consulta'] },
  { to: '/mapa', label: 'Mapa Visual', icon: Map, roles: ['admin', 'supervisor', 'recepcionista', 'consulta'] },
  { to: '/huespedes', label: 'Huéspedes', icon: Users, roles: ['admin', 'supervisor', 'recepcionista', 'consulta'] },
  { to: '/checkin', label: 'Check-In', icon: LogIn, roles: ['admin', 'supervisor', 'recepcionista'] },
  { to: '/checkout', label: 'Check-Out', icon: LogOut, roles: ['admin', 'supervisor', 'recepcionista'] },
  { to: '/mantenimiento', label: 'Mantenimiento', icon: Wrench, roles: ['admin', 'supervisor', 'recepcionista'] },
  { to: '/auditoria', label: 'Auditoría', icon: ClipboardList, roles: ['admin', 'supervisor'] },
  { to: '/configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const { currentUser, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const filteredItems = navItems.filter(item => item.roles.includes(currentUser?.rol));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="p-2 bg-yellow-500 rounded-xl">
          <Building2 size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">Campamento</p>
          <p className="text-xs text-gray-400 leading-tight">El Teniente</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-gray-400">Sesión activa</p>
          <p className="text-sm text-white font-medium truncate">{currentUser?.nombre}</p>
          <p className="text-xs text-gray-400 capitalize">{currentUser?.rol}</p>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={18} />
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-800 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-gray-800 h-full shadow-2xl">
            <button
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
