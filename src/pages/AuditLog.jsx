import React, { useState, useMemo } from 'react';
import { ClipboardList, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore.js';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import { formatDateTime } from '../utils/dates.js';

const PAGE_SIZE = 20;

const ACTION_COLORS = {
  CHECK_IN: 'bg-green-100 text-green-700',
  CHECK_OUT: 'bg-blue-100 text-blue-700',
  CREAR_HUESPED: 'bg-purple-100 text-purple-700',
  EDITAR_HUESPED: 'bg-yellow-100 text-yellow-700',
  ELIMINAR_HUESPED: 'bg-red-100 text-red-700',
  CREAR_TICKET: 'bg-orange-100 text-orange-700',
  EDITAR_TICKET: 'bg-orange-100 text-orange-600',
  CAMBIAR_ESTADO_CAMA: 'bg-teal-100 text-teal-700',
  LOGIN: 'bg-gray-100 text-gray-600',
  LOGOUT: 'bg-gray-100 text-gray-500',
};

export default function AuditLog() {
  const logAuditoria = useStore(s => s.logAuditoria);
  const usuarios = useStore(s => s.usuarios);

  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('todos');
  const [filterEntidad, setFilterEntidad] = useState('todos');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
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
      if (filterFechaDesde && l.timestamp < filterFechaDesde) return false;
      if (filterFechaHasta && l.timestamp > filterFechaHasta + 'T23:59:59') return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.accion.toLowerCase().includes(q) &&
          !l.usuario.toLowerCase().includes(q) &&
          !l.entidad.toLowerCase().includes(q) &&
          !(l.idAfectado || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [logAuditoria, filterUser, filterEntidad, filterFechaDesde, filterFechaHasta, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetFilters() {
    setSearch('');
    setFilterUser('todos');
    setFilterEntidad('todos');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setPage(1);
  }

  function formatValue(val) {
    if (!val) return '—';
    if (typeof val === 'object') return JSON.stringify(val, null, 0).slice(0, 60) + (JSON.stringify(val).length > 60 ? '…' : '');
    return String(val);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar en el log..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos los usuarios</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filterEntidad} onChange={e => { setFilterEntidad(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todas las entidades</option>
            {uniqueEntidades.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={filterFechaDesde} onChange={e => { setFilterFechaDesde(e.target.value); setPage(1); }}
              className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="date" value={filterFechaHasta} onChange={e => { setFilterFechaHasta(e.target.value); setPage(1); }}
              className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">{filtered.length} registros</p>
          {(search || filterUser !== 'todos' || filterEntidad !== 'todos' || filterFechaDesde || filterFechaHasta) && (
            <button onClick={resetFilters} className="text-xs text-blue-600 hover:text-blue-800">Limpiar filtros</button>
          )}
        </div>
      </Card>

      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha/Hora</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Entidad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Valor Nuevo</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
                    <p>No hay registros con los filtros seleccionados</p>
                  </td>
                </tr>
              ) : paginated.map(entry => (
                <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDateTime(entry.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-700 truncate max-w-[140px]">{entry.usuario}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[entry.accion] || 'bg-gray-100 text-gray-600'}`}>
                      {entry.accion.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{entry.entidad}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-[200px]">
                    <span className="font-mono truncate block">{formatValue(entry.valorNuevo)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
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
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
