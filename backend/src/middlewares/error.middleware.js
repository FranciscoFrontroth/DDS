const manejadorErrores = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }

  // Si el error tiene un status asignado lo usa, de lo contrario devuelve 500 (Error del Servidor)
  const status = err.status || 500;
  const mensaje = err.message || "Ocurrió un error interno en el servidor.";

  res.status(status).json({ error: mensaje }); // Formato JSON claro exigido por la cátedra
};

module.exports = manejadorErrores;
