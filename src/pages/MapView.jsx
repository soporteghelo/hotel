import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Wrench, X, CheckCircle, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import useStore from '../store/useStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { formatDate } from '../utils/dates.js';
import { getFullBedDescription } from '../utils/bedCodes.js';

const BED_COLORS = {
  libre: 'bg-green-500 hover:bg-green-400 border-green-600',
  ocupada: 'bg-red-500 hover:bg-red-400 border-red-600',
  reservada: 'bg-yellow-400 hover:bg-yellow-300 border-yellow-500',
  mantenimiento: 'bg-gray-400 hover:bg-gray-300 border-gray-500',
  limpieza: 'bg-blue-400 hover:bg-blue-300 border-blue-500',
};

const BED_LABELS = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  mantenimiento: 'Mant.',
  limpieza: 'Limpieza',
};

function BedSlot({ cama, onClick }) {
  const colorClass = BED_COLORS[cama.estado] || BED_COLORS.mantenimiento;
  return (
    <button
      onClick={() => onClick(cama)}
      className={`
        ${colorClass} border rounded text-white text-xs font-bold
        flex flex-col items-center justify-center p-1 w-full h-12
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/50
        cursor-pointer select-none
      `}
      title={`${cama.codigo} - ${BED_LABELS[cama.estado]}`}
    >
      <span className="text-[10px] leading-none">{cama.nivel}</span>
      <span className="text-[9px] leading-none opacity-80">{BED_LABELS[cama.estado]}</span>
    </button>
  );
}

function RoomCard({ cuarto, camas, onClick }) {
  const allCamas = [
    camas.find(c => c.camarote === 1 && c.nivel === 'SUP'),
    camas.find(c => c.camarote === 2 && c.nivel === 'SUP'),
    camas.find(c => c.camarote === 1 && c.nivel === 'INF'),
    camas.find(c => c.camarote === 2 && c.nivel === 'INF'),
  ].filter(Boolean);

  const hasOcupada = camas.some(c => c.estado === 'ocupada');
  const hasLibre = camas.some(c => c.estado === 'libre');
  const allMant = camas.every(c => c.estado === 'mantenimiento');

  return (
    <div className={`
      bg-white rounded-xl border-2 p-3 shadow-sm
      ${allMant ? 'border-gray-300' : hasOcupada ? 'border-red-200' : hasLibre ? 'border-green-200' : 'border-yellow-200'}
    `}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-600">Cuarto {String(cuarto.numero).padStart(2, '0')}</span>
        <span className="text-xs text-gray-400">P{cuarto.piso}</span>
      </div>
      {/* 2x2 grid: top row = SUP, bottom row = INF; left = C1, right = C2 */}
      <div className="grid grid-cols-2 gap-1">
        {[
          camas.find(c => c.camarote === 1 && c.nivel === 'SUP'),
          camas.find(c => c.camarote === 2 && c.nivel === 'SUP'),
          camas.find(c => c.camarote === 1 && c.nivel === 'INF'),
          camas.find(c => c.camarote === 2 && c.nivel === 'INF'),
        ].map((cama, i) =>
          cama ? (
            <BedSlot key={cama.id} cama={cama} onClick={onClick} />
          ) : (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          )
        )}
      </div>
      <div className="flex gap-1 mt-1 justify-between text-[9px] text-gray-400">
        <span>C1</span>
        <span>C2</span>
      </div>
    </div>
  );
}

