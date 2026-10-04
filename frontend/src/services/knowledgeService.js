import api from './api';

export const knowledgeService = {
  getArticles: async (params = {}) => {
    const response = await api.get('/knowledge', { params });
    return response.data;
  },

  getArticleById: async (id) => {
    const response = await api.get(`/knowledge/${id}`);
    return response.data;
  }
};
