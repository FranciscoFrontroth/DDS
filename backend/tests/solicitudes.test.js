// backend/tests/solicitudes.test.js
// Tests de backend con Jest + Supertest.
// Cubren: creación válida, fechas inválidas, equipo no disponible,
// superposición, acceso sin JWT y acceso con rol insuficiente.

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = require('../app');

// ---------------------------------------------------------------------------
// Configuración del entorno de test
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILES = ['usuarios', 'equipos', 'solicitudes', 'historial_solicitudes'];
const JWT_SECRET = process.env.JWT_SECRET || 'dds2026_secret_key_cambiar_en_produccion';

const filePath = (entity) => path.join(DATA_DIR, `${entity}.json`);
const readRaw = (entity) => fs.readFileSync(filePath(entity), 'utf-8');
const writeRaw = (entity, data) => {
  fs.writeFileSync(filePath(entity), data, 'utf-8');
};
const writeJson = (entity, data) => {
  fs.writeFileSync(filePath(entity), JSON.stringify(data, null, 2), 'utf-8');
};

const testData = {
  usuarios: [
    {
      id: 'usr-001',
      nombre: 'Carla Ruiz',
      email: 'carla@dds.com',
      passwordHash: '$2b$10$zempXikCukttn520y9VHlufXNF2XXUlU5S.G0HfwkYKxGOnNLGsQS',
      rol: 'usuario',
      activo: true,
    },
    {
      id: 'usr-002',
      nombre: 'Tomás López',
      email: 'tomas@dds.com',
      passwordHash: '$2b$10$zempXikCukttn520y9VHlufXNF2XXUlU5S.G0HfwkYKxGOnNLGsQS',
      rol: 'usuario',
      activo: true,
    },
    {
      id: 'usr-admin',
      nombre: 'Admin Sistema',
      email: 'admin@dds.com',
      passwordHash: '$2b$10$zempXikCukttn520y9VHlufhXs0qcBAJ5wKc6c9iX864fit/ohNTO',
      rol: 'admin',
      activo: true,
    },
    {
      id: 'usr-enc',
      nombre: 'Encargado Lab',
      email: 'encargado@dds.com',
      passwordHash: '$2b$10$zempXikCukttn520y9VHluqoYwAw11YhxqViSGmkfw4oEagLfpBj6',
      rol: 'encargado',
      activo: true,
    },
  ],
  equipos: [
    {
      id: 'eq-001',
      codigoInventario: 'INV-2026-001',
      nombre: 'Notebook Dell 14',
      categoria: 'notebook',
      estado: 'disponible',
      ubicacion: 'Laboratorio A5',
      requiereAutorizacion: false,
    },
    {
      id: 'eq-002',
      codigoInventario: 'INV-2026-002',
      nombre: 'Notebook HP ProBook',
      categoria: 'notebook',
      estado: 'disponible',
      ubicacion: 'Laboratorio A5',
      requiereAutorizacion: false,
    },
    {
      id: 'eq-003',
      codigoInventario: 'INV-2026-003',
      nombre: 'Proyector Epson X41',
      categoria: 'proyector',
      estado: 'disponible',
      ubicacion: 'Sala de Reuniones',
      requiereAutorizacion: true,
    },
    {
      id: 'eq-004',
      codigoInventario: 'INV-2026-004',
      nombre: 'Cámara Sony Alpha 7',
      categoria: 'cámara',
      estado: 'disponible',
      ubicacion: 'Audiovisuales',
      requiereAutorizacion: true,
    },
    {
      id: 'eq-005',
      codigoInventario: 'INV-2026-005',
      nombre: 'Kit de Red Cisco',
      categoria: 'kit de red',
      estado: 'disponible',
      ubicacion: 'Laboratorio de Redes',
      requiereAutorizacion: true,
    },
    {
      id: 'eq-006',
      codigoInventario: 'INV-2026-006',
      nombre: 'Notebook Lenovo ThinkPad',
      categoria: 'notebook',
      estado: 'prestado',
      ubicacion: 'Laboratorio B1',
      requiereAutorizacion: false,
    },
    {
      id: 'eq-007',
      codigoInventario: 'INV-2026-007',
      nombre: 'Proyector BenQ',
      categoria: 'proyector',
      estado: 'mantenimiento',
      ubicacion: 'Taller Soporte',
      requiereAutorizacion: false,
    },
    {
      id: 'eq-008',
      codigoInventario: 'INV-2026-008',
      nombre: 'Cámara Canon T7',
      categoria: 'cámara',
      estado: 'baja',
      ubicacion: 'Depósito',
      requiereAutorizacion: false,
    },
  ],
  solicitudes: [
    {
      id: 'sol-1001',
      equipoId: 'eq-001',
      usuarioId: 'usr-001',
      fechaRetiro: '2026-06-10',
      fechaDevolucion: '2026-06-12',
      motivo: 'Práctica de laboratorio',
      estado: 'aprobada',
      autorizadoPor: 'usr-admin',
    },
    {
      id: 'sol-1002',
      equipoId: 'eq-002',
      usuarioId: 'usr-002',
      fechaRetiro: '2026-06-14',
      fechaDevolucion: '2026-06-16',
      motivo: 'Trabajo práctico DDS',
      estado: 'pendiente',
      autorizadoPor: null,
    },
    {
      id: 'sol-1003',
      equipoId: 'eq-003',
      usuarioId: 'usr-001',
      fechaRetiro: '2026-06-15',
      fechaDevolucion: '2026-06-17',
      motivo: 'Presentación parcial',
      estado: 'rechazada',
      autorizadoPor: 'usr-enc',
    },
    {
      id: 'sol-1004',
      equipoId: 'eq-004',
      usuarioId: 'usr-002',
      fechaRetiro: '2026-06-08',
      fechaDevolucion: '2026-06-11',
      motivo: 'Proyecto fotográfico',
      estado: 'devuelta',
      autorizadoPor: 'usr-admin',
    },
    {
      id: 'sol-1005',
      equipoId: 'eq-005',
      usuarioId: 'usr-001',
      fechaRetiro: '2026-06-18',
      fechaDevolucion: '2026-06-20',
      motivo: 'Clase de redes',
      estado: 'pendiente',
      autorizadoPor: null,
    },
    {
      id: 'sol-1006',
      equipoId: 'eq-006',
      usuarioId: 'usr-002',
      fechaRetiro: '2026-06-20',
      fechaDevolucion: '2026-06-22',
      motivo: 'Exposición proyecto',
      estado: 'cancelada',
      autorizadoPor: null,
    },
    {
      id: 'sol-1007',
      equipoId: 'eq-001',
      usuarioId: 'usr-002',
      fechaRetiro: '2026-06-25',
      fechaDevolucion: '2026-06-28',
      motivo: 'Desarrollo web',
      estado: 'pendiente',
      autorizadoPor: null,
    },
    {
      id: 'sol-1008',
      equipoId: 'eq-008',
      usuarioId: 'usr-001',
      fechaRetiro: '2026-06-05',
      fechaDevolucion: '2026-06-07',
      motivo: 'Práctica switch',
      estado: 'aprobada',
      autorizadoPor: 'usr-enc',
    },
  ],
  historial_solicitudes: [
    {
      id: 'hist-001',
      solicitudId: 'sol-1001',
      usuarioId: 'usr-001',
      accion: 'creacion',
      fechaHora: '2026-06-09T10:00:00.000Z',
      valorAnterior: null,
      valorNuevo: { estado: 'pendiente' },
    },
    {
      id: 'hist-002',
      solicitudId: 'sol-1001',
      usuarioId: 'usr-admin',
      accion: 'aprobacion',
      fechaHora: '2026-06-09T11:00:00.000Z',
      valorAnterior: { estado: 'pendiente' },
      valorNuevo: { estado: 'aprobada' },
    },
  ],
};

