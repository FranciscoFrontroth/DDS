import './EquiposList.css';

function EquiposList({ equipos }) {
    return (
        <div className="equipos-container">

            {equipos.map((equipo) => (
                <div
                    key={equipo.id}
                    className="equipo-card"
                >
                    <h3>{equipo.nombre}</h3>

                    <p>
                        Categoría: {equipo.categoria}
                    </p>

                    <p className={`estado ${equipo.estado.trim().toLowerCase()}`}>
                        Estado: {equipo.estado}
                    </p>

                    <p>
                        Ubicación: {equipo.ubicacion}
                    </p>
                </div>
            ))}

        </div>
    );
}

export default EquiposList;