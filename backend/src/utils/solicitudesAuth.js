const { getById } = require('../config/dataProvider');

const ROLES_CLIENTE = ['usuario', 'user'];
const ROLES_GESTION = ['admin', 'encargado'];

const normalizar = (valor) => String(valor || '').trim().toLowerCase();

const esCliente = (usuario) => ROLES_CLIENTE.includes(normalizar(usuario?.rol));

const esGestorSolicitudes = (usuario) => ROLES_GESTION.includes(normalizar(usuario?.rol));

const esSolicitudDelUsuario = (solicitud, usuario) => {
  if (!solicitud || !usuario) return false;

  const nombreUsuario = normalizar(usuario.nombre);

  if (solicitud.solicitante && nombreUsuario) {
    return normalizar(solicitud.solicitante) === nombreUsuario;
  }

  const solicitante = getById('usuarios', solicitud.usuarioId);

  if (solicitante?.nombre && nombreUsuario) {
    return normalizar(solicitante.nombre) === nombreUsuario;
  }

  return solicitud.usuarioId === usuario.id;
};

module.exports = {
  esCliente,
  esGestorSolicitudes,
  esSolicitudDelUsuario,
};