let originalData;

// Tokens de test (no se necesita un servidor de auth real para los tests)
const tokenUsuario = jwt.sign(
  { id: 'usr-001', nombre: 'Carla Ruiz', email: 'carla@dds.com', rol: 'usuario' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const tokenUsuario2 = jwt.sign(
  { id: 'usr-002', nombre: 'Tomás López', email: 'tomas@dds.com', rol: 'usuario' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const tokenUserAlias = jwt.sign(
  { id: 'usr-externo', nombre: 'Carla Ruiz', email: 'externo@dds.com', rol: 'user' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const tokenAdmin = jwt.sign(
  { id: 'usr-admin', nombre: 'Admin Sistema', email: 'admin@dds.com', rol: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const tokenEncargado = jwt.sign(
  { id: 'usr-enc', nombre: 'Encargado Lab', email: 'encargado@dds.com', rol: 'encargado' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// ---------------------------------------------------------------------------
// Setup/Teardown: respaldar y restaurar la DB antes y después de cada test
// ---------------------------------------------------------------------------

beforeAll(() => {
  originalData = Object.fromEntries(DATA_FILES.map((entity) => [entity, readRaw(entity)]));
});

beforeEach(() => {
  DATA_FILES.forEach((entity) => writeJson(entity, testData[entity]));
});

afterAll(() => {
  DATA_FILES.forEach((entity) => writeRaw(entity, originalData[entity]));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/solicitudes - Creación de solicitud', () => {
  // Test 1: Creación válida
  it('debe crear una solicitud válida y devolver 201', async () => {
    const body = {
      equipoId: 'eq-002', // notebook HP, disponible
      fechaRetiro: '2026-07-10',
      fechaDevolucion: '2026-07-15',
      motivo: 'Práctica de laboratorio DDS',
    };

    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.estado).toBe('pendiente');
    expect(res.body.equipoId).toBe('eq-002');
    expect(res.body.usuarioId).toBe('usr-001');
  });

  // Test 2: Rechazo por fechas inconsistentes (retiro >= devolución)
  it('debe rechazar con 400 si fechaRetiro es igual a fechaDevolucion', async () => {
    const body = {
      equipoId: 'eq-002',
      fechaRetiro: '2026-07-10',
      fechaDevolucion: '2026-07-10', // igual al retiro → inválido
      motivo: 'Test de fechas iguales',
    };

    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/anterior/i);
  });

  it('debe rechazar con 400 si fechaRetiro es posterior a fechaDevolucion', async () => {
    const body = {
      equipoId: 'eq-002',
      fechaRetiro: '2026-07-20',
      fechaDevolucion: '2026-07-10', // retiro posterior a devolución → inválido
      motivo: 'Test de fechas invertidas',
    };

    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/anterior/i);
  });

  // Test 3: Equipo inexistente
  it('debe rechazar con 404 si el equipo no existe', async () => {
    const body = {
      equipoId: 'eq-999', // no existe
      fechaRetiro: '2026-07-10',
      fechaDevolucion: '2026-07-15',
      motivo: 'Prueba equipo inexistente',
    };

    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(body);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no existe/i);
  });

  // Test 4: Equipo no disponible (estado !== 'disponible')
  it('debe rechazar con 400 si el equipo no está disponible', async () => {
    const body = {
      equipoId: 'eq-007', // estado: mantenimiento
      fechaRetiro: '2026-07-10',
      fechaDevolucion: '2026-07-15',
      motivo: 'Prueba equipo en mantenimiento',
    };

    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/disponible/i);
  });

  // Test 5: Superposición con solicitud aprobada
  it('debe rechazar con 400 si hay superposición con solicitud aprobada', async () => {
    // sol-1001: eq-001, aprobada, 2026-06-10 a 2026-06-12
    const body = {
      equipoId: 'eq-001',
      fechaRetiro: '2026-06-11', // se superpone con sol-1001
      fechaDevolucion: '2026-06-14',
      motivo: 'Prueba superposición',
    };

    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/superpone|superpuesta/i);
  });

  // Test 6: Campos faltantes
  it('debe rechazar con 400 si faltan campos requeridos', async () => {
    const body = {
      equipoId: 'eq-002',
      // sin fechaRetiro, fechaDevolucion, motivo
    };

    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Tests de acceso sin JWT y con rol insuficiente
// ---------------------------------------------------------------------------

describe('Autenticación y autorización en solicitudes', () => {
  // Test 7: Acceso sin JWT a ruta protegida
  it('debe devolver 401 si no se envía JWT al crear una solicitud', async () => {
    const res = await request(app)
      .post('/api/solicitudes')
      .send({
        equipoId: 'eq-002',
        fechaRetiro: '2026-07-10',
        fechaDevolucion: '2026-07-15',
        motivo: 'Sin token',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('debe devolver 401 si no se envía JWT al listar solicitudes', async () => {
    const res = await request(app).get('/api/solicitudes');
    expect(res.status).toBe(401);
  });

  it('debe devolver 401 si el JWT es inválido o expirado', async () => {
    const res = await request(app)
      .get('/api/solicitudes')
      .set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // Test 8: Intentar editar solicitud de otro usuario (usuario común)
  it('debe devolver 403 si usuario intenta editar solicitud ajena', async () => {
    // sol-1002 pertenece a usr-002, token es de usr-001
    const res = await request(app)
      .put('/api/solicitudes/sol-1002')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send({ motivo: 'Intento de edición no autorizado' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/permiso/i);
  });

  // Test 9: Admin puede editar cualquier solicitud pendiente
  it('admin debe poder editar cualquier solicitud pendiente', async () => {
    const res = await request(app)
      .put('/api/solicitudes/sol-1002')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ motivo: 'Edición por admin autorizada' });

    expect(res.status).toBe(200);
    expect(res.body.motivo).toBe('Edición por admin autorizada');
  });
});

// ---------------------------------------------------------------------------
// Tests de listado con filtros y paginación
// ---------------------------------------------------------------------------

describe('GET /api/solicitudes - Listado con filtros', () => {
  it('debe listar solicitudes y devolver estructura de paginación', async () => {
    const res = await request(app)
      .get('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe mostrar solo las solicitudes del cliente autenticado cuando su rol es usuario', async () => {
    const res = await request(app)
      .get('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((solicitud) => {
      expect(solicitud.usuarioId).toBe('usr-001');
      expect(solicitud.solicitante).toBe('Carla Ruiz');
    });
  });

  it('debe mostrar solo las solicitudes del cliente autenticado cuando su rol es user', async () => {
    const res = await request(app)
      .get('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenUserAlias}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((solicitud) => {
      expect(solicitud.solicitante).toBe('Carla Ruiz');
    });
  });

  it('encargado debe poder listar todas las solicitudes', async () => {
    const res = await request(app)
      .get('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenEncargado}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((solicitud) => solicitud.solicitante === 'Carla Ruiz')).toBe(true);
    expect(res.body.data.some((solicitud) => solicitud.usuarioId === 'usr-002')).toBe(true);
  });

  it('debe permitir que un usuario cancele solo sus propias solicitudes', async () => {
    const res = await request(app)
      .patch('/api/solicitudes/sol-1002/cancelar')
      .set('Authorization', `Bearer ${tokenUsuario2}`);

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('cancelada');
  });

  it('debe impedir que un cliente cancele solicitudes de otro solicitante', async () => {
    const res = await request(app)
      .patch('/api/solicitudes/sol-1002/cancelar')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/propias/i);
  });

  it('debe registrar la acción de cancelar/devolver en el historial visible para el admin', async () => {
    const cancelarRes = await request(app)
      .patch('/api/solicitudes/sol-1001/cancelar')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(cancelarRes.status).toBe(200);

    const historialRes = await request(app)
      .get('/api/solicitudes/sol-1001/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(historialRes.status).toBe(200);
    expect(historialRes.body.some((item) => item.accion === 'cancelacion')).toBe(true);
  });

  it('debe filtrar por estado=pendiente', async () => {
    const res = await request(app)
      .get('/api/solicitudes?estado=pendiente')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((s) => {
      expect(s.estado).toBe('pendiente');
    });
  });

  it('debe respetar paginación (page=1, limit=2)', async () => {
    const res = await request(app)
      .get('/api/solicitudes?page=1&limit=2')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.page).toBe(1);
  });

  it('debe devolver lista vacía si no hay resultados para el filtro', async () => {
    const res = await request(app)
      .get('/api/solicitudes?estado=estadoQueNoExiste')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests de detalle e historial
// ---------------------------------------------------------------------------

describe('GET /api/solicitudes/:id - Detalle', () => {
  it('debe devolver el detalle de una solicitud existente', async () => {
    const res = await request(app)
      .get('/api/solicitudes/sol-1001')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('sol-1001');
    expect(res.body).toHaveProperty('equipo');
  });

  it('debe devolver 403 si un cliente intenta ver una solicitud de otro solicitante', async () => {
    const res = await request(app)
      .get('/api/solicitudes/sol-1002')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/permisos/i);
  });

  it('debe devolver 403 si un cliente intenta ver el historial de otra solicitud', async () => {
    const res = await request(app)
      .get('/api/solicitudes/sol-1002/historial')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/permisos/i);
  });

  it('debe devolver 404 para una solicitud inexistente', async () => {
    const res = await request(app)
      .get('/api/solicitudes/sol-9999')
      .set('Authorization', `Bearer ${tokenUsuario}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
