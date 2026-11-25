
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const navigate = useNavigate();

    // Estados para los campos del formulario controlado
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');

    // Estados para alertas visuales y carga
    const [errorForm, setErrorForm] = useState('');
    const [errorApi, setErrorApi] = useState('');
    const [exito, setExito] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Limpiamos los cartelitos anteriores
        setErrorForm('');
        setErrorApi('');
        setExito('');

        // 1. VALIDACIÓN LOCAL (No gastemos recursos de red al vicio)
        if (!nombre.trim() || !email.trim() || !password.trim() || !confirmarPassword.trim()) {
            setErrorForm('Todos los campos son obligatorios para el registro.');
            return;
        }

        if (password.length < 6) {
            setErrorForm('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        // Validación clave: que el usuario no haya tipeado mal la contraseña por apurado
        if (password !== confirmarPassword) {
            setErrorForm('Las contraseñas no coinciden. Verificalas.');
            return;
        }

        // 2. ENVÍO DE DATOS AL BACKEND
        try {
            setCargando(true);
            
            // Le pasamos los datos limpios al backend
            await api.post('/auth/register', { nombre, email, password });
            
            // Si el backend no tiró error, el registro fue un éxito
            setExito('¡Usuario registrado con éxito! Ya puedes iniciar sesión.');

            // Limpiamos los inputs para que no quede la info vieja ahí colgada
            setNombre('');
            setEmail('');
            setPassword('');
            setConfirmarPassword('');

            setTimeout(() => navigate('/login', { replace: true }), 1000);

        } catch (error) {
            // Captura si el mail ya está usado o si falló el servidor
            setErrorApi(error.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Crear Cuenta</h2>

            {/* Carteles de alerta según lo que pase */}
            {errorForm && <p style={{ color: 'orange', fontWeight: 'bold' }}>⚠️ {errorForm}</p>}
            {errorApi && <p style={{ color: 'red', fontWeight: 'bold' }}>❌ {errorApi}</p>}
            {exito && <p style={{ color: 'green', fontWeight: 'bold' }}>✅ {exito}</p>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nombre Completo:</label>
                    <input 
                        type="text" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Juan Pérez"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Correo Electrónico:</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@dds.com"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Confirmar Contraseña:</label>
                    <input 
                        type="password" 
                        value={confirmarPassword}                        // <--- CONECTADO ACÁ
                        onChange={(e) => setConfirmarPassword(e.target.value)} // <--- CONECTADO ACÁ
                        placeholder="Repite tu contraseña"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={cargando}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {cargando ? 'Registrando...' : 'Registrarse'}
                </button>
            </form>
        </div>
    );
};

export default Register;
