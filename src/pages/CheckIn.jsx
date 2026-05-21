import React, { useState, useMemo } from 'react';
import { Search, User, BedDouble, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import useStore from '../store/useStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import { todayISO, formatDate } from '../utils/dates.js';

const BED_COLORS = {
  libre: 'bg-green-500',
  reservada: 'bg-yellow-400',
  ocupada: 'bg-red-500',
  mantenimiento: 'bg-gray-400',
  limpieza: 'bg-blue-400',
};

function StepIndicator({ step }) {
  const steps = ['Seleccionar Huésped', 'Elegir Cama', 'Confirmar'];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i + 1 < step ? 'bg-green-500 text-white' :
              i + 1 === step ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CheckIn() {
  const { addToast } = useToast();
  const { canWrite } = useAuth();
  const huespedes = useStore(s => s.huespedes);
  const asignaciones = useStore(s => s.asignaciones);
  const camas = useStore(s => s.camas);
  const cuartos = useStore(s => s.cuartos);
  const hotels = useStore(s => s.hotels);
  const checkIn = useStore(s => s.checkIn);

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedCuarto, setSelectedCuarto] = useState(null);
  const [fechaLlegada, setFechaLlegada] = useState(todayISO());
  const [fechaSalidaEst, setFechasSalidaEst] = useState('');
  const [loading, setLoading] = useState(false);

  // Guests without active assignment
  const availableGuests = useMemo(() => {
    const activeGuestIds = new Set(asignaciones.filter(a => a.estado === 'activa').map(a => a.idHuesped));
    return huespedes.filter(h => h.activo && !activeGuestIds.has(h.id));
  }, [huespedes, asignaciones]);

  const filteredGuests = useMemo(() => {
    const q = search.toLowerCase();
    return availableGuests.filter(h =>
      h.nombre.toLowerCase().includes(q) ||
      h.rut.toLowerCase().includes(q) ||
      (h.empresa || '').toLowerCase().includes(q)
    );
  }, [availableGuests, search]);

  // Free beds grouped by cuarto
  const freeBedsByCuarto = useMemo(() => {
    const freeBeds = camas.filter(b => b.estado === 'libre' || b.estado === 'reservada');
    const map = {};
    freeBeds.forEach(b => {
      if (!map[b.idCuarto]) map[b.idCuarto] = [];
      map[b.idCuarto].push(b);
    });
    return map;
  }, [camas]);

  const cuartosWithFreeBeds = useMemo(() => {
    return cuartos.filter(c => freeBedsByCuarto[c.id]?.length > 0);
  }, [cuartos, freeBedsByCuarto]);

  function getBedInCuarto(cuartoId, camarote, nivel) {
    return camas.find(b => b.idCuarto === cuartoId && b.camarote === camarote && b.nivel === nivel);
  }

  function getCuartoHotelName(cuartoId) {
    const c = cuartos.find(q => q.id === cuartoId);
    const h = hotels.find(h => h.id === c?.idHotel);
    return h ? `${h.nombre} — Piso ${c.piso}` : '';
  }

  async function handleConfirm() {
    if (!selectedGuest || !selectedBed || !fechaLlegada || !fechaSalidaEst) {
      addToast('Completa todos los campos requeridos', 'warning');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const result = checkIn({
      idHuesped: selectedGuest.id,
      idCama: selectedBed.id,
      fechaLlegada,
      fechaSalidaEstimada: fechaSalidaEst,
    });
    setLoading(false);
    if (result.success) {
      addToast(`Check-In exitoso: ${selectedGuest.nombre} → ${selectedBed.codigo}`, 'success');
      setStep(1);
      setSearch('');
      setSelectedGuest(null);
      setSelectedBed(null);
      setSelectedCuarto(null);
      setFechaLlegada(todayISO());
      setFechasSalidaEst('');
    } else {
      addToast(result.error || 'Error al realizar el check-in', 'error');
    }
  }

  if (!canWrite) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-400">
          <p>No tienes permisos para realizar check-in</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card>
        <StepIndicator step={step} />

        {/* Step 1: Select guest */}
        {step === 1 && (
          <div className="space-y-4">
            <CardHeader title="Seleccionar Huésped" subtitle={`${availableGuests.length} trabajadores sin asignación activa`} />
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                placeholder="Buscar por nombre, RUT o empresa..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredGuests.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{search ? 'Sin resultados' : 'Todos los huéspedes tienen asignación activa'}</p>
                </div>
              ) : filteredGuests.map(h => (
                <button
                  key={h.id}
                  onClick={() => { setSelectedGuest(h); setStep(2); }}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-700">{h.nombre.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{h.nombre}</p>
                    <p className="text-xs text-gray-500 truncate">{h.empresa} — {h.cargo}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select bed */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(1)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Elegir Cama</h3>
                <p className="text-sm text-gray-500">
                  Huésped: <span className="font-medium text-blue-600">{selectedGuest?.nombre}</span>
                </p>
              </div>
            </div>

            {cuartosWithFreeBeds.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BedDouble size={32} className="mx-auto mb-2 opacity-40" />
                <p>No hay camas disponibles</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cuartosWithFreeBeds.map(cuarto => {
                  const hotel = hotels.find(h => h.id === cuarto.idHotel);
                  return (
                    <div key={cuarto.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Cuarto {String(cuarto.numero).padStart(2, '0')} — Piso {cuarto.piso}
                          </p>
                          <p className="text-xs text-gray-500">{hotel?.nombre}</p>
                        </div>
                        <Badge value={cuarto.estado} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2].map(cam => (
                          <div key={cam}>
                            <p className="text-xs text-gray-500 mb-1 font-medium">Camarote {cam}</p>
                            <div className="space-y-1.5">
                              {['INF', 'SUP'].map(nivel => {
                                const bed = getBedInCuarto(cuarto.id, cam, nivel);
                                if (!bed) return null;
                                const isAvailable = bed.estado === 'libre' || bed.estado === 'reservada';
                                const isSelected = selectedBed?.id === bed.id;
                                return (
                                  <button
                                    key={nivel}
                                    disabled={!isAvailable}
                                    onClick={() => { setSelectedBed(bed); setSelectedCuarto(cuarto); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                                      isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : isAvailable
                                          ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                                          : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <span className="font-medium">{nivel === 'INF' ? 'Inferior' : 'Superior'}</span>
                                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : BED_COLORS[bed.estado] || 'bg-gray-300'}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedBed && (
              <div className="flex justify-end">
                <Button onClick={() => setStep(3)}>
                  Continuar <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(2)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={18} />
              </button>
              <h3 className="text-base font-semibold text-gray-800">Confirmar Check-In</h3>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div>
                <p className="text-xs text-blue-500 font-medium">Huésped</p>
                <p className="text-sm font-bold text-blue-900">{selectedGuest?.nombre}</p>
                <p className="text-xs text-blue-600">{selectedGuest?.empresa}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500 font-medium">Cama Asignada</p>
                <p className="text-sm font-bold text-blue-900 font-mono">{selectedBed?.codigo}</p>
                <p className="text-xs text-blue-600">
                  Cuarto {String(selectedCuarto?.numero).padStart(2,'0')} — Piso {selectedCuarto?.piso}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de Llegada"
                type="date"
                required
                value={fechaLlegada}
                onChange={e => setFechaLlegada(e.target.value)}
              />
              <Input
                label="Fecha Salida Estimada"
                type="date"
                required
                value={fechaSalidaEst}
                min={fechaLlegada}
                onChange={e => setFechasSalidaEst(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Cancelar</Button>
              <Button
                variant="success"
                loading={loading}
                disabled={!fechaLlegada || !fechaSalidaEst}
                onClick={handleConfirm}
              >
                <CheckCircle size={16} /> Confirmar Check-In
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
