// backend/app.js
// Punto de entrada de la aplicación Express.
// Separado de index.js para que los tests puedan importar app sin levantar el servidor.

const express = require('express');
const cors = require('cors');

const solicitudesRouter = require('./src/routes/solicitudes');
const errorHandler = require('./src/middlewares/error.middleware');

const app = express();

// ---------------------------------------------------------------------------
// Middlewares globales
// ---------------------------------------------------------------------------
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

// Health check (sin autenticación, útil para CI/CD)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas del módulo de solicitudes
app.use('/api/solicitudes', solicitudesRouter);

// Rutas de otros módulos del grupo (auth, equipos, resumen):
// app.use('/api/auth', authRouter);
// app.use('/api/equipos', equiposRouter);

// ---------------------------------------------------------------------------
// Middleware de errores (SIEMPRE al final, después de las rutas)
// ---------------------------------------------------------------------------
app.use(errorHandler);

module.exports = app;