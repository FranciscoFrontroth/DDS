const express = require('express');

const router = express.Router();

const {
    getEquipos
} = require('../controllers/equipos.controller');

router.get('/', getEquipos);

module.exports = router;