// backend/services/solicitudes.service.js
// Toda la lógica de negocio vive acá, no en los controladores.
// Los controladores solo orquestan: llaman al servicio y responden HTTP.

const { getAll, getById, insert, update } = require('../config/dataProvider');

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Genera un id único para solicitudes.
 */
function generarIdSolicitud() {
  const solicitudes = getAll('solicitudes');
  const maxNum = solicitudes.reduce((max, s) => {
    const num = parseInt(s.id.replace('sol-', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 1000);
  return `sol-${maxNum + 1}`;
}

/**
 * Genera un id único para registros de historial.
 */
function generarIdHistorial() {
  const historial = getAll('historial_solicitudes');
  const maxNum = historial.reduce((max, h) => {
    const num = parseInt(h.id.replace('hist-', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `hist-${maxNum + 1}`;
}

/**
 * Registra una entrada en el historial de auditoría.
 *
 * @param {string} solicitudId
 * @param {string} usuarioId - Quien realiza la acción.
 * @param {string} accion - 'creacion' | 'edicion' | 'aprobacion' | 'rechazo' | 'cancelacion' | 'devolucion'
 * @param {Object|null} valorAnterior
 * @param {Object|null} valorNuevo
 */
function registrarHistorial(solicitudId, usuarioId, accion, valorAnterior, valorNuevo) {
  const entrada = {
    id: generarIdHistorial(),
    solicitudId,
    usuarioId,
    accion,
    fechaHora: new Date().toISOString(),
    valorAnterior: valorAnterior || null,
    valorNuevo: valorNuevo || null,
  };
  insert('historial_solicitudes', entrada);
  return entrada;
}

/**
 * Verifica si dos rangos de fechas se superponen.
 * [a1, a2] y [b1, b2] se superponen si a1 < b2 && b1 < a2.
 */
function fechasSeSolapan(a1, a2, b1, b2) {
  return new Date(a1) < new Date(b2) && new Date(b1) < new Date(a2);
}

// ---------------------------------------------------------------------------
// Casos de uso del módulo
// ---------------------------------------------------------------------------

/**
 * CASO DE USO: Listar solicitudes con filtros, paginación y ordenamiento.
 *
 * Filtros soportados: estado, equipoId, categoria, desde (fechaRetiro >=), hasta (fechaRetiro <=)
 * Paginación: page (1-based), limit
 * Ordenamiento: sortBy (campo), order ('asc' | 'desc')
 *
 * @param {Object} queryParams - Parámetros de la query string.
 * @returns {{ data: Array, total: number, page: number, totalPages: number }}
 */
function listarSolicitudes(queryParams) {
  const {
    estado,
    equipoId,
    categoria,
    desde,
    hasta,
    page = 1,
    limit = 10,
    sortBy = 'fechaRetiro',
    order = 'asc',
  } = queryParams;

  let solicitudes = getAll('solicitudes');
  const equipos = getAll('equipos');

  // --- Enriquecer cada solicitud con datos del equipo para filtrar por categoría ---
  // (join en memoria)
  const solicitudesEnriquecidas = solicitudes.map((sol) => {
    const equipo = equipos.find((e) => e.id === sol.equipoId) || null;
    return { ...sol, equipo };
  });

  // --- Aplicar filtros ---
  let filtradas = solicitudesEnriquecidas.filter((sol) => {
    if (estado && sol.estado !== estado) return false;
    if (equipoId && sol.equipoId !== equipoId) return false;
    if (categoria && (!sol.equipo || sol.equipo.categoria !== categoria)) return false;
    if (desde && new Date(sol.fechaRetiro) < new Date(desde)) return false;
    if (hasta && new Date(sol.fechaRetiro) > new Date(hasta)) return false;
    return true;
  });

  // --- Ordenar ---
  const camposPermitidos = ['fechaRetiro', 'fechaDevolucion', 'estado', 'id'];
  const campoOrden = camposPermitidos.includes(sortBy) ? sortBy : 'fechaRetiro';
  const direccion = order === 'desc' ? -1 : 1;

  filtradas.sort((a, b) => {
    const va = a[campoOrden] || '';
    const vb = b[campoOrden] || '';
    if (va < vb) return -1 * direccion;
    if (va > vb) return 1 * direccion;
    return 0;
  });

  // --- Paginar ---
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const total = filtradas.length;
  const totalPages = Math.ceil(total / limitNum);
  const inicio = (pageNum - 1) * limitNum;
  const paginadas = filtradas.slice(inicio, inicio + limitNum);

  return {
    data: paginadas,
    total,
    page: pageNum,
    totalPages,
    limit: limitNum,
  };
}

/**
 * CASO DE USO: Obtener detalle de una solicitud por id.
 * Incluye datos del equipo y del usuario solicitante.
 *
 * @param {string} id
 * @returns {Object} La solicitud enriquecida.
 * @throws {Error} Si no existe.
 */
function obtenerSolicitudPorId(id) {
  const solicitud = getById('solicitudes', id);
  if (!solicitud) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  const equipo = getById('equipos', solicitud.equipoId);
  const usuarios = getAll('usuarios');
  const usuario = usuarios.find((u) => u.id === solicitud.usuarioId) || null;

  // No exponer passwordHash
  const usuarioPublico = usuario
    ? { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    : null;

  return { ...solicitud, equipo, usuario: usuarioPublico };
}

/**
 * CASO DE USO: Crear una nueva solicitud.
 *
 * Validaciones:
 *  1. El equipo debe existir.
 *  2. fechaRetiro debe ser estrictamente anterior a fechaDevolucion.
 *  3. El equipo debe estar en estado 'disponible'.
 *  4. No debe haber otra solicitud aprobada superpuesta para el mismo equipo.
 *
 * @param {Object} body - { equipoId, fechaRetiro, fechaDevolucion, motivo }
 * @param {string} usuarioId - Id del usuario autenticado.
 * @returns {Object} La solicitud creada.
 */
function crearSolicitud(body, usuarioId) {
  const { equipoId, fechaRetiro, fechaDevolucion, motivo } = body;

  // --- Validar campos requeridos ---
  if (!equipoId || !fechaRetiro || !fechaDevolucion || !motivo) {
    const err = new Error('Campos requeridos: equipoId, fechaRetiro, fechaDevolucion, motivo');
    err.status = 400;
    throw err;
  }

  // --- Validación de fechas: fechaRetiro debe ser ANTERIOR a fechaDevolucion ---
  if (new Date(fechaRetiro) >= new Date(fechaDevolucion)) {
    const err = new Error(
      'La fechaRetiro debe ser anterior a la fechaDevolucion'
    );
    err.status = 400;
    throw err;
  }

  // --- El equipo debe existir ---
  const equipo = getById('equipos', equipoId);
  if (!equipo) {
    const err = new Error('El equipo especificado no existe');
    err.status = 404;
    throw err;
  }

  // --- El equipo debe estar disponible ---
  if (equipo.estado !== 'disponible') {
    const err = new Error(
      `El equipo no está disponible. Estado actual: ${equipo.estado}`
    );
    err.status = 400;
    throw err;
  }

  // --- No debe haber superposición con solicitudes aprobadas ---
  const solicitudesExistentes = getAll('solicitudes');
  const haySuper = solicitudesExistentes.some(
    (s) =>
      s.equipoId === equipoId &&
      s.estado === 'aprobada' &&
      fechasSeSolapan(fechaRetiro, fechaDevolucion, s.fechaRetiro, s.fechaDevolucion)
  );

  if (haySuper) {
    const err = new Error(
      'El equipo ya tiene una solicitud aprobada para un período que se superpone con el solicitado'
    );
    err.status = 400;
    throw err;
  }

  // --- Crear la solicitud ---
  const nueva = {
    id: generarIdSolicitud(),
    equipoId,
    usuarioId,
    fechaRetiro,
    fechaDevolucion,
    motivo: motivo.trim(),
    estado: 'pendiente',
    autorizadoPor: null,
  };

  insert('solicitudes', nueva);

  // --- Registrar en historial ---
  registrarHistorial(nueva.id, usuarioId, 'creacion', null, { estado: 'pendiente' });

  return nueva;
}

/**
 * CASO DE USO: Editar una solicitud pendiente.
 *
 * Solo se pueden editar: fechaRetiro, fechaDevolucion, motivo.
 * Solo si el estado es 'pendiente'.
 * Solo el propio usuario o un admin/encargado puede editar.
 *
 * @param {string} id - Id de la solicitud.
 * @param {Object} body - Campos a actualizar.
 * @param {Object} usuarioAuth - { id, rol } del usuario autenticado.
 * @returns {Object} La solicitud actualizada.
 */
function editarSolicitud(id, body, usuarioAuth) {
  const solicitud = getById('solicitudes', id);
  if (!solicitud) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  // Solo se puede editar si está pendiente
  if (solicitud.estado !== 'pendiente') {
    const err = new Error(
      `No se puede editar una solicitud en estado '${solicitud.estado}'. Solo se pueden editar solicitudes pendientes`
    );
    err.status = 400;
    throw err;
  }

  // Solo el dueño o admin/encargado puede editar
  const esAdmin = ['admin', 'encargado'].includes(usuarioAuth.rol);
  if (!esAdmin && solicitud.usuarioId !== usuarioAuth.id) {
    const err = new Error('No tenés permiso para editar esta solicitud');
    err.status = 403;
    throw err;
  }

  const { fechaRetiro, fechaDevolucion, motivo } = body;

  // Determinar fechas finales (usa las actuales si no se mandan)
  const nuevaFechaRetiro = fechaRetiro || solicitud.fechaRetiro;
  const nuevaFechaDevolucion = fechaDevolucion || solicitud.fechaDevolucion;

  // Validar fechas si se enviaron
  if (new Date(nuevaFechaRetiro) >= new Date(nuevaFechaDevolucion)) {
    const err = new Error('La fechaRetiro debe ser anterior a la fechaDevolucion');
    err.status = 400;
    throw err;
  }

  // Verificar superposición (excluyendo la solicitud actual)
  const todasLasSolicitudes = getAll('solicitudes');
  const haySuper = todasLasSolicitudes.some(
    (s) =>
      s.id !== id &&
      s.equipoId === solicitud.equipoId &&
      s.estado === 'aprobada' &&
      fechasSeSolapan(nuevaFechaRetiro, nuevaFechaDevolucion, s.fechaRetiro, s.fechaDevolucion)
  );

  if (haySuper) {
    const err = new Error(
      'Las nuevas fechas se superponen con una solicitud aprobada para el mismo equipo'
    );
    err.status = 400;
    throw err;
  }

  const valorAnterior = {
    fechaRetiro: solicitud.fechaRetiro,
    fechaDevolucion: solicitud.fechaDevolucion,
    motivo: solicitud.motivo,
  };

  const updates = {};
  if (fechaRetiro) updates.fechaRetiro = fechaRetiro;
  if (fechaDevolucion) updates.fechaDevolucion = fechaDevolucion;
  if (motivo) updates.motivo = motivo.trim();

  const actualizada = update('solicitudes', id, updates);

  registrarHistorial(id, usuarioAuth.id, 'edicion', valorAnterior, updates);

  return actualizada;
}

/**
 * Obtiene el historial de una solicitud.
 *
 * @param {string} solicitudId
 * @returns {Array}
 */
function obtenerHistorial(solicitudId) {
  const solicitud = getById('solicitudes', solicitudId);
  if (!solicitud) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  const historial = getAll('historial_solicitudes').filter(
    (h) => h.solicitudId === solicitudId
  );

  // Ordenar del más reciente al más antiguo
  historial.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));

  return historial;
}

module.exports = {
  listarSolicitudes,
  obtenerSolicitudPorId,
  crearSolicitud,
  editarSolicitud,
  obtenerHistorial,
  registrarHistorial, // exportado para que otros servicios (aprobar, rechazar, etc.) lo usen
};