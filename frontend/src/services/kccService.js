import api from './api';

export const kccService = {
  /**
   * Search KCC advisories with intelligent query matching and AI summary
   */
  search: async ({ query = '', crop = '', category = '', state = '', limit = 6, aiExplain = true, lang = 'hi' }) => {
    const params = {
      query,
      crop: crop || undefined,
      category: category || undefined,
      state: state || undefined,
      limit,
      aiExplain,
      lang
    };
    const response = await api.get('/kcc/search', { params });
    return response.data;
  },

  /**
   * Fetch KCC metadata (crops, categories, total records)
   */
  getMetadata: async () => {
    const response = await api.get('/kcc/metadata');
    return response.data;
  },

  /**
   * Fetch popular sample KCC advisories
   */
  getPopular: async () => {
    const response = await api.get('/kcc/popular');
    return response.data;
  }
};

export default kccService;
