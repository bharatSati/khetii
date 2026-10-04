import api from './api';

export const samvaadService = {
  // Fetch posts within 5 km radius (or specified radius)
  getPosts: async ({ lat, lon, radiusKm = 5, category, sort } = {}) => {
    const params = { radiusKm };
    if (lat !== undefined && lon !== undefined) {
      params.lat = lat;
      params.lon = lon;
    }
    if (category && category !== 'all') {
      params.category = category;
    }
    if (sort) {
      params.sort = sort;
    }
    const response = await api.get('/samvaad', { params });
    return response.data;
  },

  // Create a new community post (supports JSON or multipart FormData with image)
  createPost: async (postData) => {
    const isFormData = postData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('/samvaad', postData, config);
    return response.data;
  },

  // Toggle like
  toggleLike: async (id) => {
    const response = await api.post(`/samvaad/${id}/like`);
    return response.data;
  },

  // Add comment / chat message in thread
  addComment: async (id, text) => {
    const response = await api.post(`/samvaad/${id}/comment`, { text });
    return response.data;
  },

  // Increment share count
  sharePost: async (id) => {
    const response = await api.post(`/samvaad/${id}/share`);
    return response.data;
  },

  // Delete post (author only)
  deletePost: async (id) => {
    const response = await api.delete(`/samvaad/${id}`);
    return response.data;
  }
};

export default samvaadService;
