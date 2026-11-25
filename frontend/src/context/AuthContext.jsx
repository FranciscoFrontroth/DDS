// frontend/src/context/AuthContext.jsx
// Contexto global para manejar el usuario autenticado, token y rol.
// Cualquier componente puede acceder con useAuth().

import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  // Inicializar desde localStorage para persistir la sesión entre recargas
  const [usuario, setUsuario] = useState(() => {
    try {
      const stored = localStorage.getItem('usuario');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  /**
   * Guardar sesión después del login exitoso.
   * @param {{ id, nombre, email, rol }} usuarioData
   * @param {string} jwtToken
   */
  const login = useCallback((usuarioData, jwtToken) => {
    setUsuario(usuarioData);
    setToken(jwtToken);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    localStorage.setItem('token', jwtToken);
  }, []);

  /**
   * Cerrar sesión: limpiar estado y localStorage.
   */
  const logout = useCallback(() => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  }, []);

  /**
   * Verificar si el usuario tiene uno de los roles dados.
   * @param {...string} roles
   */
  const tieneRol = useCallback(
    (...roles) => {
      if (!usuario) return false;
      return roles.includes(usuario.rol);
    },
    [usuario]
  );

  const esAdmin = tieneRol('admin', 'encargado');

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, tieneRol, esAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}