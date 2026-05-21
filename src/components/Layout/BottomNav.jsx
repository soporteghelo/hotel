import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, LogIn, LogOut, Users,
  Wrench, ClipboardList, Settings, UserCircle,
  Menu, X, Building2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const primaryItems = {
  admin:         ['/','mapa','checkin','checkout','_mas'],
  supervisor:    ['/','mapa','checkin','checkout','_mas'],
  recepcionista: ['/','mapa','checkin','checkout','_mas'],
  consulta:      ['/','mapa','huespedes','perfil','_mas'],
};

const allNavItems = [
  { to: '/',             label: 'Inicio',    icon: LayoutDashboard, roles: ['admin','supervisor','recepcionista','consulta'] },
  { to: '/mapa',         label: 'Mapa',      icon: Map,             roles: ['admin','supervisor','recepcionista','consulta'] },
  { to: '/checkin',      label: 'Check-In',  icon: LogIn,           roles: ['admin','supervisor','recepcionista'] },
  { to: '/checkout',     label: 'Check-Out', icon: LogOut,          roles: ['admin','supervisor','recepcionista'] },
  { to: '/huespedes',    label: 'Huéspedes', icon: Users,           roles: ['admin','supervisor','recepcionista','consulta'] },
  { to: '/mantenimiento',label: 'Mant.',     icon: Wrench,          roles: ['admin','supervisor','recepcionista'] },
  { to: '/auditoria',    label: 'Auditoría', icon: ClipboardList,   roles: ['admin','supervisor'] },
  { to: '/configuracion',label: 'Config.',   icon: Settings,        roles: ['admin'] },
  { to: '/perfil',       label: 'Mi Perfil', icon: UserCircle,      roles: ['admin','supervisor','recepcionista','consulta'] },
];

function MasSheet({ open, onClose }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const primary = primaryItems[currentUser?.rol] || primaryItems.consulta;
  const visible = allNavItems.filter(i =>
    i.roles.includes(currentUser?.rol) && !primary.includes(i.to.replace('/','') || '/')
  );

  if (!open) return null;

  function handleLogout() {
    onClose();
    logout();
    navigate('/login');
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 bg-white rounded-t-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-100 mb-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
              <span className="text-base font-black text-white">{currentUser?.nombre?.charAt(0)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{currentUser?.nombre}</p>
              <p className="text-xs text-gray-400 capitalize">{currentUser?.rol} · DNI {currentUser?.dni}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {visible.map(item => (
              <NavLink key={item.to} to={item.to} onClick={onClose}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }>
                <item.icon size={22} />
                <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-500 bg-red-50 rounded-2xl active:bg-red-100 mb-2"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BottomNav() {
  const { currentUser } = useAuth();
  const [masOpen, setMasOpen] = useState(false);

  if (!currentUser) return null;

  const primary = primaryItems[currentUser.rol] || primaryItems.consulta;

  const tabs = primary.map(key => {
    if (key === '_mas') return { key: '_mas', label: 'Más', icon: Menu };
    return allNavItems.find(i => i.to === '/' + key || (key === '/' && i.to === '/')) || null;
  }).filter(Boolean);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map(tab => {
          if (tab.key === '_mas') {
            return (
              <button
                key="_mas"
                onClick={() => setMasOpen(true)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                  masOpen ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Menu size={22} />
                <span className="text-[10px] font-medium">Más</span>
              </button>
            );
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500 active:text-blue-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-50' : ''}`}>
                    <tab.icon size={22} />
                  </div>
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <MasSheet open={masOpen} onClose={() => setMasOpen(false)} />
    </>
  );
}
