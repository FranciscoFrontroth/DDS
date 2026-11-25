// backend/src/middlewares/autorizarRol.middleware.js

const autorizarRol = (...rolesPermitidos) => {
  // Esta función devuelve OTRA función (middleware)
  // Los tres puntos (...) permiten pasar múltiples roles:
  // autorizarRol('admin', 'encargado')
  
  return (req, res, next) => {
    // req.usuario lo puso authMiddleware.js antes de llegar acá
    // Si el rol del usuario NO está en la lista permitida lo bloqueamos
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      const error = new Error('No tenés permisos para realizar esta acción.');
      error.status = 403; // 403 = sabemos quién sos, pero no podés hacer esto
      return next(error);
    }
    // Si el rol es válido dejamos pasar al controlador
    next();
  };
};

module.exports = autorizarRol;