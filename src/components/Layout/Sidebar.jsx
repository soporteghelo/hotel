import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, Users, LogIn, LogOut, Wrench,
  ClipboardList, Settings, Building2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard',      icon: LayoutDashboard, roles: ['admin','supervisor','recepcionista','consulta'] },
  { to: '/mapa',          label: 'Mapa Visual',   icon: Map,             roles: ['admin','supervisor','recepcionista','consulta'] },
  { to: '/huespedes',     label: 'Huéspedes',     icon: Users,           roles: ['admin','supervisor','recepcionista','consulta'] },
  { to: '/checkin',       label: 'Check-In',      icon: LogIn,           roles: ['admin','supervisor','recepcionista'] },
  { to: '/checkout',      label: 'Check-Out',     icon: LogOut,          roles: ['admin','supervisor','recepcionista'] },
  { to: '/mantenimiento', label: 'Mantenimiento', icon: Wrench,          roles: ['admin','supervisor','recepcionista'] },
  { to: '/auditoria',     label: 'Auditoría',     icon: ClipboardList,   roles: ['admin','supervisor'] },
  { to: '/configuracion', label: 'Configuración', icon: Settings,        roles: ['admin'] },
];

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const filteredItems = navItems.filter(item => item.roles.includes(currentUser?.rol));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-800 h-screen sticky top-0 flex-shrink-0">
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
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + Profile + Logout */}
      <div className="px-3 py-4 border-t border-gray-700 space-y-1">
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
          }
        >
          <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{currentUser?.nombre?.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate leading-tight">{currentUser?.nombre}</p>
            <p className="text-xs text-gray-400 leading-tight">DNI: {currentUser?.dni}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={18} />
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
