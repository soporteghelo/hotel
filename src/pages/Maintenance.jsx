import React, { useState, useMemo } from 'react';
import { Plus, Wrench, ChevronRight, Search } from 'lucide-react';
import useStore from '../store/useStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input, { Select, Textarea } from '../components/ui/Input.jsx';
import { formatDate } from '../utils/dates.js';

const EMPTY_FORM = { idCuarto: '', descripcion: '', prioridad: 'media' };

const PRIORITY_BORDER = { alta: 'border-l-red-500', media: 'border-l-yellow-500', baja: 'border-l-blue-400' };

function TicketForm({ cuartos, hotels, onSave, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
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
        placeholder="Describe el problema en detalle..." rows={3} />
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
    abierto:    [{ value: 'en_proceso', label: 'Iniciar trabajo', variant: 'warning' }],
    en_proceso: [{ value: 'cerrado',    label: 'Marcar resuelto', variant: 'success' }],
    cerrado:    [],
  };
  return (
    <Modal isOpen title="Detalle del Ticket" onClose={onClose}
      footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {hotel?.nombre} — Piso {cuarto?.piso}, Cuarto {String(cuarto?.numero || '').padStart(2,'0')}
            </p>
            <p className="text-sm font-semibold text-gray-800">{ticket.descripcion}</p>
          </div>
          <Badge value={ticket.estado} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Prioridad</p>
            <Badge value={ticket.prioridad} />
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Fecha</p>
            <p className="text-sm font-semibold">{formatDate(ticket.fecha)}</p>
          </div>
        </div>
        {canWrite && nextStates[ticket.estado]?.length > 0 && (
          <div>
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
  const [search, setSearch] = useState('');

  const enriched = useMemo(() =>
    mantenimiento.map(t => ({
      ...t,
      cuarto: cuartos.find(c => c.id === t.idCuarto),
      hotel: hotels.find(h => h.id === cuartos.find(c => c.id === t.idCuarto)?.idHotel),
    })), [mantenimiento, cuartos, hotels]);

  const filtered = useMemo(() => {
    return enriched.filter(t => {
      if (filterEstado !== 'todos' && t.estado !== filterEstado) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.descripcion.toLowerCase().includes(q) && !(t.hotel?.nombre || '').toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (a.estado !== 'cerrado' && b.estado === 'cerrado') return -1;
      if (a.estado === 'cerrado' && b.estado !== 'cerrado') return 1;
      const o = { alta: 0, media: 1, baja: 2 };
      return (o[a.prioridad] || 0) - (o[b.prioridad] || 0);
    });
  }, [enriched, filterEstado, search]);

  const counts = useMemo(() => ({
    abiertos: mantenimiento.filter(t => t.estado === 'abierto').length,
    enProceso: mantenimiento.filter(t => t.estado === 'en_proceso').length,
    cerrados: mantenimiento.filter(t => t.estado === 'cerrado').length,
  }), [mantenimiento]);

  async function handleCreate(form) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    addMantenimiento({ ...form, estado: 'abierto', fecha: new Date().toISOString().split('T')[0] });
    addToast('Ticket creado. Camas marcadas como mantenimiento.', 'success');
    setLoading(false);
    setShowForm(false);
  }

  function handleUpdate(id, data) {
    updateMantenimiento(id, data);
    addToast(data.estado === 'cerrado' ? 'Ticket cerrado. Camas liberadas.' : 'Estado actualizado.', 'success');
  }

  return (
    <div className="space-y-3">
      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Abiertos',   value: counts.abiertos,  color: 'bg-red-50 border-red-200 text-red-700',    estado: 'abierto' },
          { label: 'En Proceso', value: counts.enProceso, color: 'bg-yellow-50 border-yellow-200 text-yellow-700', estado: 'en_proceso' },
          { label: 'Cerrados',   value: counts.cerrados,  color: 'bg-gray-50 border-gray-200 text-gray-600', estado: 'cerrado' },
        ].map(s => (
          <button key={s.label} onClick={() => setFilterEstado(filterEstado === s.estado ? 'todos' : s.estado)}
            className={`border rounded-2xl p-3 text-center transition-all ${s.color} ${filterEstado === s.estado ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search + New */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        {canWrite && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
        )}
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <Wrench size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay tickets</p>
          </div>
        ) : filtered.map(t => (
          <button key={t.id} onClick={() => setDetail(t)}
            className={`mobile-card w-full text-left border-l-4 ${PRIORITY_BORDER[t.prioridad] || 'border-l-gray-300'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-semibold text-gray-800 text-sm line-clamp-2 flex-1">{t.descripcion}</p>
              <Badge value={t.estado} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {t.hotel?.nombre} · P{t.cuarto?.piso} C{String(t.cuarto?.numero || '').padStart(2,'0')}
              </p>
              <div className="flex items-center gap-2">
                <Badge value={t.prioridad} size="xs" />
                <span className="text-xs text-gray-400">{formatDate(t.fecha)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prioridad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <Wrench size={28} className="mx-auto mb-2 opacity-40" />
                      <p>No hay tickets</p>
                    </td>
                  </tr>
                ) : filtered.map(t => (
                  <tr key={t.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setDetail(t)}>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800 max-w-xs truncate">{t.descripcion}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>{t.hotel?.nombre}</p>
                      <p>P{t.cuarto?.piso} C{String(t.cuarto?.numero || '').padStart(2,'0')}</p>
                    </td>
                    <td className="px-4 py-3"><Badge value={t.prioridad} /></td>
                    <td className="px-4 py-3"><Badge value={t.estado} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.fecha)}</td>
                    <td className="px-4 py-3"><ChevronRight size={16} className="text-gray-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Ticket de Mantenimiento">
        <TicketForm cuartos={cuartos} hotels={hotels} onSave={handleCreate}
          onCancel={() => setShowForm(false)} loading={loading} />
      </Modal>
      {detail && (
        <TicketDetail ticket={detail} cuartos={cuartos} hotels={hotels}
          onClose={() => setDetail(null)} onUpdate={handleUpdate} canWrite={canWrite} />
      )}
    </div>
  );
}
