//primero instalamos 2 modulos que vienen dentro de Node.js
const fs = require('fs'); // File System: Permite leer y escribir archivos físicos.
const path = require('path'); // Path: Ayuda a armar rutas de carpetas sin importar si usás Windows, Mac o Linux.
// algoritmo de encriptacion por hash para la contraseña
const bcrypt = require('bcryptjs');
// Le decimos a Node dónde va a estar la carpeta con los archivos .json. Queremos que esté en la raíz del proyecto, en una carpeta llamada data.
const DATA_DIR = path.join(__dirname, '../../data');

// Nos aseguramos de que la carpeta 'data' exista localmente
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Función genérica para leer cualquier archivo JSON
const readData = (entity) => {
    // Construye la ruta exacta. Ej: "raiz/data/equipos.json"
  const filePath = path.join(DATA_DIR, `${entity}.json`);
  // Si el archivo todavía no existe, devolvemos un array vacío [] para que el sistema no explote.
  if (!fs.existsSync(filePath)) return [];
  // Lee el archivo como texto plano (utf-8)
  const content = fs.readFileSync(filePath, 'utf-8');
  // Si el archivo existe pero está totalmente en blanco, devuelve []
  // Si tiene texto, lo transforma de JSON (texto) a un Array de objetos reales.
  return content ? JSON.parse(content) : [];
};

// Función genérica para escribir datos en un archivo JSON
const writeData = (entity, data) => {
  const filePath = path.join(DATA_DIR, `${entity}.json`);
  // Convierte el objeto/array a texto JSON. 
  // El "null, 2" es un truco para que el archivo quede ordenado con espacios y sea legible para humanos.
  // Escribe y sobrescribe el archivo con los nuevos datos.
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// Inicialización automática de datos semilla obligatorios (Requisito 17 del enunciado)
const seedDatabase = () => {
  // 1. Inicializar Usuarios
  if (readData('usuarios').length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const seedUsuarios = [
      { id: "usr-001", nombre: "Roberto Carlos", email: "roberto@dds.com", passwordHash: bcrypt.hashSync("password123", salt), rol: "usuario", activo: true },
      { id: "usr-002", nombre: "Carla Ruiz", email: "carla@dds.com", passwordHash: bcrypt.hashSync("password123", salt), rol: "usuario", activo: true },
      { id: "usr-003", nombre: "Tomás López", email: "tomas@dds.com", passwordHash: bcrypt.hashSync("password123", salt), rol: "usuario", activo: true },
      { id: "usr-admin", nombre: "Admin General", email: "admin@dds.com", passwordHash: bcrypt.hashSync("admin123", salt), rol: "admin", activo: true },
      { id: "usr-enc", nombre: "Encargado Lab", email: "encargado@dds.com", passwordHash: bcrypt.hashSync("encargado123", salt), rol: "encargado", activo: true }
    ];
    writeData('usuarios', seedUsuarios);
  }

  // 2. Inicializar Equipos (Mínimo 8 equipos con categorías variadas)
  if (readData('equipos').length === 0) {
    const seedEquipos = [
      { id: "eq-001", codigoInventario: "INV-2026-001", nombre: "Notebook Dell 14", categoria: "notebook", estado: "disponible", ubicacion: "Laboratorio A5", requiereAutorizacion: false },
      { id: "eq-002", codigoInventario: "INV-2026-002", nombre: "Notebook HP ProBook", categoria: "notebook", estado: "disponible", ubicacion: "Laboratorio A5", requiereAutorizacion: false },
      { id: "eq-003", codigoInventario: "INV-2026-003", nombre: "Proyector Epson X41", categoria: "proyector", estado: "disponible", ubicacion: "Sala de Reuniones", requiereAutorizacion: true },
      { id: "eq-004", codigoInventario: "INV-2026-004", nombre: "Cámara Sony Alpha 7", categoria: "cámara", estado: "disponible", ubicacion: "Audiovisuales", requiereAutorizacion: true },
      { id: "eq-005", codigoInventario: "INV-2026-005", nombre: "Kit de Red Cisco", categoria: "kit de red", estado: "disponible", ubicacion: "Laboratorio de Redes", requiereAutorizacion: true },
      { id: "eq-006", codigoInventario: "INV-2026-006", nombre: "Notebook Lenovo ThinkPad", categoria: "notebook", estado: "prestado", ubicacion: "Laboratorio B1", requiereAutorizacion: false },
      { id: "eq-007", codigoInventario: "INV-2026-007", nombre: "Proyector BenQ", categoria: "proyector", estado: "mantenimiento", ubicacion: "Taller Soporte", requiereAutorizacion: false },
      { id: "eq-008", codigoInventario: "INV-2026-008", nombre: "Cámara Canon T7", categoria: "cámara", estado: "baja", ubicacion: "Depósito", requiereAutorizacion: false }
    ];
    writeData('equipos', seedEquipos);
  }

  // 3. Inicializar Solicitudes (Mínimo 12 solicitudes en diferentes estados)
  if (readData('solicitudes').length === 0) {
    const seedSolicitudes = [];
    const estados = ["pendiente", "aprobada", "rechazada", "cancelada", "devuelta"];
    for (let i = 1; i <= 12; i++) {
      seedSolicitudes.push({
        id: `sol-100${i}`,
        equipoId: i <= 4 ? "eq-001" : i <= 8 ? "eq-002" : "eq-003",
        usuarioId: i % 2 === 0 ? "usr-001" : "usr-002",
        fechaRetiro: `2026-06-1${i}`,
        fechaDevolucion: `2026-06-2${i}`,
        motivo: `Práctica académica de laboratorio nº ${i}`,
        estado: estados[i % estados.length],
        autorizadoPor: i % estados.length === 1 ? "usr-admin" : null
      });
    }
    writeData('solicitudes', seedSolicitudes);
  }

  // 4. Inicializar Historial vacío
  if (readData('historial').length === 0) {
    writeData('historial', []);
  }
};

// Wrapper functions for backwards compatibility with legacy db.js pattern
const getAll = (entity) => readData(entity);

const getById = (entity, id) => {
  const items = readData(entity);
  return items.find((item) => item.id === id) || null;
};

const insert = (entity, item) => {
  const items = readData(entity);
  items.push(item);
  writeData(entity, items);
  return item;
};

const update = (entity, id, updates) => {
  const items = readData(entity);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  writeData(entity, items);
  return items[index];
};

module.exports = { readData, writeData, seedDatabase, getAll, getById, insert, update };