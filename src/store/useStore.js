import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateSeedData } from '../utils/seedData.js';
import { nowISO } from '../utils/dates.js';

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const useStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      hotels: [],
      cuartos: [],
      camas: [],
      huespedes: [],
      asignaciones: [],
      usuarios: [],
      logAuditoria: [],
      mantenimiento: [],
      currentUser: null,
      initialized: false,

      // ========== INIT ==========
      initializeData: () => {
        const state = get();
        if (!state.initialized) {
          const seed = generateSeedData();
          set({
            ...seed,
            initialized: true,
          });
        }
      },

      // ========== AUTH ==========
      login: (email, password) => {
        const { usuarios } = get();
        const user = usuarios.find(
          u => u.email === email && u.password === password && u.activo
        );
        if (user) {
          set({ currentUser: user });
          get().addLog('LOGIN', 'Usuario', user.id, null, { email: user.email });
          return { success: true, user };
        }
        return { success: false, error: 'Credenciales inválidas' };
      },

      logout: () => {
        const { currentUser } = get();
        if (currentUser) {
          get().addLog('LOGOUT', 'Usuario', currentUser.id, null, { email: currentUser.email });
        }
        set({ currentUser: null });
      },

      // ========== AUDIT LOG ==========
      addLog: (accion, entidad, idAfectado, valorAnterior, valorNuevo) => {
        const { currentUser, logAuditoria } = get();
        const entry = {
          id: generateId('log'),
          timestamp: nowISO(),
          usuario: currentUser?.email || 'sistema',
          accion,
          entidad,
          idAfectado: idAfectado || '',
          valorAnterior: valorAnterior || null,
          valorNuevo: valorNuevo || null,
        };
        set({ logAuditoria: [entry, ...logAuditoria] });
      },

      // ========== HOTELS ==========
      addHotel: (data) => {
        const hotel = { id: generateId('h'), ...data };
        set(s => ({ hotels: [...s.hotels, hotel] }));
        get().addLog('CREAR_HOTEL', 'Hotel', hotel.id, null, data);
        return hotel;
      },

      updateHotel: (id, data) => {
        const prev = get().hotels.find(h => h.id === id);
        set(s => ({
          hotels: s.hotels.map(h => h.id === id ? { ...h, ...data } : h),
        }));
        get().addLog('EDITAR_HOTEL', 'Hotel', id, prev, data);
      },

      // ========== CUARTOS ==========
      addCuarto: (data) => {
        const cuarto = { id: generateId('c'), ...data };
        set(s => ({ cuartos: [...s.cuartos, cuarto] }));
        get().addLog('CREAR_CUARTO', 'Cuarto', cuarto.id, null, data);
        return cuarto;
      },

      updateCuarto: (id, data) => {
        const prev = get().cuartos.find(c => c.id === id);
        set(s => ({
          cuartos: s.cuartos.map(c => c.id === id ? { ...c, ...data } : c),
        }));
        get().addLog('EDITAR_CUARTO', 'Cuarto', id, prev, data);
      },

      // ========== CAMAS ==========
      updateCama: (id, data) => {
        const prev = get().camas.find(c => c.id === id);
        set(s => ({
          camas: s.camas.map(c => c.id === id ? { ...c, ...data } : c),
        }));
        get().addLog('EDITAR_CAMA', 'Cama', id, prev, data);
      },

      // ========== HUESPEDES ==========
      addHuesped: (data) => {
        const huesped = { id: generateId('hsp'), activo: true, ...data };
        set(s => ({ huespedes: [...s.huespedes, huesped] }));
        get().addLog('CREAR_HUESPED', 'Huesped', huesped.id, null, data);
        return huesped;
      },

      updateHuesped: (id, data) => {
        const prev = get().huespedes.find(h => h.id === id);
        set(s => ({
          huespedes: s.huespedes.map(h => h.id === id ? { ...h, ...data } : h),
        }));
        get().addLog('EDITAR_HUESPED', 'Huesped', id, prev, data);
      },

      deleteHuesped: (id) => {
        const prev = get().huespedes.find(h => h.id === id);
        set(s => ({
          huespedes: s.huespedes.map(h => h.id === id ? { ...h, activo: false } : h),
        }));
        get().addLog('ELIMINAR_HUESPED', 'Huesped', id, prev, { activo: false });
      },

      // ========== CHECK-IN ==========
      checkIn: ({ idHuesped, idCama, fechaLlegada, fechaSalidaEstimada }) => {
        const { camas, cuartos, huespedes, asignaciones } = get();
        const cama = camas.find(c => c.id === idCama);
        const huesped = huespedes.find(h => h.id === idHuesped);
        if (!cama || !huesped) return { success: false, error: 'Cama o huésped no encontrado' };
        if (cama.estado !== 'libre' && cama.estado !== 'reservada') {
          return { success: false, error: 'La cama no está disponible' };
        }

        const asignacion = {
          id: generateId('asig'),
          idHuesped,
          idCama,
          fechaLlegada,
          fechaSalidaEstimada,
          fechaSalidaReal: null,
          estado: 'activa',
        };

        // Update cama
        const updatedCamas = camas.map(c =>
          c.id === idCama ? { ...c, estado: 'ocupada', idHuespedActual: idHuesped } : c
        );

        // Update cuarto state
        const cuarto = cuartos.find(c => c.id === cama.idCuarto);
        const updatedCuartos = cuartos.map(c =>
          c.id === cama.idCuarto ? { ...c, estado: 'ocupado' } : c
        );

        set({
          camas: updatedCamas,
          cuartos: updatedCuartos,
          asignaciones: [...asignaciones, asignacion],
        });

        get().addLog('CHECK_IN', 'Asignacion', asignacion.id, null, {
          huesped: huesped.nombre,
          cama: cama.codigo,
          fechaLlegada,
          fechaSalidaEstimada,
        });

        return { success: true, asignacion };
      },

      // ========== CHECK-OUT ==========
      checkOut: ({ idAsignacion, fechaSalidaReal }) => {
        const { asignaciones, camas, cuartos, huespedes } = get();
        const asignacion = asignaciones.find(a => a.id === idAsignacion);
        if (!asignacion) return { success: false, error: 'Asignación no encontrada' };

        const cama = camas.find(c => c.id === asignacion.idCama);
        const huesped = huespedes.find(h => h.id === asignacion.idHuesped);

        const updatedAsignaciones = asignaciones.map(a =>
          a.id === idAsignacion
            ? { ...a, fechaSalidaReal, estado: 'cerrada' }
            : a
        );

        const updatedCamas = camas.map(c =>
          c.id === asignacion.idCama
            ? { ...c, estado: 'limpieza', idHuespedActual: null }
            : c
        );

        // Check if all beds in cuarto are now free/limpieza
        const cuarto = cuartos.find(c => c.id === cama?.idCuarto);
        let updatedCuartos = cuartos;
        if (cuarto) {
          const camasEnCuarto = updatedCamas.filter(c => c.idCuarto === cuarto.id);
          const allFree = camasEnCuarto.every(c => c.estado === 'libre' || c.estado === 'limpieza');
          if (allFree) {
            updatedCuartos = cuartos.map(c =>
              c.id === cuarto.id ? { ...c, estado: 'limpieza' } : c
            );
          }
        }

        set({
          asignaciones: updatedAsignaciones,
          camas: updatedCamas,
          cuartos: updatedCuartos,
        });

        get().addLog('CHECK_OUT', 'Asignacion', idAsignacion, { estado: 'activa' }, {
          estado: 'cerrada',
          huesped: huesped?.nombre,
          fechaSalidaReal,
        });

        return { success: true };
      },

      // ========== MANTENIMIENTO ==========
      addMantenimiento: (data) => {
        const ticket = { id: generateId('mant'), ...data };
        set(s => ({ mantenimiento: [...s.mantenimiento, ticket] }));

        // Mark beds in cuarto as maintenance
        const { camas, cuartos } = get();
        const updatedCamas = camas.map(c =>
          c.idCuarto === data.idCuarto ? { ...c, estado: 'mantenimiento' } : c
        );
        const updatedCuartos = cuartos.map(c =>
          c.id === data.idCuarto ? { ...c, estado: 'mantenimiento' } : c
        );
        set({ camas: updatedCamas, cuartos: updatedCuartos });

        get().addLog('CREAR_TICKET', 'Mantenimiento', ticket.id, null, data);
        return ticket;
      },

      updateMantenimiento: (id, data) => {
        const prev = get().mantenimiento.find(m => m.id === id);
        set(s => ({
          mantenimiento: s.mantenimiento.map(m => m.id === id ? { ...m, ...data } : m),
        }));

        // If closing ticket, free the beds (set to limpieza)
        if (data.estado === 'cerrado' && prev) {
          const { camas, cuartos } = get();
          const ticket = get().mantenimiento.find(m => m.id === id);
          if (ticket) {
            const updatedCamas = camas.map(c =>
              c.idCuarto === ticket.idCuarto && c.estado === 'mantenimiento'
                ? { ...c, estado: 'limpieza' }
                : c
            );
            const updatedCuartos = cuartos.map(c =>
              c.id === ticket.idCuarto ? { ...c, estado: 'limpieza' } : c
            );
            set({ camas: updatedCamas, cuartos: updatedCuartos });
          }
        }

        get().addLog('EDITAR_TICKET', 'Mantenimiento', id, prev, data);
      },

      // ========== USUARIOS ==========
      addUsuario: (data) => {
        const usuario = { id: generateId('u'), activo: true, ...data };
        set(s => ({ usuarios: [...s.usuarios, usuario] }));
        get().addLog('CREAR_USUARIO', 'Usuario', usuario.id, null, { email: data.email, rol: data.rol });
        return usuario;
      },

      updateUsuario: (id, data) => {
        const prev = get().usuarios.find(u => u.id === id);
        set(s => ({
          usuarios: s.usuarios.map(u => u.id === id ? { ...u, ...data } : u),
        }));
        get().addLog('EDITAR_USUARIO', 'Usuario', id, { email: prev?.email }, data);
      },

      // ========== BED STATUS MANUAL CHANGE ==========
      updateCamaEstado: (idCama, nuevoEstado) => {
        const prev = get().camas.find(c => c.id === idCama);
        set(s => ({
          camas: s.camas.map(c =>
            c.id === idCama ? { ...c, estado: nuevoEstado, idHuespedActual: nuevoEstado === 'libre' ? null : c.idHuespedActual } : c
          ),
        }));
        get().addLog('CAMBIAR_ESTADO_CAMA', 'Cama', idCama, { estado: prev?.estado }, { estado: nuevoEstado });
      },
    }),
    {
      name: 'mining-camp-storage',
      version: 1,
    }
  )
);

export default useStore;
