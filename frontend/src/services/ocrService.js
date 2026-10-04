import api from './api';

export const ocrService = {
  processDocument: async (file, language = 'eng') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('language', language);

    const response = await api.post('/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/ocr/history');
    return response.data;
  }
};
