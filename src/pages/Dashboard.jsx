import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BedDouble, LogIn, LogOut, Wrench, Activity,
  ArrowRight, TrendingUp, CheckCircle, AlertCircle,
} from 'lucide-react';
import useStore from '../store/useStore.js';
import Card, { StatCard } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { formatDateTime, formatRelative, isToday } from '../utils/dates.js';

const accionLabels = {
  CHECK_IN: 'Check-In',
  CHECK_OUT: 'Check-Out',
  CREAR_HUESPED: 'Nuevo Huésped',
  EDITAR_HUESPED: 'Editar Huésped',
  CREAR_TICKET: 'Ticket Creado',
  EDITAR_TICKET: 'Ticket Actualizado',
  LOGIN: 'Inicio de Sesión',
  LOGOUT: 'Cierre de Sesión',
  CREAR_HOTEL: 'Hotel Creado',
  CREAR_CUARTO: 'Cuarto Creado',
  EDITAR_CAMA: 'Cama Editada',
  CAMBIAR_ESTADO_CAMA: 'Estado de Cama',
  CREAR_USUARIO: 'Usuario Creado',
  EDITAR_USUARIO: 'Usuario Editado',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const hotels = useStore(s => s.hotels);
  const cuartos = useStore(s => s.cuartos);
  const camas = useStore(s => s.camas);
  const asignaciones = useStore(s => s.asignaciones);
  const logAuditoria = useStore(s => s.logAuditoria);
  const mantenimiento = useStore(s => s.mantenimiento);
  const huespedes = useStore(s => s.huespedes);

  // Stats
  const totalCamas = camas.length;
  const camasLibres = camas.filter(c => c.estado === 'libre').length;
  const camasOcupadas = camas.filter(c => c.estado === 'ocupada').length;
  const camasReservadas = camas.filter(c => c.estado === 'reservada').length;
  const camasMant = camas.filter(c => c.estado === 'mantenimiento').length;
  const ocupacionPct = totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0;

  // Today arrivals/departures
  const hoy = new Date().toISOString().split('T')[0];
  const llegadasHoy = asignaciones.filter(a => a.fechaLlegada === hoy && a.estado !== 'cerrada').length;
  const salidasHoy = asignaciones.filter(a => (a.fechaSalidaEstimada === hoy || a.fechaSalidaReal === hoy)).length;

  // Active tickets
  const ticketsAbiertos = mantenimiento.filter(m => m.estado !== 'cerrado').length;

  // Occupancy per hotel
  const hotelStats = hotels.map(hotel => {
    const hotelCuartos = cuartos.filter(c => c.idHotel === hotel.id);
    const hotelCuartoIds = hotelCuartos.map(c => c.id);
    const hotelCamas = camas.filter(c => hotelCuartoIds.includes(c.idCuarto));
    const ocupadas = hotelCamas.filter(c => c.estado === 'ocupada').length;
    const total = hotelCamas.length;
    const pct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
    return { ...hotel, ocupadas, total, pct };
  });

  // Recent log
  const recentLog = logAuditoria.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BedDouble size={22} />}
          label="Camas Ocupadas"
          value={camasOcupadas}
          sub={`${ocupacionPct}% del total`}
          color="red"
        />
        <StatCard
          icon={<CheckCircle size={22} />}
          label="Camas Libres"
          value={camasLibres}
          sub={`de ${totalCamas} totales`}
          color="green"
        />
        <StatCard
          icon={<LogIn size={22} />}
          label="Llegadas Hoy"
          value={llegadasHoy}
          sub="reservas/check-ins"
          color="blue"
        />
        <StatCard
          icon={<AlertCircle size={22} />}
          label="Tickets Activos"
          value={ticketsAbiertos}
          sub="mantenimiento"
          color={ticketsAbiertos > 0 ? 'yellow' : 'gray'}
          onClick={() => navigate('/mantenimiento')}
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy per hotel */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Ocupación por Pabellón</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/mapa')}>
                Ver Mapa <ArrowRight size={14} />
              </Button>
            </div>

            {hotelStats.map(hotel => (
              <div key={hotel.id} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{hotel.nombre}</span>
                  <span className="text-sm text-gray-500">{hotel.ocupadas}/{hotel.total} camas</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${hotel.pct}%`,
                      backgroundColor: hotel.pct > 80 ? '#ef4444' : hotel.pct > 50 ? '#eab308' : '#22c55e',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{hotel.pct}% ocupado</p>
              </div>
            ))}

            {/* Bed status summary */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3">Estado de Camas</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Libre', value: camasLibres, color: 'bg-green-500' },
                  { label: 'Ocupada', value: camasOcupadas, color: 'bg-red-500' },
                  { label: 'Reservada', value: camasReservadas, color: 'bg-yellow-500' },
                  { label: 'Mantenimiento', value: camasMant, color: 'bg-gray-400' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                    <div>
                      <p className="text-sm font-bold text-gray-700">{item.value}</p>
                      <p className="text-xs text-gray-400">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/checkin')}
              className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-left"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <LogIn size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Nuevo Check-In</p>
                <p className="text-xs text-gray-500">Asignar cama a huésped</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <LogOut size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Registrar Check-Out</p>
                <p className="text-xs text-gray-500">Liberar cama de huésped</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/mapa')}
              className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Ver Mapa de Camas</p>
                <p className="text-xs text-gray-500">Vista visual por piso</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/huespedes')}
              className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-left"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Gestionar Huéspedes</p>
                <p className="text-xs text-gray-500">{huespedes.filter(h => h.activo).length} huéspedes activos</p>
              </div>
            </button>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Actividad Reciente</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/auditoria')}>
            Ver todo <ArrowRight size={14} />
          </Button>
        </div>
        {recentLog.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay actividad registrada</p>
        ) : (
          <div className="space-y-3">
            {recentLog.map(entry => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity size={14} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{accionLabels[entry.accion] || entry.accion}</span>
                    {entry.valorNuevo?.huesped && (
                      <span className="text-gray-500"> — {entry.valorNuevo.huesped}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {entry.usuario} · {formatRelative(entry.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
