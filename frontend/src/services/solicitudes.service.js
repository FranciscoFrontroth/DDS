// frontend/src/services/solicitudes.service.js
// Capa de servicios para el recurso solicitudes.
// Todos los componentes deben importar de acá, NUNCA llamar a Axios directamente.

import api from './api';

/**
 * Obtiene el listado de solicitudes con filtros, paginación y ordenamiento.
 *
 * @param {Object} params - Parámetros de búsqueda.
 * @param {string} [params.estado]
 * @param {string} [params.equipoId]
 * @param {string} [params.categoria]
 * @param {string} [params.desde]
 * @param {string} [params.hasta]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.sortBy='fechaRetiro']
 * @param {string} [params.order='asc']
 * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
 */
export async function getSolicitudes(params = {}) {
  // Axios serializa el objeto como query string automáticamente
  const response = await api.get('/solicitudes', { params });
  return response.data;
}

/**
 * Obtiene el detalle de una solicitud por id.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getSolicitudById(id) {
  const response = await api.get(`/solicitudes/${id}`);
  return response.data;
}

/**
 * Crea una nueva solicitud.
 *
 * @param {{ equipoId: string, fechaRetiro: string, fechaDevolucion: string, motivo: string }} data
 * @returns {Promise<Object>} La solicitud creada.
 */
export async function createSolicitud(data) {
  const response = await api.post('/solicitudes', data);
  return response.data;
}

/**
 * Edita una solicitud pendiente.
 *
 * @param {string} id
 * @param {{ fechaRetiro?: string, fechaDevolucion?: string, motivo?: string }} data
 * @returns {Promise<Object>} La solicitud actualizada.
 */
export async function updateSolicitud(id, data) {
  const response = await api.put(`/solicitudes/${id}`, data);
  return response.data;
}

/**
 * Obtiene el historial de cambios de una solicitud.
 *
 * @param {string} id
 * @returns {Promise<Array>}
 */
export async function getSolicitudHistorial(id) {
  const response = await api.get(`/solicitudes/${id}/historial`);
  return response.data;
}

/**
 * Extrae el mensaje de error de una respuesta de Axios de forma legible.
 *
 * @param {any} error - El error capturado en el catch.
 * @returns {string} Mensaje de error para mostrar al usuario.
 */
export function extractErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'Ocurrió un error inesperado. Por favor intentá de nuevo.';
}