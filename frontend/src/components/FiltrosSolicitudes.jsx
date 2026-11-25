// frontend/src/components/solicitudes/FiltrosSolicitudes.jsx
// Barra de filtros combinables para el listado de solicitudes.
// Los filtros se envían como params a la API (no se filtran en el cliente).

import { useState } from 'react';

const ESTADOS = ['', 'pendiente', 'aprobada', 'rechazada', 'cancelada', 'devuelta'];
const CATEGORIAS = ['', 'notebook', 'proyector', 'cámara', 'kit de red'];

/**
 * Componente de filtros avanzados.
 *
 * @param {Object} props
 * @param {Function} props.onFiltrar - Callback llamado con el objeto de filtros cuando el usuario aplica.
 * @param {boolean} props.cargando - Deshabilita el botón mientras carga.
 */
export default function FiltrosSolicitudes({ onFiltrar, cargando }) {
  const [filtros, setFiltros] = useState({
    estado: '',
    categoria: '',
    desde: '',
    hasta: '',
    sortBy: 'fechaRetiro',
    order: 'asc',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Limpiar filtros vacíos antes de enviar
    const activos = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v !== '')
    );
    onFiltrar(activos);
  }

  function handleLimpiar() {
    const limpios = {
      estado: '',
      categoria: '',
      desde: '',
      hasta: '',
      sortBy: 'fechaRetiro',
      order: 'asc',
    };
    setFiltros(limpios);
    onFiltrar({});
  }

  return (
    <form onSubmit={handleSubmit} style={estilos.form}>
      <div style={estilos.fila}>

        {/* Filtro por estado */}
        <div style={estilos.campo}>
          <label style={estilos.label} htmlFor="estado">Estado</label>
          <select
            id="estado"
            name="estado"
            value={filtros.estado}
            onChange={handleChange}
            style={estilos.select}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e === '' ? 'Todos los estados' : capitalize(e)}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por categoría */}
        <div style={estilos.campo}>
          <label style={estilos.label} htmlFor="categoria">Categoría</label>
          <select
            id="categoria"
            name="categoria"
            value={filtros.categoria}
            onChange={handleChange}
            style={estilos.select}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c === '' ? 'Todas las categorías' : capitalize(c)}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de fecha desde */}
        <div style={estilos.campo}>
          <label style={estilos.label} htmlFor="desde">Desde (retiro)</label>
          <input
            type="date"
            id="desde"
            name="desde"
            value={filtros.desde}
            onChange={handleChange}
            style={estilos.input}
          />
        </div>

        {/* Filtro de fecha hasta */}
        <div style={estilos.campo}>
          <label style={estilos.label} htmlFor="hasta">Hasta (retiro)</label>
          <input
            type="date"
            id="hasta"
            name="hasta"
            value={filtros.hasta}
            onChange={handleChange}
            style={estilos.input}
          />
        </div>
      </div>

      <div style={estilos.fila}>
        {/* Ordenamiento */}
        <div style={estilos.campo}>
          <label style={estilos.label} htmlFor="sortBy">Ordenar por</label>
          <select
            id="sortBy"
            name="sortBy"
            value={filtros.sortBy}
            onChange={handleChange}
            style={estilos.select}
          >
            <option value="fechaRetiro">Fecha de retiro</option>
            <option value="fechaDevolucion">Fecha de devolución</option>
            <option value="estado">Estado</option>
          </select>
        </div>

        <div style={estilos.campo}>
          <label style={estilos.label} htmlFor="order">Dirección</label>
          <select
            id="order"
            name="order"
            value={filtros.order}
            onChange={handleChange}
            style={estilos.select}
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>

        {/* Botones */}
        <div style={{ ...estilos.campo, justifyContent: 'flex-end', alignSelf: 'flex-end' }}>
          <button
            type="button"
            onClick={handleLimpiar}
            style={estilos.btnSecundario}
            disabled={cargando}
          >
            Limpiar
          </button>
          <button
            type="submit"
            style={estilos.btnPrimario}
            disabled={cargando}
          >
            {cargando ? 'Buscando…' : 'Filtrar'}
          </button>
        </div>
      </div>
    </form>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const estilos = {
  form: {
    background: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 20,
  },
  fila: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 160,
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#495057',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '8px 10px',
    border: '1px solid #ced4da',
    borderRadius: 6,
    fontSize: 14,
    color: '#212529',
    background: '#fff',
  },
  select: {
    padding: '8px 10px',
    border: '1px solid #ced4da',
    borderRadius: 6,
    fontSize: 14,
    color: '#212529',
    background: '#fff',
    cursor: 'pointer',
  },
  btnPrimario: {
    padding: '9px 20px',
    background: '#0d6efd',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 8,
  },
  btnSecundario: {
    padding: '9px 16px',
    background: '#fff',
    color: '#6c757d',
    border: '1px solid #ced4da',
    borderRadius: 6,
    fontSize: 14,
    cursor: 'pointer',
  },
};