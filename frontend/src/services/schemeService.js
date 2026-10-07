import api from './api';

export const schemeService = {
  getSchemes: async (params = {}) => {
    const response = await api.get('/schemes', { params });
    return response.data;
  },

  getSchemeById: async (id) => {
    const response = await api.get(`/schemes/${id}`);
    return response.data;
  },

  askSchemeAI: async ({ schemeId, question, lang, schemeData }) => {
    const response = await api.post('/schemes/ask-ai', {
      schemeId,
      question,
      lang,
      schemeData
    });
    return response.data;
  }
};
