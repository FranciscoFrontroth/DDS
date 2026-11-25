// backend/tests/solicitudes.test.js

const request = require('supertest');
const app = require('../src/app');
const { writeData, readData } = require('../src/config/dataProvider');

// Antes de cada test reseteamos los datos a la semilla original
// para que los tests sean independientes entre sí
beforeEach(() => {
  // Borramos los archivos JSON para que seedDatabase los regenere
  const { seedDatabase } = require('../src/config/dataProvider');
  writeData('solicitudes', []);
  writeData('equipos', []);
  writeData('usuarios', []);
  writeData('historial', []);
  seedDatabase();
});

// Función auxiliar para no repetir el login en cada test
const loginAdmin = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@dds.com', password: 'admin123' });
  return res.body.token;
};

const loginUsuario = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'roberto@dds.com', password: 'password123' });
  return res.body.token;
};

// ── TEST 1: Devolución inválida ──────────────────────────────────
test('No debe permitir devolver una solicitud que no está aprobada', async () => {
  const token = await loginAdmin();

  // sol-1001 tiene estado 'aprobada' (índice 1, 1%5=1)
  // sol-1003 tiene estado 'rechazada' (índice 3, 3%5=3) → no se puede devolver
  const res = await request(app)
    .patch('/api/solicitudes/sol-1003/devolver')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/aprobadas/i);
});

// ── TEST 2: Transición prohibida ────────────────────────────────
test('No debe permitir aprobar una solicitud cancelada', async () => {
  const token = await loginAdmin();

  // sol-1004 tiene índice 4, 4%5=4 → estado 'cancelada'
  const res = await request(app)
    .patch('/api/solicitudes/sol-1004/aprobar')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/cancelada/i);
});

// ── TEST 3: Acceso sin rol suficiente ───────────────────────────
test('Un usuario común no puede aprobar solicitudes', async () => {
  const token = await loginUsuario();

  const res = await request(app)
    .patch('/api/solicitudes/sol-1001/aprobar')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(403);
});

// ── TEST 4: Acceso sin token ────────────────────────────────────
test('No debe permitir aprobar sin token JWT', async () => {
  const res = await request(app)
    .patch('/api/solicitudes/sol-1001/aprobar');
  // Sin header Authorization

  expect(res.status).toBe(401);
});

// ── TEST 5: Flujo de aprobación exitosa ─────────────────────────
test('Debe aprobar correctamente una solicitud pendiente válida', async () => {
  const token = await loginAdmin();

  // sol-1005 tiene índice 5, 5%5=0 → estado 'pendiente'
  const res = await request(app)
    .patch('/api/solicitudes/sol-1005/aprobar')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.estado).toBe('aprobada');
  expect(res.body.autorizadoPor).toBe('usr-admin');
});