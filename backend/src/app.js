const express = require('express');
const cors = require('cors');
const { seedDatabase } = require('./config/dataProvider');
const authRoutes = require('./routes/auth.routes');
const manejadorErrores = require('./middlewares/error.middleware');

const equiposRoutes = require('./routes/equipos.routes');
const app = express();

// Middlewares globales requeridos
app.use(cors({
  origin: 'http://localhost:5173',
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); 

seedDatabase();

// Ruta de diagnóstico base
app.get('/', (req, res) => {
  res.json({ mensaje: "API de Control de Solicitudes de Equipamiento Operativa" });
});

const solicitudesRoutes = require('./routes/solicitudes');

app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/equipos', equiposRoutes);

// Middleware de manejo de errores (SIEMPRE debe ir al final, después de las rutas)
app.use(manejadorErrores);

// Levantamos el servidor solo si no estamos ejecutando pruebas de Jest
if (process.env.NODE_ENV !== 'test') {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo exitosamente en el puerto ${PORT}`);
    console.log(`servidor corriendo en local:  http://localhost:${PORT}`)
  });
}

module.exports = app;