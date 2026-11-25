//Lo primero que hace es llamar al servicio para poder usar registrar y login 
const authService = require('../services/auth.service');

//Controlador para registrar un nuevo usuario Maneja el endpoint: POST /api/auth/register
const registrarUsuario = (req, res, next) =>{
    try {
        const { nombre, email, password } = req.body;
        // Validación de campos obligatorios en la capa de transporte (HTTP)
        if (!nombre || !email || !password) {
            const error = new Error("Todos los campos son obligatorios.");
            error.status = 400;
            throw error;
            };
        // Delegamos la lógica de negocio al servicio
        const usuarioCreado = authService.registrar(nombre, email, password);
        // Respondemos con el estado 201 Created y el objeto limpio
        res.status(201).json({
            mensaje: "Usuario registrado con éxito.",
            usuario: usuarioCreado
        });     
    } catch (error) {
        // Si el servicio o la validación tiró un error, viaja al manejador global
        next(error);
    }
};
//Controlador para el inicio de sesión Maneja el endpoint: POST /api/auth/login
const iniciarSesion = (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validación rápida de credenciales vacías
        if (!email || !password) {
            const error = new Error("Email y contraseña son obligatorios.");
            error.status = 400;
            throw error;
        }
        // Llamamos al servicio para verificar claves y firmar el token JWT
        const dataLogin = authService.login(email, password);
        // Respondemos con un 200 OK implícito y desparramamos el token y datos del usuario
        res.json({
            mensaje: "Login exitoso",
            ...dataLogin
        });
    } catch (error) {
      next(error);
    }
};
// Exportación oficial de los métodos del controlador
module.exports = {
  registrarUsuario,
  iniciarSesion
};