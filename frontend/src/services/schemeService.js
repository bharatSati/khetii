import api from './api';

export const schemeService = {
  getSchemes: async (params = {}) => {
    const response = await api.get('/schemes', { params });
    return response.data;
  },

  getSchemeById: async (id) => {
    const response = await api.get(`/schemes/${id}`);
    return response.data;
  }
};
