const equiposService = require('../services/equipos.service');

const getEquipos = (req, res, next) => {
    try {

        const categoria = req.query.categoria;

        const equipos = equiposService.obtenerEquipos(
            categoria
        );

        res.status(200).json(equipos);

    } catch (error) {
        next(error);
    }
};

const getEquipoPorId = (req, res, next) => {
    try {

        const equipo = equiposService.obtenerEquipoPorId(
            req.params.id
        );

        if (!equipo) {
            return res.status(404).json({
                error: 'Equipo no encontrado'
            });
        }

        res.status(200).json(equipo);

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEquipos,
    getEquipoPorId
};
