import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Badge from '../ui/Badge.jsx';

const pageTitles = {
  '/': 'Dashboard',
  '/mapa': 'Mapa Visual de Habitaciones',
  '/huespedes': 'Gestión de Huéspedes',
  '/checkin': 'Check-In',
  '/checkout': 'Check-Out',
  '/mantenimiento': 'Tickets de Mantenimiento',
  '/auditoria': 'Log de Auditoría',
  '/configuracion': 'Configuración',
};

export default function Header() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Campamento El Teniente';

  const today = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between md:pl-6 pl-16">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        <p className="text-xs text-gray-500 capitalize">{today}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-700">
              {currentUser?.nombre?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700 leading-none">{currentUser?.nombre?.split(' ')[0]}</p>
            <Badge value={currentUser?.rol} size="xs" />
          </div>
        </div>
      </div>
    </header>
  );
}
