// backend/data/db.js
// Capa de acceso a datos usando archivo JSON como persistencia.
// Lee y escribe sincrónicamente para simplificar el código del TP.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

/**
 * Lee toda la base de datos del archivo JSON.
 * @returns {Object} Objeto con todas las colecciones.
 */
function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Escribe toda la base de datos en el archivo JSON.
 * @param {Object} data - Objeto completo con todas las colecciones.
 */
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Devuelve todos los registros de una colección.
 * @param {string} collection - Nombre de la colección (ej: 'solicitudes').
 */
function getAll(collection) {
  const db = readDB();
  return db[collection] || [];
}

/**
 * Busca un registro por id en una colección.
 * @param {string} collection
 * @param {string} id
 */
function getById(collection, id) {
  const items = getAll(collection);
  return items.find((item) => item.id === id) || null;
}

/**
 * Inserta un nuevo registro en una colección.
 * @param {string} collection
 * @param {Object} item
 */
function insert(collection, item) {
  const db = readDB();
  db[collection].push(item);
  writeDB(db);
  return item;
}

/**
 * Actualiza un registro existente por id.
 * @param {string} collection
 * @param {string} id
 * @param {Object} updates - Campos a actualizar (merge parcial).
 * @returns {Object|null} El registro actualizado, o null si no existe.
 */
function update(collection, id, updates) {
  const db = readDB();
  const idx = db[collection].findIndex((item) => item.id === id);
  if (idx === -1) return null;
  db[collection][idx] = { ...db[collection][idx], ...updates };
  writeDB(db);
  return db[collection][idx];
}

module.exports = { readDB, writeDB, getAll, getById, insert, update };