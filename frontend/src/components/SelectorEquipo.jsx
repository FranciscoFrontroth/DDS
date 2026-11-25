function SelectorEquipo({
    equipos,
    value,
    onChange
}) {

    return (
        <select
            value={value}
            onChange={onChange}
        >
            <option value="">
                Seleccione un equipo
            </option>

            {equipos.map(equipo => (
                <option
                    key={equipo.id}
                    value={equipo.id}
                >
                    {equipo.nombre}
                </option>
            ))}
        </select>
    );
}

export default SelectorEquipo;