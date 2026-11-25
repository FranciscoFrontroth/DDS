const { readData, writeData } = require('../config/dataProvider');

// Obtener todos los equipos
// Obtener todos los equipos o filtrar por categoría
const obtenerEquipos = (categoria) => {

    const equipos = readData('equipos');

    if (!categoria) {
        return equipos;
    }

    return equipos.filter(
        equipo => equipo.categoria === categoria
    );
};

// Obtener un equipo por ID
const obtenerEquipoPorId = (id) => {
    const equipos = readData('equipos');

    return equipos.find(
        equipo => equipo.id === id
    );
};

// Actualizar estado de un equipo
const actualizarEstadoEquipo = (id, nuevoEstado) => {

    const equipos = readData('equipos');

    const equipo = equipos.find(
        e => e.id === id
    );

    if (!equipo) {
        throw new Error('Equipo no encontrado');
    }

    equipo.estado = nuevoEstado;

    writeData('equipos', equipos);

    return equipo;
};

module.exports = {
    obtenerEquipos,
    obtenerEquipoPorId,
    actualizarEstadoEquipo
};
