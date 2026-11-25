const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'dds2026_secret_key_cambiar_en_produccion';

/**
 * Middleware global de autenticación
 * Intercepta la petición, extrae el token Bearer y valida la identidad del usuario
 */
const autenticarJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const error = new Error('Acceso denegado. No se proporcionó un token.');
    error.status = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded;
    next();
  } catch (err) {
    const error = new Error('Token inválido o expirado.');
    error.status = 401;
    next(error);
  }
};

module.exports = autenticarJWT;