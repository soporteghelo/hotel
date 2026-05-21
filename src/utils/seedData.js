import { generateBedCode } from './bedCodes.js';

export function generateSeedData() {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  // ========== USUARIOS ==========
  // Contraseña inicial = DNI. El usuario puede cambiarla desde su perfil.
  const usuarios = [
    {
      id: 'u1',
      dni: '11111111',
      nombre: 'Administrador del Sistema',
      rol: 'admin',
      activo: true,
      password: '11111111',
    },
    {
      id: 'u2',
      dni: '22222222',
      nombre: 'María González',
      rol: 'recepcionista',
      activo: true,
      password: '22222222',
    },
    {
      id: 'u3',
      dni: '33333333',
      nombre: 'Carlos Rodríguez',
      rol: 'supervisor',
      activo: true,
      password: '33333333',
    },
    {
      id: 'u4',
      dni: '44444444',
      nombre: 'Ana Martínez',
      rol: 'consulta',
      activo: true,
      password: '44444444',
    },
  ];

  // ========== HOTEL ==========
  const hotels = [
    {
      id: 'h1',
      nombre: 'Campamento El Teniente',
      ubicacion: 'Sector Norte, Mina El Teniente, Rancagua',
      nPisos: 3,
      estado: 'activo',
      codigo: 'A',
    },
  ];

  // ========== CUARTOS ==========
  // 3 pisos x 6 cuartos = 18 cuartos
  const cuartos = [];
  const estadosCuartos = [
    'libre', 'libre', 'ocupado', 'ocupado', 'ocupado', 'libre',
    'ocupado', 'ocupado', 'libre', 'mantenimiento', 'libre', 'ocupado',
    'libre', 'ocupado', 'ocupado', 'libre', 'libre', 'limpieza',
  ];
  let cuartoIdx = 0;
  for (let piso = 1; piso <= 3; piso++) {
    for (let cuartoNum = 1; cuartoNum <= 6; cuartoNum++) {
      const num = String(cuartoNum).padStart(2, '0');
      cuartos.push({
        id: `c${piso}${num}`,
        idHotel: 'h1',
        piso,
        numero: cuartoNum,
        estado: estadosCuartos[cuartoIdx] || 'libre',
      });
      cuartoIdx++;
    }
  }

  // ========== CAMAS ==========
  // 18 cuartos x 4 camas = 72 camas
  const camas = [];
  for (let piso = 1; piso <= 3; piso++) {
    for (let cuartoNum = 1; cuartoNum <= 6; cuartoNum++) {
      const cuartoId = `c${piso}${String(cuartoNum).padStart(2, '0')}`;
      for (let camarote = 1; camarote <= 2; camarote++) {
        for (const nivel of ['INF', 'SUP']) {
          const codigo = generateBedCode('A', piso, cuartoNum, camarote, nivel);
          camas.push({
            id: `b_${codigo.replace(/-/g, '_')}`,
            codigo,
            idCuarto: cuartoId,
            camarote,
            nivel,
            estado: 'libre',
            idHuespedActual: null,
          });
        }
      }
    }
  }

  // ========== HUESPEDES ==========
  const huespedes = [
    {
      id: 'hsp1',
      nombre: 'Jorge Tapia Morales',
      rut: '12.345.678-9',
      empresa: 'Codelco',
      cargo: 'Operador de Maquinaria',
      telefono: '+56912345678',
      observaciones: 'Turno día',
      activo: true,
    },
    {
      id: 'hsp2',
      nombre: 'Pedro Soto Valenzuela',
      rut: '14.567.890-2',
      empresa: 'Codelco',
      cargo: 'Supervisor de Planta',
      telefono: '+56923456789',
      observaciones: 'Turno noche',
      activo: true,
    },
    {
      id: 'hsp3',
      nombre: 'Rodrigo Muñoz Castro',
      rut: '16.789.012-4',
      empresa: 'Empresas Zañartu',
      cargo: 'Técnico Electricista',
      telefono: '+56934567890',
      observaciones: '',
      activo: true,
    },
    {
      id: 'hsp4',
      nombre: 'Felipe Arenas Díaz',
      rut: '18.901.234-6',
      empresa: 'Empresas Zañartu',
      cargo: 'Mecánico Industrial',
      telefono: '+56945678901',
      observaciones: 'Requiere cama inferior por lesión',
      activo: true,
    },
    {
      id: 'hsp5',
      nombre: 'Cristian Vega Peña',
      rut: '11.234.567-8',
      empresa: 'Fluor Chile',
      cargo: 'Ingeniero Civil',
      telefono: '+56956789012',
      observaciones: '',
      activo: true,
    },
    {
      id: 'hsp6',
      nombre: 'Marco Rojas Fuentes',
      rut: '13.456.789-0',
      empresa: 'Fluor Chile',
      cargo: 'Técnico en Seguridad',
      telefono: '+56967890123',
      observaciones: 'Alergias: polvo',
      activo: true,
    },
    {
      id: 'hsp7',
      nombre: 'Luis Herrera Contreras',
      rut: '15.678.901-3',
      empresa: 'SQM',
      cargo: 'Perforista',
      telefono: '+56978901234',
      observaciones: '',
      activo: true,
    },
    {
      id: 'hsp8',
      nombre: 'Andrés Cortez Ibáñez',
      rut: '17.890.123-5',
      empresa: 'SQM',
      cargo: 'Técnico Especialista',
      telefono: '+56989012345',
      observaciones: '',
      activo: true,
    },
    {
      id: 'hsp9',
      nombre: 'Ricardo Medina Torres',
      rut: '10.123.456-7',
      empresa: 'Codelco',
      cargo: 'Operador de Chancado',
      telefono: '+56990123456',
      observaciones: 'Ex-trabajador readmitido',
      activo: false,
    },
  ];

  // ========== ASSIGN BEDS ==========
  // Set some beds as occupied/reserved/maintenance
  const ocupaciones = [
    { bedCodigo: 'A-01-01-C1-INF', huespedId: 'hsp1' },
    { bedCodigo: 'A-01-01-C1-SUP', huespedId: 'hsp2' },
    { bedCodigo: 'A-01-02-C1-INF', huespedId: 'hsp3' },
    { bedCodigo: 'A-01-02-C2-INF', huespedId: 'hsp4' },
    { bedCodigo: 'A-02-01-C1-INF', huespedId: 'hsp5' },
    { bedCodigo: 'A-02-01-C2-SUP', huespedId: 'hsp6' },
    { bedCodigo: 'A-02-02-C1-INF', huespedId: 'hsp7' },
    { bedCodigo: 'A-02-02-C1-SUP', huespedId: 'hsp8' },
  ];

  const reservadas = ['A-01-03-C1-INF', 'A-01-03-C1-SUP'];
  const mantenimientoBeds = ['A-02-04-C1-INF', 'A-02-04-C1-SUP', 'A-02-04-C2-INF', 'A-02-04-C2-SUP'];

  ocupaciones.forEach(({ bedCodigo, huespedId }) => {
    const bed = camas.find(b => b.codigo === bedCodigo);
    if (bed) {
      bed.estado = 'ocupada';
      bed.idHuespedActual = huespedId;
    }
  });

  reservadas.forEach(codigo => {
    const bed = camas.find(b => b.codigo === codigo);
    if (bed) bed.estado = 'reservada';
  });

  mantenimientoBeds.forEach(codigo => {
    const bed = camas.find(b => b.codigo === codigo);
    if (bed) bed.estado = 'mantenimiento';
  });

  // ========== ASIGNACIONES ==========
  const fechaLlegadaBase = new Date();
  fechaLlegadaBase.setDate(fechaLlegadaBase.getDate() - 5);
  const llegadaStr = fechaLlegadaBase.toISOString().split('T')[0];

  const fechaSalidaEst = new Date();
  fechaSalidaEst.setDate(fechaSalidaEst.getDate() + 9);
  const salidaEstStr = fechaSalidaEst.toISOString().split('T')[0];

  const asignaciones = ocupaciones.map((ocp, i) => ({
    id: `asig${i + 1}`,
    idHuesped: ocp.huespedId,
    idCama: camas.find(b => b.codigo === ocp.bedCodigo)?.id,
    fechaLlegada: llegadaStr,
    fechaSalidaEstimada: salidaEstStr,
    fechaSalidaReal: null,
    estado: 'activa',
  }));

  // Historical assignment (closed)
  const fechaHistLlegada = new Date();
  fechaHistLlegada.setDate(fechaHistLlegada.getDate() - 30);
  const fechaHistSalida = new Date();
  fechaHistSalida.setDate(fechaHistSalida.getDate() - 16);

  asignaciones.push({
    id: 'asig_hist1',
    idHuesped: 'hsp9',
    idCama: camas.find(b => b.codigo === 'A-03-01-C1-INF')?.id,
    fechaLlegada: fechaHistLlegada.toISOString().split('T')[0],
    fechaSalidaEstimada: fechaHistSalida.toISOString().split('T')[0],
    fechaSalidaReal: fechaHistSalida.toISOString().split('T')[0],
    estado: 'cerrada',
  });

  // Reservations
  asignaciones.push({
    id: 'asig_res1',
    idHuesped: 'hsp1',
    idCama: camas.find(b => b.codigo === 'A-01-03-C1-INF')?.id,
    fechaLlegada: today,
    fechaSalidaEstimada: salidaEstStr,
    fechaSalidaReal: null,
    estado: 'reservada',
  });

  // ========== MANTENIMIENTO ==========
  const mantenimiento = [
    {
      id: 'mant1',
      idCuarto: 'c204',
      descripcion: 'Fuga de agua en baño compartido, humedad en paredes',
      prioridad: 'alta',
      estado: 'abierto',
      fecha: today,
    },
    {
      id: 'mant2',
      idCuarto: 'c106',
      descripcion: 'Ventana con sellado deficiente, entrada de frío',
      prioridad: 'media',
      estado: 'en_proceso',
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      id: 'mant3',
      idCuarto: 'c305',
      descripcion: 'Cerradura de puerta principal requiere reemplazo',
      prioridad: 'baja',
      estado: 'cerrado',
      fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ];

  // ========== LOG AUDITORIA ==========
  const logAuditoria = [
    {
      id: 'log1',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      usuario: 'recepcion@hotel.com',
      accion: 'CHECK_IN',
      entidad: 'Asignacion',
      idAfectado: 'asig1',
      valorAnterior: null,
      valorNuevo: { huesped: 'Jorge Tapia Morales', cama: 'A-01-01-C1-INF' },
    },
    {
      id: 'log2',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      usuario: 'recepcion@hotel.com',
      accion: 'CHECK_IN',
      entidad: 'Asignacion',
      idAfectado: 'asig2',
      valorAnterior: null,
      valorNuevo: { huesped: 'Pedro Soto Valenzuela', cama: 'A-01-01-C1-SUP' },
    },
    {
      id: 'log3',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      usuario: 'admin@hotel.com',
      accion: 'CHECK_IN',
      entidad: 'Asignacion',
      idAfectado: 'asig_hist1',
      valorAnterior: null,
      valorNuevo: { huesped: 'Ricardo Medina Torres', cama: 'A-03-01-C1-INF' },
    },
    {
      id: 'log4',
      timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      usuario: 'recepcion@hotel.com',
      accion: 'CHECK_OUT',
      entidad: 'Asignacion',
      idAfectado: 'asig_hist1',
      valorAnterior: { estado: 'activa' },
      valorNuevo: { estado: 'cerrada', huesped: 'Ricardo Medina Torres' },
    },
    {
      id: 'log5',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      usuario: 'supervisor@hotel.com',
      accion: 'CREAR_TICKET',
      entidad: 'Mantenimiento',
      idAfectado: 'mant2',
      valorAnterior: null,
      valorNuevo: { descripcion: 'Ventana con sellado deficiente', cuarto: 'c106' },
    },
    {
      id: 'log6',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      usuario: 'admin@hotel.com',
      accion: 'CREAR_HUESPED',
      entidad: 'Huesped',
      idAfectado: 'hsp8',
      valorAnterior: null,
      valorNuevo: { nombre: 'Andrés Cortez Ibáñez' },
    },
  ];

  return {
    hotels,
    cuartos,
    camas,
    huespedes,
    asignaciones,
    usuarios,
    logAuditoria,
    mantenimiento,
  };
}
