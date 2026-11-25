import { useEffect, useState } from 'react';
import { obtenerEquipos } from '../services/equiposService';
import EquiposList from '../components/EquiposList';

function CatalogoEquipos() {

    const [equipos, setEquipos] = useState([]);
    const [categoria, setCategoria] = useState('');

    useEffect(() => {

        const cargarEquipos = async () => {

            const datos = await obtenerEquipos(
                categoria
            );

            setEquipos(datos);
        };

        cargarEquipos();

    }, [categoria]);

    return (
        <div>
            <h2>Catálogo de Equipos</h2>

            <div>
                <button onClick={() => setCategoria('')}>
                    Todos
                </button>

                <button onClick={() => setCategoria('notebook')}>
                    Notebook
                </button>

                <button onClick={() => setCategoria('proyector')}>
                    Proyector
                </button>

                <button onClick={() => setCategoria('cámara')}>
                    Cámara
                </button>
            </div>

            <EquiposList equipos={equipos} />
        </div>
    );
}

export default CatalogoEquipos;