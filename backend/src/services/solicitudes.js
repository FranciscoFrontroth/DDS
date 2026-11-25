// backend/src/services/solicitudes.service.js

const { getAll, getById, insert, update } = require('../config/dataProvider');
const { esGestorSolicitudes, esSolicitudDelUsuario } = require('../utils/solicitudesAuth');

const registrarHistorial = (solicitudId, usuarioId, accion, valorAnterior, valorNuevo) => {
  insert('historial_solicitudes', {
    id: `hist-${Date.now()}`,
    solicitudId,
    usuarioId,
    accion,
    fechaHora: new Date().toISOString(),
    valorAnterior,
    valorNuevo,
  });
};

// Detecta si un equipo ya tiene un préstamo aprobado en las mismas fechas

const verificarSuperposicion = (equipoId, fechaRetiro, fechaDevolucion, excluirId = null) => {
  const solicitudes = getAll('solicitudes');

  // Solo nos importan las APROBADAS del mismo equipo
  const aprobadas = solicitudes.filter(s =>
    s.equipoId === equipoId &&
    s.estado === 'aprobada' &&
    s.id !== excluirId
  );

  for (const s of aprobadas) {
    const aRetiro     = new Date(fechaRetiro);
    const aDevolucion = new Date(fechaDevolucion);
    const bRetiro     = new Date(s.fechaRetiro);
    const bDevolucion = new Date(s.fechaDevolucion);

    // Dos períodos NO se superponen solo cuando:
    // A termina antes de que B empiece → aDevolucion <= bRetiro
    // B termina antes de que A empiece → bDevolucion <= aRetiro
    // En cualquier otro caso → HAY superposición
    const noSeSuperponen = aDevolucion <= bRetiro || bDevolucion <= aRetiro;

    if (!noSeSuperponen) {
      const error = new Error('El equipo ya tiene un préstamo aprobado en esas fechas.');
      error.status = 400;
      throw error;
    }
  }
};

// ─── APROBAR ────────────────────────────────────────────────────
const aprobar = (id, usuario) => {
  const solicitudes = getAll('solicitudes');
  const solicitud = solicitudes.find(s => s.id === id);

  // 1. ¿Existe la solicitud?
  if (!solicitud) {
    const error = new Error('Solicitud no encontrada.');
    error.status = 404;
    throw error;
  }

  // 2. ¿La transición es válida? Solo se puede aprobar si está pendiente
  if (solicitud.estado !== 'pendiente') {
    const error = new Error(`No se puede aprobar una solicitud en estado '${solicitud.estado}'.`);
    error.status = 400;
    throw error;
  }

  // 3. ¿El equipo existe?
  const equipos = getAll('equipos');
  const equipo = equipos.find(e => e.id === solicitud.equipoId);
  if (!equipo) {
    const error = new Error('El equipo asociado a esta solicitud no existe.');
    error.status = 404;
    throw error;
  }

  // 4. ¿El equipo requiere autorización especial y el usuario no tiene rol?
  if (equipo.requiereAutorizacion && usuario.rol === 'usuario') {
    const error = new Error('Este equipo requiere un encargado o administrador para aprobar el préstamo.');
    error.status = 403;
    throw error;
  }

  // 5. ¿Hay superposición con otra solicitud aprobada?
  verificarSuperposicion(solicitud.equipoId, solicitud.fechaRetiro, solicitud.fechaDevolucion, id);

  // 6. Todo ok → actualizamos el estado de la solicitud
  const solicitudActualizada = update('solicitudes', id, {
    estado: 'aprobada',
    autorizadoPor: usuario.id,
  });

  // 7. Cambiamos el estado del equipo a 'prestado'
  update('equipos', equipo.id, { estado: 'prestado' });

  // 8. Guardamos en el historial de auditoría
  registrarHistorial(id, usuario.id, 'aprobacion', { estado: 'pendiente' }, { estado: 'aprobada' });

  return solicitudActualizada;
};

// ─── RECHAZAR ───────────────────────────────────────────────────
const rechazar = (id, usuario) => {
  const solicitudes = getAll('solicitudes');
  const solicitud = solicitudes.find(s => s.id === id);

  if (!solicitud) {
    const error = new Error('Solicitud no encontrada.');
    error.status = 404;
    throw error;
  }

  if (solicitud.estado !== 'pendiente') {
    const error = new Error(`No se puede rechazar una solicitud en estado '${solicitud.estado}'.`);
    error.status = 400;
    throw error;
  }

  const estadoAnterior = solicitud.estado;
  const actualizada = update('solicitudes', id, { estado: 'rechazada' });

  registrarHistorial(id, usuario.id, 'rechazo', { estado: estadoAnterior }, { estado: 'rechazada' });

  return actualizada;
};

// ─── CANCELAR ───────────────────────────────────────────────────
const cancelar = (id, usuario) => {
  const solicitudes = getAll('solicitudes');
  const solicitud = solicitudes.find(s => s.id === id);

  if (!solicitud) {
    const error = new Error('Solicitud no encontrada.');
    error.status = 404;
    throw error;
  }

  // Solo se puede cancelar si está pendiente o aprobada
  if (!['pendiente', 'aprobada'].includes(solicitud.estado)) {
    const error = new Error(`No se puede cancelar una solicitud en estado '${solicitud.estado}'.`);
    error.status = 400;
    throw error;
  }

  // Verificar propiedad: solo el dueño o admin/encargado puede cancelar
  const esDuenio = esSolicitudDelUsuario(solicitud, usuario);
  if (!esDuenio && !esGestorSolicitudes(usuario)) {
    const error = new Error('Solo podés cancelar tus propias solicitudes.');
    error.status = 403;
    throw error;
  }

  const estabaAprobada = solicitud.estado === 'aprobada';
  const estadoAnterior = solicitud.estado;
  const actualizada = update('solicitudes', id, { estado: 'cancelada' });

  // Si estaba aprobada, liberamos el equipo
  if (estabaAprobada) {
    const equipo = getById('equipos', solicitud.equipoId);
    if (equipo) {
      update('equipos', equipo.id, { estado: 'disponible' });
    }
  }

  registrarHistorial(id, usuario.id, 'cancelacion', { estado: estadoAnterior }, { estado: 'cancelada' });

  return actualizada;
};

// ─── DEVOLVER ───────────────────────────────────────────────────
const devolver = (id, usuario) => {
  const solicitudes = getAll('solicitudes');
  const solicitud = solicitudes.find(s => s.id === id);

  if (!solicitud) {
    const error = new Error('Solicitud no encontrada.');
    error.status = 404;
    throw error;
  }

  // REGLA CRÍTICA del enunciado: solo se devuelve si está aprobada
  if (solicitud.estado !== 'aprobada') {
    const error = new Error('Solo se pueden devolver solicitudes que estén aprobadas.');
    error.status = 400;
    throw error;
  }

  const esAdminOEncargado = ['admin', 'encargado'].includes(usuario.rol);
  if (!esAdminOEncargado) {
    const error = new Error('Solo un admin o encargado puede devolver una solicitud.');
    error.status = 403;
    throw error;
  }

  const actualizada = update('solicitudes', id, { estado: 'devuelta' });

  // Liberamos el equipo
  const equipo = getById('equipos', solicitud.equipoId);
  if (equipo) {
    update('equipos', equipo.id, { estado: 'disponible' });
  }

  registrarHistorial(id, usuario.id, 'devolucion', { estado: 'aprobada' }, { estado: 'devuelta' });

  return actualizada;
};

module.exports = { aprobar, rechazar, cancelar, devolver };
