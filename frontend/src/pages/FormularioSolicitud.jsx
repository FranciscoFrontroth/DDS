
// Pantalla transaccional para alta y edición de solicitudes.
// Modo 'nueva' -> POST /api/solicitudes
// Modo 'editar' -> PUT /api/solicitudes/:id (solo si estado === 'pendiente')
//
// Lee el parámetro :id de la URL para saber si es edición.
// Usa useState para formularios controlados.

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSolicitud, updateSolicitud, getSolicitudById, extractErrorMessage } from '../services/solicitudes.service';
import api from '../services/api';

export default function FormularioSolicitud() {
  const navigate = useNavigate();
  const { id } = useParams(); // undefined si es alta, string si es edición
  const esEdicion = Boolean(id);

  // --- Estado del formulario ---
  const [form, setForm] = useState({
    equipoId: '',
    fechaRetiro: '',
    fechaDevolucion: '',
    motivo: '',
  });

  // --- Estado de UI ---
  const [equipos, setEquipos] = useState([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(false);
  const [cargandoSolicitud, setCargandoSolicitud] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState(null); // error de validación frontend
  const [errorApi, setErrorApi] = useState(null);   // error de la API
  const [exito, setExito] = useState(false);
  const [fechaMinima, setFechaMinima] = useState(''); // fecha mínima (hoy) en formato YYYY-MM-DD

  // --- Calcular fecha mínima (hoy) ---
  useEffect(() => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const día = String(hoy.getDate()).padStart(2, '0');
    setFechaMinima(`${año}-${mes}-${día}`);
  }, []);

  // ---------------------------------------------------------------------------
  // Cargar equipos disponibles para el selector
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function cargarEquipos() {
      setCargandoEquipos(true);
      try {
        const res = await api.get('/equipos');
        // Solo mostrar equipos disponibles para nueva solicitud
        setEquipos(res.data);
      } catch (err) {
        console.error('Error al cargar equipos:', err);
      } finally {
        setCargandoEquipos(false);
      }
    }
    cargarEquipos();
  }, []);

  // ---------------------------------------------------------------------------
  // Cargar solicitud existente si es modo edición
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!esEdicion) return;

    async function cargarSolicitud() {
      setCargandoSolicitud(true);
      try {
        const solicitud = await getSolicitudById(id);
        if (solicitud.estado !== 'pendiente') {
          setErrorApi(
            `Esta solicitud está en estado '${solicitud.estado}' y no puede editarse. Solo se pueden editar solicitudes pendientes.`
          );
          return;
        }
        setForm({
          equipoId: solicitud.equipoId,
          fechaRetiro: solicitud.fechaRetiro,
          fechaDevolucion: solicitud.fechaDevolucion,
          motivo: solicitud.motivo,
        });
      } catch (err) {
        setErrorApi(extractErrorMessage(err));
      } finally {
        setCargandoSolicitud(false);
      }
    }
    cargarSolicitud();
  }, [id, esEdicion]);

  // ---------------------------------------------------------------------------
  // Handlers del formulario
  // ---------------------------------------------------------------------------
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorForm(null); // limpiar error al modificar
    setErrorApi(null);
  }

  /**
   * Validación de frontend (duplicada en el backend como fuente de verdad).
   * Retorna un mensaje de error o null si todo está bien.
   */
  function validar() {
    if (!form.equipoId) return 'Debés seleccionar un equipo.';
    if (!form.fechaRetiro) return 'La fecha de retiro es requerida.';
    if (!form.fechaDevolucion) return 'La fecha de devolución es requerida.';
    if (!form.motivo.trim() || form.motivo.trim().length < 5) {
      return 'El motivo debe tener al menos 5 caracteres.';
    }
    if (new Date(form.fechaRetiro) >= new Date(form.fechaDevolucion)) {
      return 'La fecha de retiro debe ser anterior a la fecha de devolución.';
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validación frontend
    const errorValidacion = validar();
    if (errorValidacion) {
      setErrorForm(errorValidacion);
      return;
    }

    setEnviando(true);
    setErrorApi(null);
    setErrorForm(null);

    try {
      if (esEdicion) {
        // En edición solo enviamos los campos editables
        await updateSolicitud(id, {
          fechaRetiro: form.fechaRetiro,
          fechaDevolucion: form.fechaDevolucion,
          motivo: form.motivo,
        });
      } else {
        await createSolicitud(form);
      }
      setExito(true);
      // Redirigir al listado después de 1.5 segundos
      setTimeout(() => navigate('/solicitudes'), 1500);
    } catch (err) {
      // Mostrar el mensaje de error de la API cerca del formulario
      setErrorApi(extractErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (cargandoSolicitud) {
    return <div style={estilos.cargando}>Cargando solicitud…</div>;
  }

  return (
    <div style={estilos.pagina}>
      <div style={estilos.tarjeta}>

        {/* Encabezado */}
        <div style={estilos.encabezado}>
          <button onClick={() => navigate('/solicitudes')} style={estilos.btnVolver}>
            ← Volver al listado
          </button>
          <h1 style={estilos.titulo}>
            {esEdicion ? 'Editar Solicitud' : 'Nueva Solicitud de Equipamiento'}
          </h1>
          <p style={estilos.subtitulo}>
            {esEdicion
              ? `Modificar fechas o motivo de la solicitud ${id}`
              : 'Completá los datos para solicitar un préstamo de equipo'}
          </p>
        </div>

        {/* Mensaje de éxito */}
        {exito && (
          <div style={estilos.alerta.exito}>
            ✅ Solicitud {esEdicion ? 'actualizada' : 'creada'} correctamente. Redirigiendo…
          </div>
        )}

        {/* Error de API (validación del backend) */}
        {errorApi && (
          <div style={estilos.alerta.error}>
            ⚠️ {errorApi}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={estilos.form} noValidate>

          {/* Selector de equipo (deshabilitado en edición) */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="equipoId">
              Equipo <span style={estilos.requerido}>*</span>
            </label>
            <select
              id="equipoId"
              name="equipoId"
              value={form.equipoId}
              onChange={handleChange}
              disabled={esEdicion || cargandoEquipos}
              style={{
                ...estilos.input,
                background: esEdicion ? '#e9ecef' : '#fff',
                cursor: esEdicion ? 'not-allowed' : 'pointer',
              }}
              required
            >
              <option value="">
                {cargandoEquipos ? 'Cargando equipos…' : '— Seleccioná un equipo —'}
              </option>
              {equipos.map((eq) => (
                <option
                  key={eq.id}
                  value={eq.id}
                  disabled={eq.estado !== 'disponible'}
                >
                  {eq.nombre} ({eq.categoria}) —{' '}
                  {eq.estado === 'disponible' ? '✓ Disponible' : `✗ ${eq.estado}`}
                  {eq.requiereAutorizacion ? ' 🔒' : ''}
                </option>
              ))}
            </select>
            {esEdicion && (
              <small style={estilos.ayuda}>
                El equipo no puede modificarse en una edición.
              </small>
            )}
          </div>

          {/* Fechas en fila */}
          <div style={estilos.fila}>
            <div style={estilos.campo}>
              <label style={estilos.label} htmlFor="fechaRetiro">
                Fecha de retiro <span style={estilos.requerido}>*</span>
              </label>
              <input
                type="date"
                id="fechaRetiro"
                name="fechaRetiro"
                value={form.fechaRetiro}
                onChange={handleChange}
                min={fechaMinima}
                style={estilos.input}
                required
              />
            </div>
            <div style={estilos.campo}>
              <label style={estilos.label} htmlFor="fechaDevolucion">
                Fecha de devolución <span style={estilos.requerido}>*</span>
              </label>
              <input
                type="date"
                id="fechaDevolucion"
                name="fechaDevolucion"
                value={form.fechaDevolucion}
                onChange={handleChange}
                min={form.fechaRetiro || undefined}
                style={estilos.input}
                required
              />
              {form.fechaRetiro && form.fechaDevolucion &&
                new Date(form.fechaRetiro) >= new Date(form.fechaDevolucion) && (
                  <small style={{ color: '#dc3545', marginTop: 4 }}>
                    Debe ser posterior a la fecha de retiro.
                  </small>
                )}
            </div>
          </div>

          {/* Motivo */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="motivo">
              Motivo del préstamo <span style={estilos.requerido}>*</span>
            </label>
            <textarea
              id="motivo"
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              rows={3}
              placeholder="Describí para qué necesitás el equipo (mínimo 5 caracteres)"
              style={{ ...estilos.input, resize: 'vertical', fontFamily: 'inherit' }}
              required
            />
            <small style={estilos.ayuda}>
              {form.motivo.trim().length} caracteres (mínimo 5)
            </small>
          </div>

          {/* Error de validación frontend */}
          {errorForm && (
            <div style={estilos.alerta.validacion}>
              ⚠️ {errorForm}
            </div>
          )}

          {/* Botones */}
          <div style={estilos.botones}>
            <button
              type="button"
              onClick={() => navigate('/solicitudes')}
              style={estilos.btnCancelar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={estilos.btnEnviar}
              disabled={enviando || exito}
            >
              {enviando
                ? 'Guardando…'
                : esEdicion
                ? 'Guardar cambios'
                : 'Crear solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const estilos = {
  pagina: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '24px 16px',
  },
  tarjeta: {
    background: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: 12,
    padding: '28px 32px',
  },
  encabezado: {
    marginBottom: 24,
  },
  titulo: {
    margin: '8px 0 4px',
    fontSize: 22,
    fontWeight: 700,
    color: '#212529',
  },
  subtitulo: {
    margin: 0,
    fontSize: 14,
    color: '#6c757d',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  fila: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 200,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#495057',
    marginBottom: 6,
  },
  requerido: {
    color: '#dc3545',
    marginLeft: 2,
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ced4da',
    borderRadius: 7,
    fontSize: 14,
    color: '#212529',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  ayuda: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  botones: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  btnEnviar: {
    padding: '10px 24px',
    background: '#0d6efd',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnCancelar: {
    padding: '10px 20px',
    background: '#fff',
    color: '#6c757d',
    border: '1px solid #ced4da',
    borderRadius: 7,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnVolver: {
    background: 'none',
    border: 'none',
    color: '#0d6efd',
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 8,
  },
  alerta: {
    exito: {
      background: '#d1e7dd',
      color: '#0a3622',
      border: '1px solid #a3cfbb',
      borderRadius: 7,
      padding: '12px 16px',
      fontSize: 14,
      fontWeight: 500,
    },
    error: {
      background: '#f8d7da',
      color: '#58151c',
      border: '1px solid #f1aeb5',
      borderRadius: 7,
      padding: '12px 16px',
      fontSize: 14,
      fontWeight: 500,
    },
    validacion: {
      background: '#fff3cd',
      color: '#664d03',
      border: '1px solid #ffda6a',
      borderRadius: 7,
      padding: '10px 14px',
      fontSize: 13,
    },
  },
  cargando: {
    textAlign: 'center',
    padding: 48,
    color: '#6c757d',
  },
};
