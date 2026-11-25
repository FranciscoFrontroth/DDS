import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:3000/api";

export default function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, esAdmin, usuario } = useAuth();

  const [solicitud, setSolicitud] = useState(null);
  const [equipo, setEquipo] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [accionando, setAccionando] = useState(false);

  // ─── Determinar permisos según rol ───────────────────────────
  // El enunciado dice: admin Y encargado pueden aprobar, rechazar y devolver
  // No solo admin — este era el bug del componente original
  const puedeGestionar = esAdmin || usuario?.rol === "encargado";
  const esDuenio =
    solicitud?.solicitante === usuario?.nombre ||
    solicitud?.usuarioId === usuario?.id;

  // ─── Determinar si el préstamo está vencido ──────────────────
  // Punto 15 del enunciado: fechaDevolucion anterior a hoy y estado aprobada
  const esVencida =
    solicitud?.estado === "aprobada" &&
    new Date(solicitud.fechaDevolucion) < new Date();

  // ─── Carga inicial: solicitud, equipo e historial ────────────
  useEffect(() => {
    if (!token) return;

    setCargando(true);
    setError("");

    axios
      .get(`${API}/solicitudes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((resSolicitud) => {
        const sol = resSolicitud.data;
        setSolicitud(sol);

        // Una vez que tenemos la solicitud, cargamos equipo e historial en paralelo
        return Promise.all([
          axios.get(`${API}/equipos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API}/solicitudes/${id}/historial`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]).then(([resEquipos, resHistorial]) => {
          // Buscamos el equipo que corresponde a esta solicitud
          const equipoEncontrado = resEquipos.data.find(
            (e) => e.id === sol.equipoId
          );
          setEquipo(equipoEncontrado || null);
          setHistorial(resHistorial.data || []);
        });
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError("La solicitud no existe.");
        } else {
          setError("Error al cargar la solicitud. Intentá de nuevo.");
        }
      })
      .finally(() => setCargando(false));
  }, [id, token]);

  // ─── Ejecutar acciones de estado ─────────────────────────────
  const ejecutarAccion = async (accion) => {
    // Limpiar mensajes anteriores
    setMensajeExito("");
    setMensajeError("");
    setAccionando(true);

    try {
      const res = await axios.patch(
        `${API}/solicitudes/${id}/${accion}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar la solicitud con los datos frescos del backend
      setSolicitud(res.data);

      // Si la acción afecta el estado del equipo, recargarlo
      if (["aprobar", "devolver", "cancelar"].includes(accion)) {
        const resEquipos = await axios.get(`${API}/equipos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const equipoActualizado = resEquipos.data.find(
          (e) => e.id === res.data.equipoId
        );
        setEquipo(equipoActualizado || null);
      }

      // Recargar historial para mostrar el nuevo registro de auditoría
      const resHistorial = await axios.get(
        `${API}/solicitudes/${id}/historial`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistorial(resHistorial.data || []);

      setMensajeExito(`Acción '${accion}' realizada con éxito.`);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setMensajeExito(""), 3000);
    } catch (err) {
      // Mostrar el mensaje de error que viene del backend
      setMensajeError(
        err.response?.data?.error || "Ocurrió un error inesperado."
      );
      setTimeout(() => setMensajeError(""), 4000);
    } finally {
      setAccionando(false);
    }
  };

  // ─── Color de badge según estado ─────────────────────────────
  const colorEstado = {
    pendiente: "#fd7e14",
    aprobada: "#198754",
    rechazada: "#dc3545",
    cancelada: "#6c757d",
    devuelta: "#0d6efd",
  };

  // ─── Estados de carga y error ─────────────────────────────────
  if (!token) return <p>No autenticado. Por favor iniciá sesión.</p>;
  if (cargando) return <p>Cargando solicitud...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!solicitud) return <p>Solicitud no encontrada.</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem" }}>

      {/* Botón para volver */}
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: "1rem", cursor: "pointer" }}
      >
        ← Volver
      </button>

      <h2>Detalle de Solicitud #{solicitud.id}</h2>

      {/* Badge de vencida — punto 15 del enunciado */}
      {esVencida && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: 6,
            padding: "0.75rem",
            marginBottom: "1rem",
            color: "#856404",
          }}
        >
          ⚠️ <strong>Préstamo vencido</strong> — debería haberse devuelto el{" "}
          {solicitud.fechaDevolucion}. Por favor registrá la devolución.
        </div>
      )}

      {/* Datos principales de la solicitud */}
      <div
        style={{
          background: "#f8f9fa",
          padding: "1rem",
          borderRadius: 8,
          marginBottom: "1rem",
        }}
      >
        {/* Estado con color */}
        <p>
          <strong>Estado:</strong>{" "}
          <span
            style={{
              background: colorEstado[solicitud.estado] || "#aaa",
              color: "white",
              borderRadius: 4,
              padding: "2px 10px",
              fontSize: 13,
            }}
          >
            {solicitud.estado}
          </span>
        </p>

        {/* Datos del equipo — ahora muestra nombre real, no solo el ID */}
        <p>
          <strong>Equipo:</strong>{" "}
          {equipo ? `${equipo.nombre} (${equipo.categoria})` : solicitud.equipoId}
        </p>
        {equipo && (
          <>
            <p><strong>Ubicación:</strong> {equipo.ubicacion}</p>
            <p>
              <strong>Estado del equipo:</strong> {equipo.estado}
            </p>
          </>
        )}

        <p>
          <strong>Solicitante:</strong>{" "}
          {solicitud.solicitante || solicitud.usuarioId}
        </p>
        <p><strong>Motivo:</strong> {solicitud.motivo}</p>
        <p><strong>Fecha de retiro:</strong> {solicitud.fechaRetiro}</p>
        <p><strong>Fecha de devolución:</strong> {solicitud.fechaDevolucion}</p>

        {solicitud.autorizadoPor && (
          <p>
            <strong>Autorizado por:</strong> {solicitud.autorizadoPor}
          </p>
        )}
      </div>

      {/* Mensajes de éxito y error — separados y con colores distintos */}
      {mensajeExito && (
        <div
          style={{
            background: "#d1e7dd",
            border: "1px solid #badbcc",
            borderRadius: 6,
            padding: "0.75rem",
            marginBottom: "1rem",
            color: "#0f5132",
          }}
        >
          ✅ {mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div
          style={{
            background: "#f8d7da",
            border: "1px solid #f5c2c7",
            borderRadius: 6,
            padding: "0.75rem",
            marginBottom: "1rem",
            color: "#842029",
          }}
        >
          ❌ {mensajeError}
        </div>
      )}

      {/* Botones de acción con control de rol correcto */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>

        {/* Aprobar: solo admin o encargado, solo si está pendiente */}
        {puedeGestionar && solicitud.estado === "pendiente" && (
          <button
            onClick={() => ejecutarAccion("aprobar")}
            disabled={accionando}
            style={{ cursor: accionando ? "not-allowed" : "pointer" }}
          >
            {accionando ? "Procesando..." : "✅ Aprobar"}
          </button>
        )}

        {/* Rechazar: solo admin o encargado, solo si está pendiente */}
        {puedeGestionar && solicitud.estado === "pendiente" && (
          <button
            onClick={() => ejecutarAccion("rechazar")}
            disabled={accionando}
            style={{ cursor: accionando ? "not-allowed" : "pointer" }}
          >
            {accionando ? "Procesando..." : "❌ Rechazar"}
          </button>
        )}

        {/* Cancelar: el dueño o admin/encargado, si no fue devuelta ni rechazada */}
        {(puedeGestionar || esDuenio) &&
          ["pendiente", "aprobada"].includes(solicitud.estado) && (
            <button
              onClick={() => ejecutarAccion("cancelar")}
              disabled={accionando}
              style={{ cursor: accionando ? "not-allowed" : "pointer" }}
            >
              {accionando ? "Procesando..." : "🚫 Cancelar"}
            </button>
          )}

        {/* Devolver: solo admin o encargado, solo si está aprobada */}
        {puedeGestionar && solicitud.estado === "aprobada" && (
          <button
            onClick={() => ejecutarAccion("devolver")}
            disabled={accionando}
            style={{ cursor: accionando ? "not-allowed" : "pointer" }}
          >
            {accionando ? "Procesando..." : "↩️ Devolver"}
          </button>
        )}
      </div>

      {/* Historial de cambios — línea de tiempo de auditoría */}
      <h3>Historial de cambios</h3>
      {historial.length === 0 ? (
        <p style={{ color: "#888" }}>Sin cambios registrados aún.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {historial.map((h) => (
            <li
              key={h.id}
              style={{
                borderLeft: "3px solid #0d6efd",
                paddingLeft: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>{h.accion}</strong> —{" "}
                {new Date(h.fechaHora).toLocaleString("es-AR")}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                Usuario: {h.usuarioId}
              </p>
              {h.valorAnterior && (
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                  Antes: {JSON.stringify(h.valorAnterior)} → Después:{" "}
                  {JSON.stringify(h.valorNuevo)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}