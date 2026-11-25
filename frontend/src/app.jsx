// frontend/src/App.jsx
// Configuración del router con las rutas del módulo de solicitudes.
// Las rutas de auth (login, register) son responsabilidad de otro integrante.
// Se incluyen acá como referencia para la integración.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ListadoSolicitudes from './pages/ListadoSolicitudes';
import FormularioSolicitud from './pages/FormularioSolicitud';
import Login from './pages/Login';

// ---------------------------------------------------------------------------
// Componente de ruta protegida
// Redirige al login si no hay usuario autenticado.
// ---------------------------------------------------------------------------
function RutaProtegida({ children }) {
  const { usuario } = useAuth();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ---------------------------------------------------------------------------
// Componente de ruta solo para admin/encargado
// ---------------------------------------------------------------------------
function RutaAdmin({ children }) {
  const { esAdmin } = useAuth();
  if (!esAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <h2>Acceso denegado</h2>
        <p>No tenés permiso para ver esta página.</p>
      </div>
    );
  }
  return children;
}

// ---------------------------------------------------------------------------
// Layout base (a completar con Navbar por otro integrante)
// ---------------------------------------------------------------------------
function Layout({ children }) {
  const { usuario, logout } = useAuth();
  return (
    <div>
      <nav style={{
        background: '#212529',
        color: '#fff',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <strong>📦 Sistema de Equipamiento</strong>
        {usuario && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 14 }}>
            <span style={{ color: '#adb5bd' }}>{usuario.nombre} ({usuario.rol})</span>
            <button
              onClick={logout}
              style={{ background: 'none', border: '1px solid #6c757d', color: '#fff', padding: '4px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>
      <main>{children}</main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rutas de la aplicación
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz: redirige al listado */}
          <Route path="/" element={<Navigate to="/solicitudes" replace />} />

          {/* Rutas del módulo de solicitudes (este módulo) */}
          <Route
            path="/solicitudes"
            element={
              <RutaProtegida>
                <Layout>
                  <ListadoSolicitudes />
                </Layout>
              </RutaProtegida>
            }
          />
          <Route
            path="/solicitudes/nueva"
            element={
              <RutaProtegida>
                <Layout>
                  <FormularioSolicitud />
                </Layout>
              </RutaProtegida>
            }
          />
          <Route
            path="/solicitudes/:id/editar"
            element={
              <RutaProtegida>
                <Layout>
                  <FormularioSolicitud />
                </Layout>
              </RutaProtegida>
            }
          />

          {/* Detalle de solicitud (implementado por módulo de detalle/estados) */}
          {/* <Route path="/solicitudes/:id" element={<RutaProtegida><Layout><DetalleSolicitud /></Layout></RutaProtegida>} /> */}

          <Route path="/login" element={<Login />} />

          {/* Auth (implementado por módulo de autenticación) */}
          {/* <Route path="/register" element={<Register />} /> */}

          {/* Admin (implementado por módulo de administración) */}
          {/* <Route path="/admin" element={<RutaAdmin><Layout><PanelAdmin /></Layout></RutaAdmin>} /> */}

          {/* Ruta comodín: página no encontrada (requerida por el enunciado) */}
          <Route
            path="*"
            element={
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <h1 style={{ fontSize: 64, color: '#dee2e6' }}>404</h1>
                <h2 style={{ color: '#495057' }}>Página no encontrada</h2>
                <p style={{ color: '#6c757d' }}>
                  La ruta que buscás no existe.{' '}
                  <a href="/solicitudes" style={{ color: '#0d6efd' }}>Ir al inicio</a>
                </p>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
