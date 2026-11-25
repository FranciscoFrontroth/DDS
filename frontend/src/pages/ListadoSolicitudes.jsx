
// Pantalla de listado de solicitudes con filtros avanzados y paginación.
// Es la pantalla principal del módulo.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FiltrosSolicitudes from '../components/FiltrosSolicitudes';
import TablaSolicitudes from '../components/TablaSolicitudes';
import Paginacion from '../components/Paginacion';
import { getSolicitudes, extractErrorMessage } from '../services/solicitudes.service';
import { useAuth } from '../context/AuthContext';

export default function ListadoSolicitudes() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // --- Estado del listado ---
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // --- Estado de paginación ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // --- Estado de filtros activos ---
  const [filtrosActivos, setFiltrosActivos] = useState({});

  // ---------------------------------------------------------------------------
  // Función de carga: llama al servicio con filtros + paginación
  // ---------------------------------------------------------------------------
  const cargarSolicitudes = useCallback(async (filtros, paginaActual, limitActual) => {
    setCargando(true);
    setError(null);
    try {
      const params = {
        ...filtros,
        page: paginaActual,
        limit: limitActual,
      };
      const resultado = await getSolicitudes(params);
      setSolicitudes(resultado.data);
      setTotal(resultado.total);
      setTotalPages(resultado.totalPages);
    } catch (err) {
      setError(extractErrorMessage(err));
      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar al montar y cuando cambien filtros/paginación
  useEffect(() => {
    cargarSolicitudes(filtrosActivos, page, limit);
  }, [filtrosActivos, page, limit, cargarSolicitudes]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  function handleFiltrar(nuevosFiltros) {
    setFiltrosActivos(nuevosFiltros);
    setPage(1); // Volver a primera página al filtrar
  }

  function handleCambiarPagina(nuevaPagina) {
    setPage(nuevaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCambiarLimit(nuevoLimit) {
    setLimit(nuevoLimit);
    setPage(1);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={estilos.pagina}>
      {/* Encabezado */}
      <div style={estilos.encabezado}>
        <div>
          <h1 style={estilos.titulo}>Solicitudes de Equipamiento</h1>
          <p style={estilos.subtitulo}>
            {usuario ? `Bienvenido/a, ${usuario.nombre}` : 'Sistema de préstamos'}
          </p>
        </div>
        <button
          onClick={() => navigate('/solicitudes/nueva')}
          style={estilos.btnNueva}
        >
          + Nueva solicitud
        </button>
      </div>

      {/* Filtros */}
      <FiltrosSolicitudes onFiltrar={handleFiltrar} cargando={cargando} />

      {/* Tabla */}
      <div style={estilos.tarjeta}>
        <TablaSolicitudes
          solicitudes={solicitudes}
          cargando={cargando}
          error={error}
        />

        {/* Paginación (solo mostrar si hay datos) */}
        {!cargando && !error && (
          <Paginacion
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onCambiarPagina={handleCambiarPagina}
            onCambiarLimit={handleCambiarLimit}
          />
        )}
      </div>
    </div>
  );
}

const estilos = {
  pagina: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px 16px',
  },
  encabezado: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  titulo: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: '#212529',
  },
  subtitulo: {
    margin: '4px 0 0',
    fontSize: 14,
    color: '#6c757d',
  },
  btnNueva: {
    padding: '10px 20px',
    background: '#198754',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tarjeta: {
    background: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: 10,
    overflow: 'hidden',
  },
};
