const express = require('express');
const { registrarUsuario, iniciarSesion } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);

module.exports = router;
