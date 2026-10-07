import api from './api';

export const weatherService = {
  /**
   * Get live weather & deterministic farm intelligence
   * Supports both legacy signature getWeather(lat, lon) and extended object getWeather({ lat, lon, crops, ... })
   */
  getWeather: async (arg1, arg2, arg3 = {}) => {
    let params = {};

    if (typeof arg1 === 'object' && arg1 !== null) {
      params = { ...arg1 };
    } else {
      if (arg1 !== undefined && arg1 !== null) params.lat = arg1;
      if (arg2 !== undefined && arg2 !== null) params.lon = arg2;
      if (typeof arg3 === 'object') Object.assign(params, arg3);
    }

    if (Array.isArray(params.crops)) {
      params.crops = params.crops.join(',');
    }

    const response = await api.get('/weather', { params });
    return response.data;
  },

  /**
   * Fetch daily structured AI farm briefing
   */
  getAiBrief: async (params = {}) => {
    const queryParams = { ...params };
    if (Array.isArray(queryParams.crops)) {
      queryParams.crops = queryParams.crops.join(',');
    }
    const response = await api.get('/weather/ai-brief', { params: queryParams });
    return response.data;
  },

  /**
   * Ask Khetii AI Farm Advisor a custom question (supports voice text input)
   */
  askAdvisor: async ({ query, lat, lon, crops, landSizeAcres, city, district, state, lang }) => {
    const payload = {
      query,
      lat,
      lon,
      crops: Array.isArray(crops) ? crops : crops ? [crops] : [],
      landSizeAcres,
      city,
      district,
      state,
      lang
    };
    const response = await api.post('/weather/ask', payload);
    return response.data;
  }
};

export default weatherService;
