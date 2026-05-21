import React, { useState, useMemo } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight as ChevRight } from 'lucide-react';
import useStore from '../store/useStore.js';
import Card from '../components/ui/Card.jsx';
import { formatDateTime, formatRelative } from '../utils/dates.js';

const PAGE_SIZE = 20;

const ACTION_COLORS = {
  CHECK_IN:          'bg-green-100 text-green-700',
  CHECK_OUT:         'bg-blue-100 text-blue-700',
  CREAR_HUESPED:     'bg-purple-100 text-purple-700',
  EDITAR_HUESPED:    'bg-yellow-100 text-yellow-700',
  ELIMINAR_HUESPED:  'bg-red-100 text-red-700',
  CREAR_TICKET:      'bg-orange-100 text-orange-700',
  EDITAR_TICKET:     'bg-orange-100 text-orange-600',
  CAMBIAR_ESTADO_CAMA:'bg-teal-100 text-teal-700',
  EDITAR_PERFIL:     'bg-indigo-100 text-indigo-700',
  LOGIN:             'bg-gray-100 text-gray-600',
  LOGOUT:            'bg-gray-100 text-gray-500',
};

export default function AuditLog() {
  const logAuditoria = useStore(s => s.logAuditoria);

  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('todos');
  const [filterEntidad, setFilterEntidad] = useState('todos');
  const [page, setPage] = useState(1);

  const uniqueUsers = useMemo(() => {
    const set = new Set(logAuditoria.map(l => l.usuario));
    return Array.from(set).sort();
  }, [logAuditoria]);

  const uniqueEntidades = useMemo(() => {
    const set = new Set(logAuditoria.map(l => l.entidad));
    return Array.from(set).sort();
  }, [logAuditoria]);

  const filtered = useMemo(() => {
    return logAuditoria.filter(l => {
      if (filterUser !== 'todos' && l.usuario !== filterUser) return false;
      if (filterEntidad !== 'todos' && l.entidad !== filterEntidad) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.accion.toLowerCase().includes(q) &&
            !l.usuario.toLowerCase().includes(q) &&
            !l.entidad.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logAuditoria, filterUser, filterEntidad, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function formatValue(val) {
    if (!val) return '—';
    if (typeof val === 'object') {
      const str = JSON.stringify(val);
      return str.length > 60 ? str.slice(0, 58) + '…' : str;
    }
    return String(val);
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar acción, usuario, entidad..."
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="grid grid-cols-2 gap-2">
          <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos los usuarios</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filterEntidad} onChange={e => { setFilterEntidad(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todas las entidades</option>
            {uniqueEntidades.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">{filtered.length} registros</p>
          {(search || filterUser !== 'todos' || filterEntidad !== 'todos') && (
            <button onClick={() => { setSearch(''); setFilterUser('todos'); setFilterEntidad('todos'); setPage(1); }}
              className="text-xs text-blue-600 hover:text-blue-800">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Mobile: card feed */}
      <div className="md:hidden space-y-2">
        {paginated.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <ClipboardList size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin registros</p>
          </div>
        ) : paginated.map(entry => (
          <div key={entry.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[entry.accion] || 'bg-gray-100 text-gray-600'}`}>
                {entry.accion.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(entry.timestamp)}</span>
            </div>
            <p className="text-sm font-medium text-gray-700 truncate">{entry.usuario}</p>
            <p className="text-xs text-gray-400 mt-0.5">{entry.entidad}</p>
            {entry.valorNuevo && (
              <p className="text-xs text-gray-400 font-mono mt-1 truncate">{formatValue(entry.valorNuevo)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha/Hora</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entidad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor Nuevo</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <ClipboardList size={28} className="mx-auto mb-2 opacity-40" />
                      <p>Sin registros con los filtros seleccionados</p>
                    </td>
                  </tr>
                ) : paginated.map(entry => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(entry.timestamp)}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700 max-w-[140px] truncate">{entry.usuario}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[entry.accion] || 'bg-gray-100 text-gray-600'}`}>
                        {entry.accion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{entry.entidad}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-[200px] truncate">
                      {formatValue(entry.valorNuevo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">Pág. {currentPage} de {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium ${pg === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                  <ChevRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile pagination */}
      {totalPages > 1 && (
        <div className="md:hidden flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40">
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="text-sm text-gray-500">Pág. {currentPage}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40">
            Siguiente <ChevRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
