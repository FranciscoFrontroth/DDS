//PRIMER TEST
const equiposService = require('../src/services/equipos.service');

describe('Modulo Equipos', () => {

    test('Debe cambiar el estado de un equipo existente', () => {

        const equipoActualizado =
            equiposService.actualizarEstadoEquipo(
                'eq-001',
                'prestado'
            );

        expect(
            equipoActualizado.estado
        ).toBe('prestado');

    });

});

// SEGUNDO TEST
test(
    'Debe lanzar error si el equipo no existe',
    () => {

        expect(() => {

            equiposService.actualizarEstadoEquipo(
                'eq-inexistente',
                'prestado'
            );

        }).toThrow(
            'Equipo no encontrado'
        );

    }
);