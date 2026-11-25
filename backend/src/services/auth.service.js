const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../config/dataProvider');
//clave o firma virtual que lleva cada token jwt para saber que no fue vulnerado en el trayecto
const SECRET_KEY = process.env.JWT_SECRET || 'dds2026_secret_key_cambiar_en_produccion';

// 1. Lógica de registro de nuevos usuarios
const registrar = (nombre, email, password) => {
    const usuarios = readData('usuarios');
    // Controlamos si el email ya existe en nuestro archivo JSON
    const existe = usuarios.find(u => u.email === email);
    if (existe) {
        const error = new Error("El email ya se encuentra registrado.");
        error.status = 400;
        throw error;
    }
    // Hasheamos la contraseña con Bcrypt antes de guardarla
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const nuevoUsuario = {
        id: `usr-${Date.now()}`,
        nombre,
        email,
        passwordHash,
        rol: 'usuario',
        activo: true
    };

    const usuariosActuales = readData('usuarios');
    writeData('usuarios', [...usuariosActuales, nuevoUsuario]);

    return { id: nuevoUsuario.id, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email, rol: nuevoUsuario.rol };
};
// 2. Lógica de inicio de sesión (Login)
const login = (email, password) => {
    const usuarios = readData('usuarios');
    // Buscamos si existe el usuario por email
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario || !usuario.activo) {
        const error = new Error("Credenciales inválidas o usuario inactivo.");
        error.status = 401;
        throw error;
    };
    //si el usuario existe y esta activo ahora verificamos la contraseña
    const passwordCorrecto = bcrypt.compareSync(password, usuario.passwordHash);
    if (!passwordCorrecto) {
        const error = new Error("Credenciales inválidas.");
    error.status = 401; // unauthorized
    throw error;
    };
    //si la contraseña es correcta pasamos a fabricarle su token de acceso JWT
    //info publica que viaja dentro del token, no ponemos datos sensibles
    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };
    // agarro ese payload y lo encripto con la secret key
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });
    // le devolvemos al controlador un objeto con el token y los datos basicos del usuario
    return {
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    };
};
//hacemos visibles las 2 funciones para el resto del proyecto
module.exports = {
  registrar,
  login
};