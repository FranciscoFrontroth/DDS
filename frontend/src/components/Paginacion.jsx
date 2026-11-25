// frontend/src/components/Paginacion.jsx
// Controles de paginación para el listado.

/**
 * @param {Object} props
 * @param {number} props.page - Página actual (1-based).
 * @param {number} props.totalPages - Total de páginas.
 * @param {number} props.total - Total de registros.
 * @param {number} props.limit - Items por página.
 * @param {Function} props.onCambiarPagina - Callback(nuevaPagina).
 * @param {Function} props.onCambiarLimit - Callback(nuevoLimit).
 */
export default function Paginacion({ page, totalPages, total, limit, onCambiarPagina, onCambiarLimit }) {
  const inicio = (page - 1) * limit + 1;
  const fin = Math.min(page * limit, total);

  return (
    <div style={estilos.contenedor}>
      <span style={estilos.info}>
        Mostrando {total === 0 ? 0 : inicio}–{fin} de {total} solicitudes
      </span>

      <div style={estilos.controles}>
        <label style={estilos.labelLimit} htmlFor="limit">Por página:</label>
        <select
          id="limit"
          value={limit}
          onChange={(e) => onCambiarLimit(Number(e.target.value))}
          style={estilos.select}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <button
          onClick={() => onCambiarPagina(1)}
          disabled={page <= 1}
          style={estilos.btn}
          title="Primera página"
        >
          «
        </button>
        <button
          onClick={() => onCambiarPagina(page - 1)}
          disabled={page <= 1}
          style={estilos.btn}
        >
          ‹ Anterior
        </button>

        <span style={estilos.pagina}>
          Página {page} de {totalPages || 1}
        </span>

        <button
          onClick={() => onCambiarPagina(page + 1)}
          disabled={page >= totalPages}
          style={estilos.btn}
        >
          Siguiente ›
        </button>
        <button
          onClick={() => onCambiarPagina(totalPages)}
          disabled={page >= totalPages}
          style={estilos.btn}
          title="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
}

const estilos = {
  contenedor: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 4px',
    flexWrap: 'wrap',
    gap: 12,
  },
  info: {
    fontSize: 13,
    color: '#6c757d',
  },
  controles: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  labelLimit: {
    fontSize: 13,
    color: '#495057',
  },
  select: {
    padding: '4px 8px',
    border: '1px solid #ced4da',
    borderRadius: 5,
    fontSize: 13,
  },
  btn: {
    padding: '5px 10px',
    border: '1px solid #ced4da',
    borderRadius: 5,
    background: '#fff',
    color: '#0d6efd',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  },
  pagina: {
    fontSize: 13,
    color: '#495057',
    padding: '0 8px',
  },
};
