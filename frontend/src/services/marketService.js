import api from './api';

export const marketService = {
  getMarketPrices: async (params = {}) => {
    const response = await api.get('/market', { params });
    return response.data;
  },

  getFilters: async () => {
    const response = await api.get('/market/filters');
    return response.data;
  }
};
