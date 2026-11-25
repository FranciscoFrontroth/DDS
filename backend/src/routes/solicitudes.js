const express = require('express');
const router = express.Router();

const autenticarJWT  = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/autorizarRol');
const ctrl = require('../controllers/solicitudes');

router.get('/', autenticarJWT, ctrl.listar);
router.get('/:id', autenticarJWT, ctrl.detalle);
router.get('/:id/historial', autenticarJWT, ctrl.historial);
router.post('/', autenticarJWT, ctrl.crear);
router.put('/:id', autenticarJWT, ctrl.editar);

router.patch('/:id/aprobar',
  autenticarJWT,                       // verifica que tenga token válido
  autorizarRol('admin', 'encargado'),  // verifica que tenga el rol correcto
  ctrl.aprobar
);

router.patch('/:id/rechazar',
  autenticarJWT,
  autorizarRol('admin', 'encargado'),
  ctrl.rechazar
);

router.patch('/:id/cancelar',
  autenticarJWT,
  // Sin autorizarRol: un usuario común también puede cancelar la suya
  // La validación de propiedad la hace el servicio
  ctrl.cancelar
);

router.patch('/:id/devolver',
  autenticarJWT,
  autorizarRol('admin', 'encargado'),
  ctrl.devolver
);

module.exports = router;