import api from './api';

export const weatherService = {
  getWeather: async (lat, lon) => {
    const params = {};
    if (lat !== undefined && lon !== undefined) {
      params.lat = lat;
      params.lon = lon;
    }
    const response = await api.get('/weather', { params });
    return response.data;
  }
};

export default weatherService;
