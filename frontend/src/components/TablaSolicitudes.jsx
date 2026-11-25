// frontend/src/components/solicitudes/TablaSolicitudes.jsx
// Tabla que muestra el listado de solicitudes.
// Maneja estados: cargando, vacío, error y datos.

import { useNavigate } from 'react-router-dom';

const COLORES_ESTADO = {
  pendiente:  { bg: '#fff3cd', text: '#664d03' },
  aprobada:   { bg: '#d1e7dd', text: '#0a3622' },
  rechazada:  { bg: '#f8d7da', text: '#58151c' },
  cancelada:  { bg: '#e2e3e5', text: '#41464b' },
  devuelta:   { bg: '#cff4fc', text: '#055160' },
};

/**
 * @param {Object} props
 * @param {Array}  props.solicitudes - Lista de solicitudes a mostrar.
 * @param {boolean} props.cargando
 * @param {string|null} props.error
 */
export default function TablaSolicitudes({ solicitudes, cargando, error }) {
  const navigate = useNavigate();

  if (cargando) {
    return <div style={estilos.estado}>Cargando solicitudes…</div>;
  }

  if (error) {
    return (
      <div style={{ ...estilos.estado, color: '#dc3545', background: '#f8d7da', borderRadius: 8, padding: 16 }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!solicitudes || solicitudes.length === 0) {
    return (
      <div style={estilos.vacio}>
        <p style={{ fontSize: 18, color: '#6c757d' }}>No hay solicitudes que coincidan con los filtros.</p>
        <p style={{ color: '#adb5bd' }}>Intentá con otros criterios de búsqueda o creá una nueva solicitud.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={estilos.tabla}>
        <thead>
          <tr style={estilos.thead}>
            <th style={estilos.th}>ID</th>
            <th style={estilos.th}>Equipo</th>
            <th style={estilos.th}>Categoría</th>
            <th style={estilos.th}>Fecha Retiro</th>
            <th style={estilos.th}>Fecha Dev.</th>
            <th style={estilos.th}>Motivo</th>
            <th style={estilos.th}>Estado</th>
            <th style={estilos.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((sol) => (
            <tr
              key={sol.id}
              style={estilos.tr}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              <td style={{ ...estilos.td, fontFamily: 'monospace', fontSize: 12 }}>{sol.id}</td>
              <td style={estilos.td}>{sol.equipo?.nombre || sol.equipoId}</td>
              <td style={estilos.td}>{sol.equipo?.categoria || '—'}</td>
              <td style={estilos.td}>{formatFecha(sol.fechaRetiro)}</td>
              <td style={estilos.td}>{formatFecha(sol.fechaDevolucion)}</td>
              <td style={{ ...estilos.td, maxWidth: 200 }}>
                <span title={sol.motivo} style={estilos.motivo}>{sol.motivo}</span>
              </td>
              <td style={estilos.td}>
                <EstadoBadge estado={sol.estado} />
              </td>
              <td style={estilos.td}>
                <button
                  onClick={() => navigate(`/solicitudes/${sol.id}`)}
                  style={estilos.btnVer}
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const colores = COLORES_ESTADO[estado] || { bg: '#e9ecef', text: '#495057' };
  return (
    <span style={{
      background: colores.bg,
      color: colores.text,
      padding: '3px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {estado}
    </span>
  );
}

function formatFecha(fecha) {
  if (!fecha) return '—';
  // Muestra la fecha en formato local sin convertir timezone
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
}

const estilos = {
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
    background: '#fff',
  },
  thead: {
    background: '#343a40',
    color: '#fff',
  },
  th: {
    padding: '12px 14px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #dee2e6',
    background: '#fff',
    cursor: 'default',
    transition: 'background 0.1s',
  },
  td: {
    padding: '12px 14px',
    color: '#212529',
    verticalAlign: 'middle',
  },
  motivo: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 200,
  },
  btnVer: {
    padding: '5px 12px',
    background: '#0d6efd',
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600,
  },
  estado: {
    textAlign: 'center',
    padding: 32,
    color: '#6c757d',
  },
  vacio: {
    textAlign: 'center',
    padding: '48px 16px',
    background: '#f8f9fa',
    borderRadius: 8,
    border: '2px dashed #dee2e6',
  },
};