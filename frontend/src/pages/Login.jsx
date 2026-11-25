import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { usuario, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (usuario) {
      navigate('/solicitudes', { replace: true });
    }
  }, [usuario, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError('Debe ingresar un email.');
      return;
    }

    if (!password.trim()) {
      setError('Debe ingresar una contraseña.');
      return;
    }

    try {
      const { data } = await api.post('/auth/login', { email, password });

      login(data.usuario, data.token);
      navigate('/solicitudes', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas.');
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Iniciar sesión</h1>
        <p style={styles.subtitle}>Ingresá para acceder al módulo de solicitudes.</p>

        {error && <div style={styles.error}>{error}</div>}

        <p style={styles.helperText}>
          ¿No tenés cuenta? <a href="/register" style={styles.link}>Crear cuenta</a>
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="usuario@ejemplo.com"
          />

          <label style={styles.label} htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="********"
          />

          <button type="submit" style={styles.button}>Entrar</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f6f9',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 14,
    padding: 32,
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: '#212529',
  },
  subtitle: {
    margin: '12px 0 24px',
    color: '#6c757d',
    lineHeight: 1.5,
  },
  helperText: {
    margin: '0 0 18px',
    fontSize: 14,
    color: '#495057',
  },
  link: {
    color: '#0d6efd',
    textDecoration: 'none',
    fontWeight: 600,
  },
  error: {
    marginBottom: 16,
    color: '#842029',
    background: '#f8d7da',
    padding: '12px 16px',
    borderRadius: 8,
  },
  form: {
    display: 'grid',
    gap: 14,
  },
  label: {
    display: 'block',
    fontSize: 14,
    color: '#495057',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #ced4da',
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    padding: '12px 18px',
    background: '#0d6efd',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
  },
};