export default function MapView() {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { addToast } = useToast();

  const hotels = useStore(s => s.hotels);
  const cuartos = useStore(s => s.cuartos);
  const camas = useStore(s => s.camas);
  const asignaciones = useStore(s => s.asignaciones);
  const huespedes = useStore(s => s.huespedes);
  const updateCamaEstado = useStore(s => s.updateCamaEstado);

  const [selectedHotel, setSelectedHotel] = useState(hotels[0]?.id || '');
  const [selectedPiso, setSelectedPiso] = useState(1);
  const [selectedCama, setSelectedCama] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const hotel = hotels.find(h => h.id === selectedHotel);
  const pisos = hotel ? Array.from({ length: hotel.nPisos }, (_, i) => i + 1) : [];

  const cuartosEnPiso = useMemo(() =>
    cuartos.filter(c => c.idHotel === selectedHotel && c.piso === selectedPiso)
      .sort((a, b) => a.numero - b.numero),
    [cuartos, selectedHotel, selectedPiso]
  );

  function handleBedClick(cama) {
    setSelectedCama(cama);
    setModalOpen(true);
  }

  const activaAsig = selectedCama
    ? asignaciones.find(a => a.idCama === selectedCama.id && (a.estado === 'activa' || a.estado === 'reservada'))
    : null;

  const huesped = activaAsig
    ? huespedes.find(h => h.id === activaAsig.idHuesped)
    : selectedCama?.idHuespedActual
    ? huespedes.find(h => h.id === selectedCama.idHuespedActual)
    : null;

  function handleSetMaintenance() {
    if (!selectedCama) return;
    updateCamaEstado(selectedCama.id, 'mantenimiento');
    addToast('Cama marcada como mantenimiento', 'warning');
    setModalOpen(false);
  }

  function handleSetLibre() {
    if (!selectedCama) return;
    updateCamaEstado(selectedCama.id, 'libre');
    addToast('Cama liberada', 'success');
    setModalOpen(false);
  }

  // Summary stats for current floor
  const camasEnPiso = useMemo(() => {
    const ids = cuartosEnPiso.map(c => c.id);
    return camas.filter(c => ids.includes(c.idCuarto));
  }, [camas, cuartosEnPiso]);

  const stats = {
    libre: camasEnPiso.filter(c => c.estado === 'libre').length,
    ocupada: camasEnPiso.filter(c => c.estado === 'ocupada').length,
    reservada: camasEnPiso.filter(c => c.estado === 'reservada').length,
    mantenimiento: camasEnPiso.filter(c => c.estado === 'mantenimiento' || c.estado === 'limpieza').length,
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Pabellón</label>
            <select
              value={selectedHotel}
              onChange={e => { setSelectedHotel(e.target.value); setSelectedPiso(1); }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {hotels.map(h => (
                <option key={h.id} value={h.id}>{h.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Piso</label>
            <div className="flex gap-2">
              {pisos.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPiso(p)}
                  className={`
                    px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors
                    ${selectedPiso === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  Piso {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floor stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Libre', value: stats.libre, color: 'bg-green-500' },
          { label: 'Ocupada', value: stats.ocupada, color: 'bg-red-500' },
          { label: 'Reservada', value: stats.reservada, color: 'bg-yellow-400' },
          { label: 'Mant./Limpieza', value: stats.mantenimiento, color: 'bg-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${s.color} flex-shrink-0`} />
            <div>
              <p className="text-lg font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Room grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">
          Piso {selectedPiso} — {cuartosEnPiso.length} cuartos
        </h3>
        {cuartosEnPiso.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No hay cuartos en este piso</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {cuartosEnPiso.map(cuarto => {
              const camasCuarto = camas.filter(c => c.idCuarto === cuarto.id);
              return (
                <RoomCard
                  key={cuarto.id}
                  cuarto={cuarto}
                  camas={camasCuarto}
                  onClick={handleBedClick}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-medium text-gray-500 mb-3">Leyenda</p>
        <div className="flex flex-wrap gap-4">
          {[
            { color: 'bg-green-500', label: 'Libre' },
            { color: 'bg-red-500', label: 'Ocupada' },
            { color: 'bg-yellow-400', label: 'Reservada' },
            { color: 'bg-gray-400', label: 'Mantenimiento' },
            { color: 'bg-blue-400', label: 'Limpieza' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Haz clic en cualquier cama para ver detalles y opciones. INF = Inferior, SUP = Superior. C1/C2 = Camarote 1 o 2.
        </p>
      </div>

      {/* Bed detail modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCama ? `Cama ${selectedCama.codigo}` : 'Detalle de Cama'}
        size="sm"
        footer={
          <div className="flex flex-wrap gap-2 w-full">
            {canWrite && selectedCama?.estado !== 'mantenimiento' && (
              <Button variant="warning" size="sm" onClick={handleSetMaintenance}>
                <Wrench size={14} /> Marcar Mantenimiento
              </Button>
            )}
            {canWrite && (selectedCama?.estado === 'mantenimiento' || selectedCama?.estado === 'limpieza') && (
              <Button variant="success" size="sm" onClick={handleSetLibre}>
                <CheckCircle size={14} /> Marcar Libre
              </Button>
            )}
            {canWrite && selectedCama?.estado === 'libre' && (
              <Button variant="primary" size="sm" onClick={() => { setModalOpen(false); navigate('/checkin'); }}>
                <LogIn size={14} /> Hacer Check-In
              </Button>
            )}
            {canWrite && selectedCama?.estado === 'ocupada' && (
              <Button variant="outline" size="sm" onClick={() => { setModalOpen(false); navigate('/checkout'); }}>
                <LogOut size={14} /> Hacer Check-Out
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)} className="ml-auto">
              Cerrar
            </Button>
          </div>
        }
      >
        {selectedCama && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded ${BED_COLORS[selectedCama.estado]?.split(' ')[0] || 'bg-gray-400'}`} />
              <div>
                <p className="font-semibold text-gray-800">{selectedCama.codigo}</p>
                <p className="text-sm text-gray-500">{getFullBedDescription(selectedCama.codigo)}</p>
              </div>
              <Badge value={selectedCama.estado} className="ml-auto" />
            </div>

            {huesped ? (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={16} />
                  <p className="font-medium">{huesped.nombre}</p>
                </div>
                <p className="text-sm text-gray-500 pl-6">{huesped.empresa} — {huesped.cargo}</p>
                {huesped.telefono && (
                  <p className="text-sm text-gray-500 pl-6">{huesped.telefono}</p>
                )}
                {activaAsig && (
                  <div className="flex items-center gap-2 text-gray-500 pl-6">
                    <Calendar size={14} />
                    <p className="text-xs">
                      Llegada: {formatDate(activaAsig.fechaLlegada)} →{' '}
                      Salida est.: {formatDate(activaAsig.fechaSalidaEstimada)}
                    </p>
                  </div>
                )}
                {huesped.observaciones && (
                  <div className="flex items-start gap-2 text-gray-500 pl-6">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs">{huesped.observaciones}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm">
                {selectedCama.estado === 'libre' ? 'Cama disponible para asignación' : 'Sin huésped asignado'}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
