import axios from 'axios';

const API_URL = 'http://localhost:3000/api/equipos';

export const obtenerEquipos = async (categoria = '') => {

    let url = API_URL;

    if (categoria) {
        url = `${API_URL}?categoria=${categoria}`;
    }

    const response = await axios.get(url);

    return response.data;
};