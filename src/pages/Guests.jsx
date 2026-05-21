import React, { useState, useMemo } from 'react';
import { Search, Plus, User, Phone, Building, ChevronRight, Trash2, Edit, X } from 'lucide-react';
import useStore from '../store/useStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input, { Textarea } from '../components/ui/Input.jsx';
import { formatDate } from '../utils/dates.js';
import { getFullBedDescription } from '../utils/bedCodes.js';

const EMPTY_FORM = { nombre: '', rut: '', empresa: '', cargo: '', telefono: '', observaciones: '' };

function GuestForm({ initial = EMPTY_FORM, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.rut.trim()) return;
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nombre completo" required value={form.nombre}
          onChange={e => set('nombre', e.target.value)} placeholder="Juan Pérez González" />
        <Input label="RUT / DNI" required value={form.rut}
          onChange={e => set('rut', e.target.value)} placeholder="12.345.678-9" />
        <Input label="Empresa" value={form.empresa}
          onChange={e => set('empresa', e.target.value)} placeholder="Codelco" />
        <Input label="Cargo" value={form.cargo}
          onChange={e => set('cargo', e.target.value)} placeholder="Operador de Maquinaria" />
        <Input label="Teléfono" value={form.telefono}
          onChange={e => set('telefono', e.target.value)} placeholder="+56912345678" className="sm:col-span-2" />
      </div>
      <Textarea label="Observaciones" value={form.observaciones}
        onChange={e => set('observaciones', e.target.value)} placeholder="Notas adicionales..." rows={2} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" loading={loading}>Guardar</Button>
      </div>
    </form>
  );
}

function DetailModal({ huesped, onClose, onEdit, onDelete, canWrite, isAdmin }) {
  const asignaciones = useStore(s => s.asignaciones);
  const camas = useStore(s => s.camas);

  const historial = asignaciones
    .filter(a => a.idHuesped === huesped.id)
    .sort((a, b) => b.fechaLlegada.localeCompare(a.fechaLlegada));

  const asigActiva = historial.find(a => a.estado === 'activa');
  const camaActual = asigActiva ? camas.find(c => c.id === asigActiva.idCama) : null;

  return (
    <Modal isOpen title={`Detalle: ${huesped.nombre}`} onClose={onClose} size="lg"
      footer={
        <>
          {isAdmin && (
            <Button variant="danger" size="sm" onClick={() => onDelete(huesped.id)}>
              <Trash2 size={14} /> Eliminar
            </Button>
          )}
          {canWrite && (
            <Button variant="outline" size="sm" onClick={() => onEdit(huesped)}>
              <Edit size={14} /> Editar
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Header info */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-blue-700">{huesped.nombre.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{huesped.nombre}</h3>
            <p className="text-sm text-gray-500">{huesped.cargo} — {huesped.empresa}</p>
            <p className="text-sm text-gray-400">{huesped.rut}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Teléfono', value: huesped.telefono || '—' },
            { label: 'Estado', value: huesped.activo ? 'Activo' : 'Inactivo' },
            { label: 'Cama actual', value: camaActual ? camaActual.codigo : 'Sin asignación' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm font-semibold text-gray-800">{item.value}</p>
            </div>
          ))}
          {huesped.observaciones && (
            <div className="bg-gray-50 rounded-xl p-3 col-span-2">
              <p className="text-xs text-gray-500">Observaciones</p>
              <p className="text-sm text-gray-700">{huesped.observaciones}</p>
            </div>
          )}
        </div>

        {/* History */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Historial de Estadías ({historial.length})</h4>
          {historial.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin estadías registradas</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {historial.map(a => {
                const cama = camas.find(c => c.id === a.idCama);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl text-sm">
                    <div>
                      <p className="font-medium text-gray-700">{cama?.codigo || '—'}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(a.fechaLlegada)} → {formatDate(a.fechaSalidaReal || a.fechaSalidaEstimada)}
                      </p>
                    </div>
                    <Badge value={a.estado} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function Guests() {
  const { isAdmin, canWrite } = useAuth();
  const { addToast } = useToast();
  const huespedes = useStore(s => s.huespedes);
  const asignaciones = useStore(s => s.asignaciones);
  const camas = useStore(s => s.camas);
  const addHuesped = useStore(s => s.addHuesped);
  const updateHuesped = useStore(s => s.updateHuesped);
  const deleteHuesped = useStore(s => s.deleteHuesped);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return huespedes.filter(h =>
      h.activo &&
      (h.nombre.toLowerCase().includes(q) ||
       h.rut.toLowerCase().includes(q) ||
       (h.empresa || '').toLowerCase().includes(q))
    );
  }, [huespedes, search]);

  function getCurrentBed(huespedId) {
    const asig = asignaciones.find(a => a.idHuesped === huespedId && a.estado === 'activa');
    if (!asig) return null;
    return camas.find(c => c.id === asig.idCama);
  }

  async function handleSave(form) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    if (editing) {
      updateHuesped(editing.id, form);
      addToast('Huésped actualizado', 'success');
      setEditing(null);
    } else {
      addHuesped(form);
      addToast('Huésped registrado correctamente', 'success');
      setShowForm(false);
    }
    setLoading(false);
  }

  function handleDelete(id) {
    deleteHuesped(id);
    setDetail(null);
    addToast('Huésped eliminado del sistema', 'warning');
  }

  function handleEdit(h) {
    setDetail(null);
    setEditing(h);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, RUT o empresa..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {canWrite && (
            <Button onClick={() => { setShowForm(true); setEditing(null); }}>
              <Plus size={16} /> Nuevo Huésped
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">RUT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cama</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <User size={32} className="mx-auto mb-2 opacity-40" />
                    <p>{search ? 'Sin resultados para la búsqueda' : 'No hay huéspedes registrados'}</p>
                  </td>
                </tr>
              ) : filtered.map(h => {
                const cama = getCurrentBed(h.id);
                return (
                  <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetail(h)}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">{h.nombre.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-800">{h.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{h.rut}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{h.empresa}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{h.cargo}</td>
                    <td className="px-4 py-3">
                      {cama ? (
                        <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-mono font-semibold">
                          {cama.codigo}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin asignación</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={16} className="text-gray-400" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} huésped{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </div>
      </Card>

      {/* Add modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Huésped">
        <GuestForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={loading} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar Huésped">
        {editing && (
          <GuestForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} loading={loading} />
        )}
      </Modal>

      {/* Detail modal */}
      {detail && (
        <DetailModal
          huesped={detail}
          onClose={() => setDetail(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canWrite={canWrite}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
