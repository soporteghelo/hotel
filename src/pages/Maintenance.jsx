import React, { useState, useMemo } from 'react';
import { Plus, Wrench, ChevronRight, Search, Filter } from 'lucide-react';
import useStore from '../store/useStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input, { Select, Textarea } from '../components/ui/Input.jsx';
import { formatDate } from '../utils/dates.js';

const EMPTY_FORM = { idCuarto: '', descripcion: '', prioridad: 'media' };

function TicketForm({ cuartos, hotels, onSave, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.idCuarto || !form.descripcion.trim()) return;
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="Cuarto afectado" required value={form.idCuarto}
        onChange={e => set('idCuarto', e.target.value)}>
        <option value="">Seleccionar cuarto...</option>
        {cuartos.map(c => {
          const h = hotels.find(ho => ho.id === c.idHotel);
          return (
            <option key={c.id} value={c.id}>
              {h?.nombre} — Piso {c.piso}, Cuarto {String(c.numero).padStart(2,'0')}
            </option>
          );
        })}
      </Select>
      <Textarea label="Descripción del problema" required value={form.descripcion}
        onChange={e => set('descripcion', e.target.value)}
        placeholder="Describir el problema en detalle..." rows={3} />
      <Select label="Prioridad" value={form.prioridad} onChange={e => set('prioridad', e.target.value)}>
        <option value="alta">Alta — Impide uso del cuarto</option>
        <option value="media">Media — Uso limitado</option>
        <option value="baja">Baja — Cosmético / menor</option>
      </Select>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" loading={loading}>Crear Ticket</Button>
      </div>
    </form>
  );
}

function TicketDetail({ ticket, cuartos, hotels, onClose, onUpdate, canWrite }) {
  const cuarto = cuartos.find(c => c.id === ticket.idCuarto);
  const hotel = hotels.find(h => h.id === cuarto?.idHotel);

  const nextStates = {
    abierto: [{ value: 'en_proceso', label: 'Iniciar trabajo', variant: 'warning' }],
    en_proceso: [{ value: 'cerrado', label: 'Marcar como resuelto', variant: 'success' }],
    cerrado: [],
  };

  return (
    <Modal isOpen title="Detalle del Ticket" onClose={onClose} size="md"
      footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500">
              {hotel?.nombre} — Piso {cuarto?.piso}, Cuarto {String(cuarto?.numero).padStart(2,'0')}
            </p>
            <p className="text-sm font-bold text-gray-800 mt-1">{ticket.descripcion}</p>
          </div>
          <Badge value={ticket.estado} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Prioridad</p>
            <Badge value={ticket.prioridad} />
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Fecha apertura</p>
            <p className="text-sm font-semibold">{formatDate(ticket.fecha)}</p>
          </div>
        </div>

        {canWrite && nextStates[ticket.estado]?.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-2 font-medium">Cambiar estado:</p>
            <div className="flex gap-2">
              {nextStates[ticket.estado].map(ns => (
                <Button key={ns.value} variant={ns.variant} size="sm"
                  onClick={() => { onUpdate(ticket.id, { estado: ns.value }); onClose(); }}>
                  {ns.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Maintenance() {
  const { canWrite } = useAuth();
  const { addToast } = useToast();
  const mantenimiento = useStore(s => s.mantenimiento);
  const cuartos = useStore(s => s.cuartos);
  const hotels = useStore(s => s.hotels);
  const addMantenimiento = useStore(s => s.addMantenimiento);
  const updateMantenimiento = useStore(s => s.updateMantenimiento);

  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterPrioridad, setFilterPrioridad] = useState('todos');
  const [search, setSearch] = useState('');

  const enriched = useMemo(() => {
    return mantenimiento.map(t => {
      const cuarto = cuartos.find(c => c.id === t.idCuarto);
      const hotel = hotels.find(h => h.id === cuarto?.idHotel);
      return { ...t, cuarto, hotel };
    });
  }, [mantenimiento, cuartos, hotels]);

  const filtered = useMemo(() => {
    return enriched.filter(t => {
      if (filterEstado !== 'todos' && t.estado !== filterEstado) return false;
      if (filterPrioridad !== 'todos' && t.prioridad !== filterPrioridad) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.descripcion.toLowerCase().includes(q) && !(t.hotel?.nombre || '').toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const order = { alta: 0, media: 1, baja: 2 };
      if (a.estado !== 'cerrado' && b.estado === 'cerrado') return -1;
      if (a.estado === 'cerrado' && b.estado !== 'cerrado') return 1;
      return (order[a.prioridad] || 0) - (order[b.prioridad] || 0);
    });
  }, [enriched, filterEstado, filterPrioridad, search]);

  const counts = useMemo(() => ({
    abiertos: mantenimiento.filter(t => t.estado === 'abierto').length,
    enProceso: mantenimiento.filter(t => t.estado === 'en_proceso').length,
    cerrados: mantenimiento.filter(t => t.estado === 'cerrado').length,
  }), [mantenimiento]);

  async function handleCreate(form) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    const today = new Date().toISOString().split('T')[0];
    addMantenimiento({ ...form, estado: 'abierto', fecha: today });
    addToast('Ticket creado. Camas del cuarto marcadas como mantenimiento.', 'success');
    setLoading(false);
    setShowForm(false);
  }

  function handleUpdate(id, data) {
    updateMantenimiento(id, data);
    const label = data.estado === 'cerrado' ? 'Ticket cerrado. Camas liberadas a limpieza.' : 'Estado actualizado.';
    addToast(label, 'success');
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Abiertos', value: counts.abiertos, color: 'border-red-300 bg-red-50', textColor: 'text-red-700' },
          { label: 'En Proceso', value: counts.enProceso, color: 'border-yellow-300 bg-yellow-50', textColor: 'text-yellow-700' },
          { label: 'Cerrados', value: counts.cerrados, color: 'border-gray-200 bg-gray-50', textColor: 'text-gray-600' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 text-center ${s.color}`}>
            <p className={`text-2xl font-bold ${s.textColor}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1">
            <div className="relative min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="todos">Todos los estados</option>
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En Proceso</option>
              <option value="cerrado">Cerrado</option>
            </select>
            <select value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="todos">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          {canWrite && (
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} /> Nuevo Ticket
            </Button>
          )}
        </div>
      </Card>

      {/* Tickets list */}
      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Ubicación</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Wrench size={32} className="mx-auto mb-2 opacity-40" />
                    <p>No hay tickets con los filtros seleccionados</p>
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setDetail(t)}>
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-800 max-w-xs truncate">{t.descripcion}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    <p>{t.hotel?.nombre}</p>
                    <p>Piso {t.cuarto?.piso}, Cuarto {String(t.cuarto?.numero || '').padStart(2,'0')}</p>
                  </td>
                  <td className="px-4 py-3"><Badge value={t.prioridad} /></td>
                  <td className="px-4 py-3"><Badge value={t.estado} /></td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(t.fecha)}</td>
                  <td className="px-4 py-3"><ChevronRight size={16} className="text-gray-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Ticket de Mantenimiento">
        <TicketForm cuartos={cuartos} hotels={hotels} onSave={handleCreate} onCancel={() => setShowForm(false)} loading={loading} />
      </Modal>

      {detail && (
        <TicketDetail
          ticket={detail}
          cuartos={cuartos}
          hotels={hotels}
          onClose={() => setDetail(null)}
          onUpdate={handleUpdate}
          canWrite={canWrite}
        />
      )}
    </div>
  );
}
