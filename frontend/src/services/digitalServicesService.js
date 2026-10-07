import api from './api';

export const digitalServicesService = {
  /**
   * Analyze farm image (crop, pest, leaf, document, package) using AI Vision
   */
  analyzeImage: async ({ imageBase64, mimeType = 'image/jpeg', language = 'hi', userNotes = '' }) => {
    const response = await api.post(
      '/digital-services/image-analyze',
      {
        imageBase64,
        mimeType,
        language,
        userNotes
      },
      {
        timeout: 60000 // allow up to 60s for vision analysis
      }
    );
    return response.data;
  },

  /**
   * Get operational status and AI vision readiness
   */
  getStatus: async () => {
    const response = await api.get('/digital-services/status');
    return response.data;
  }
};

export default digitalServicesService;
