// backend/src/controllers/solicitudes.js

const { getAll, getById, insert, update } = require('../config/dataProvider');
const solicitudesService = require('../services/solicitudes');
const { esGestorSolicitudes, esSolicitudDelUsuario } = require('../utils/solicitudesAuth');

const listar = (req, res, next) => {
  try {
    let solicitudes = getAll('solicitudes');
    const usuarios = getAll('usuarios');

    if (!esGestorSolicitudes(req.usuario)) {
      solicitudes = solicitudes.filter((item) => esSolicitudDelUsuario(item, req.usuario));
    }

    const { estado, equipoId, categoria, desde, hasta } = req.query;

    if (estado) {
      solicitudes = solicitudes.filter((item) => item.estado === estado);
    }
    if (equipoId) {
      solicitudes = solicitudes.filter((item) => item.equipoId === equipoId);
    }
    if (categoria) {
      const equipos = getAll('equipos');
      const ids = equipos.filter((e) => e.categoria === categoria).map((e) => e.id);
      solicitudes = solicitudes.filter((item) => ids.includes(item.equipoId));
    }
    if (desde) {
      solicitudes = solicitudes.filter((item) => item.fechaRetiro >= desde);
    }
    if (hasta) {
      solicitudes = solicitudes.filter((item) => item.fechaDevolucion <= hasta);
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const total = solicitudes.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;

    const data = solicitudes
      .slice(start, start + limit)
      .map((item) => {
        const solicitante = getById('usuarios', item.usuarioId);
        return {
          ...item,
          solicitante: solicitante?.nombre || item.usuarioId,
          equipo: getById('equipos', item.equipoId),
        };
      });

    res.json({ data, total, page, totalPages });
  } catch (error) {
    next(error);
  }
};

const detalle = (req, res, next) => {
  try {
    const solicitud = getById('solicitudes', req.params.id);
    if (!solicitud) {
      const error = new Error('Solicitud no encontrada.');
      error.status = 404;
      throw error;
    }

    const solicitante = getById('usuarios', solicitud.usuarioId);
    if (!esGestorSolicitudes(req.usuario) && !esSolicitudDelUsuario(solicitud, req.usuario)) {
      const error = new Error('No tenés permisos para ver esta solicitud.');
      error.status = 403;
      throw error;
    }

    res.json({
      ...solicitud,
      solicitante: solicitante?.nombre || solicitud.usuarioId,
      equipo: getById('equipos', solicitud.equipoId),
    });
  } catch (error) {
    next(error);
  }
};

const historial = (req, res, next) => {
  try {
    const solicitud = getById('solicitudes', req.params.id);
    if (!solicitud) {
      const error = new Error('Solicitud no encontrada.');
      error.status = 404;
      throw error;
    }

    if (!esGestorSolicitudes(req.usuario) && !esSolicitudDelUsuario(solicitud, req.usuario)) {
      const error = new Error('No tenés permisos para ver esta solicitud.');
      error.status = 403;
      throw error;
    }

    const historial = getAll('historial_solicitudes').filter((item) => item.solicitudId === req.params.id);
    res.json(historial);
  } catch (error) {
    next(error);
  }
};

const crear = (req, res, next) => {
  try {
    const { equipoId, fechaRetiro, fechaDevolucion, motivo } = req.body;

    if (!equipoId || !fechaRetiro || !fechaDevolucion || !motivo) {
      const error = new Error('Faltan campos obligatorios.');
      error.status = 400;
      throw error;
    }

    const equipo = getById('equipos', equipoId);
    if (!equipo) {
      const error = new Error('El equipo no existe.');
      error.status = 404;
      throw error;
    }

    if (equipo.estado !== 'disponible') {
      const error = new Error('El equipo no está disponible.');
      error.status = 400;
      throw error;
    }

    if (new Date(fechaRetiro) >= new Date(fechaDevolucion)) {
      const error = new Error('La fecha de retiro debe ser anterior a la fecha de devolución.');
      error.status = 400;
      throw error;
    }

    const solicitudes = getAll('solicitudes');
    const solapada = solicitudes.some((item) => {
      if (item.equipoId !== equipoId || item.estado !== 'aprobada') return false;
      const inicio = new Date(fechaRetiro);
      const fin = new Date(fechaDevolucion);
      const existenteInicio = new Date(item.fechaRetiro);
      const existenteFin = new Date(item.fechaDevolucion);
      return inicio < existenteFin && fin > existenteInicio;
    });

    if (solapada) {
      const error = new Error('El equipo ya tiene una solicitud aprobada que se superpone con las fechas solicitadas.');
      error.status = 400;
      throw error;
    }

    const solicitud = insert('solicitudes', {
      id: `sol-${Date.now()}`,
      equipoId,
      usuarioId: req.usuario.id,
      fechaRetiro,
      fechaDevolucion,
      motivo,
      estado: 'pendiente',
      autorizadoPor: null,
    });

    insert('historial_solicitudes', {
      id: `hist-${Date.now()}`,
      solicitudId: solicitud.id,
      usuarioId: req.usuario.id,
      accion: 'creacion',
      fechaHora: new Date().toISOString(),
      valorAnterior: null,
      valorNuevo: { estado: 'pendiente' },
    });

    res.status(201).json(solicitud);
  } catch (error) {
    next(error);
  }
};

const editar = (req, res, next) => {
  try {
    const solicitud = getById('solicitudes', req.params.id);
    if (!solicitud) {
      const error = new Error('Solicitud no encontrada.');
      error.status = 404;
      throw error;
    }

    if (solicitud.estado !== 'pendiente') {
      const error = new Error('Solo se pueden editar solicitudes pendientes.');
      error.status = 400;
      throw error;
    }

    const esDuenio = esSolicitudDelUsuario(solicitud, req.usuario);
    if (!esDuenio && !esGestorSolicitudes(req.usuario)) {
      const error = new Error('No tenés permisos para editar esta solicitud.');
      error.status = 403;
      throw error;
    }

    const { fechaRetiro, fechaDevolucion, motivo } = req.body;
    if (fechaRetiro && fechaDevolucion && new Date(fechaRetiro) >= new Date(fechaDevolucion)) {
      const error = new Error('La fecha de retiro debe ser anterior a la fecha de devolución.');
      error.status = 400;
      throw error;
    }

    const actualizada = update('solicitudes', req.params.id, {
      ...(fechaRetiro ? { fechaRetiro } : {}),
      ...(fechaDevolucion ? { fechaDevolucion } : {}),
      ...(motivo !== undefined ? { motivo } : {}),
    });

    insert('historial_solicitudes', {
      id: `hist-${Date.now()}`,
      solicitudId: req.params.id,
      usuarioId: req.usuario.id,
      accion: 'edicion',
      fechaHora: new Date().toISOString(),
      valorAnterior: { estado: solicitud.estado },
      valorNuevo: { estado: solicitud.estado },
    });

    res.json(actualizada);
  } catch (error) {
    next(error);
  }
};

const aprobar = async (req, res, next) => {
  try {
    // req.params.id → el :id que viene en la URL /solicitudes/sol-1001/aprobar
    // req.usuario   → lo puso authMiddleware.js, tiene { id, rol }
    const resultado = await solicitudesService.aprobar(req.params.id, req.usuario);
    res.status(200).json(resultado);
  } catch (error) {
    // next(error) manda el error al error.middleware.js que ya existe
    // NUNCA hacés res.status() acá dentro del catch
    next(error);
  }
};

const rechazar = async (req, res, next) => {
  try {
    const resultado = await solicitudesService.rechazar(req.params.id, req.usuario);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

const cancelar = async (req, res, next) => {
  try {
    const resultado = await solicitudesService.cancelar(req.params.id, req.usuario);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

const devolver = async (req, res, next) => {
  try {
    const resultado = await solicitudesService.devolver(req.params.id, req.usuario);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  detalle,
  historial,
  crear,
  editar,
  aprobar,
  rechazar,
  cancelar,
  devolver,
};
