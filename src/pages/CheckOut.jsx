import React, { useState, useMemo } from 'react';
import { Search, LogOut, Calendar } from 'lucide-react';
import useStore from '../store/useStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { formatDate, todayISO, daysBetween } from '../utils/dates.js';

export default function CheckOut() {
  const { canWrite } = useAuth();
  const { addToast } = useToast();
  const asignaciones = useStore(s => s.asignaciones);
  const huespedes = useStore(s => s.huespedes);
  const camas = useStore(s => s.camas);
  const cuartos = useStore(s => s.cuartos);
  const hotels = useStore(s => s.hotels);
  const checkOut = useStore(s => s.checkOut);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [fechaSalida, setFechaSalida] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const today = todayISO();

  const activas = useMemo(() => {
    return asignaciones
      .filter(a => a.estado === 'activa')
      .map(a => {
        const huesped = huespedes.find(h => h.id === a.idHuesped);
        const cama = camas.find(c => c.id === a.idCama);
        const cuarto = cuartos.find(c => c.id === cama?.idCuarto);
        const hotel = hotels.find(h => h.id === cuarto?.idHotel);
        return { ...a, huesped, cama, cuarto, hotel };
      })
      .filter(a => a.huesped)
      .sort((a, b) => {
        // Overdue first
        const aOver = a.fechaSalidaEstimada < today;
        const bOver = b.fechaSalidaEstimada < today;
        if (aOver && !bOver) return -1;
        if (!aOver && bOver) return 1;
        return a.fechaSalidaEstimada.localeCompare(b.fechaSalidaEstimada);
      });
  }, [asignaciones, huespedes, camas, cuartos, hotels, today]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return activas;
    return activas.filter(a =>
      a.huesped?.nombre.toLowerCase().includes(q) ||
      a.cama?.codigo.toLowerCase().includes(q) ||
      a.huesped?.empresa?.toLowerCase().includes(q)
    );
  }, [activas, search]);

  const vencidas = activas.filter(a => a.fechaSalidaEstimada < today);

  function openCheckOut(a) {
    setSelected(a);
    setFechaSalida(todayISO());
  }

  async function handleCheckOut() {
    if (!selected || !fechaSalida) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const result = checkOut({ idAsignacion: selected.id, fechaSalidaReal: fechaSalida });
    setLoading(false);
    if (result.success) {
      addToast(`Check-Out: ${selected.huesped?.nombre}`, 'success');
      setSelected(null);
    } else {
      addToast(result.error || 'Error al realizar el check-out', 'error');
    }
  }

  if (!canWrite) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-400">
          <p>No tienes permisos para realizar check-out</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {vencidas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Calendar size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {vencidas.length} hospedaje{vencidas.length > 1 ? 's' : ''} con fecha vencida
          </p>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar huésped o cama..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">{activas.length} activos</span>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <LogOut size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">{search ? 'Sin resultados' : 'No hay hospedajes activos'}</p>
          </div>
        ) : filtered.map(a => {
          const isOverdue = a.fechaSalidaEstimada < today;
          const noches = daysBetween(a.fechaLlegada, today);
          return (
            <div key={a.id}
              className={`mobile-card ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}
              onClick={() => openCheckOut(a)}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-700 text-sm">{a.huesped?.nombre?.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{a.huesped?.nombre}</p>
                    <p className="text-xs text-gray-500 truncate">{a.huesped?.empresa}</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-lg flex-shrink-0">
                  {a.cama?.codigo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>Llegada: {formatDate(a.fechaLlegada)}</span>
                  <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                    Sale: {formatDate(a.fechaSalidaEstimada)}{isOverdue ? ' ⚠' : ''}
                  </span>
                </div>
                <Button size="sm" variant={isOverdue ? 'danger' : 'outline'}
                  onClick={e => { e.stopPropagation(); openCheckOut(a); }}>
                  <LogOut size={13} /> Salida
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Huésped</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cama</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Llegada</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Salida Est.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Noches</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <LogOut size={28} className="mx-auto mb-2 opacity-40" />
                      <p>{search ? 'Sin resultados' : 'No hay hospedajes activos'}</p>
                    </td>
                  </tr>
                ) : filtered.map(a => {
                  const isOverdue = a.fechaSalidaEstimada < today;
                  const noches = daysBetween(a.fechaLlegada, today);
                  return (
                    <tr key={a.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}
                      onClick={() => openCheckOut(a)}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-700">{a.huesped?.nombre?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{a.huesped?.nombre}</p>
                            <p className="text-xs text-gray-500">{a.huesped?.empresa}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-1 rounded-lg">{a.cama?.codigo}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(a.fechaLlegada)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatDate(a.fechaSalidaEstimada)}{isOverdue && ' ⚠'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{noches}n</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); openCheckOut(a); }}>
                          Check-Out
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Confirm modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Confirmar Check-Out"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button variant="danger" loading={loading} onClick={handleCheckOut}>
              <LogOut size={16} /> Confirmar Salida
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-xs text-gray-500">Huésped</p>
                <p className="text-sm font-bold text-gray-800">{selected.huesped?.nombre}</p>
                <p className="text-xs text-gray-500">{selected.huesped?.empresa}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cama</p>
                <p className="text-sm font-bold font-mono text-gray-800">{selected.cama?.codigo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Llegada</p>
                <p className="text-sm font-semibold text-gray-700">{formatDate(selected.fechaLlegada)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Salida estimada</p>
                <p className={`text-sm font-semibold ${selected.fechaSalidaEstimada < today ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatDate(selected.fechaSalidaEstimada)}
                </p>
              </div>
            </div>
            <Input label="Fecha real de salida" type="date" required
              value={fechaSalida} onChange={e => setFechaSalida(e.target.value)}
              hint="La cama pasará a estado 'Limpieza'" />
          </div>
        )}
      </Modal>
    </div>
  );
}
