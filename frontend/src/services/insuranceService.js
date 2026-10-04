import api from './api';

export const insuranceService = {
  getInsuranceGuide: async () => {
    const response = await api.get('/insurance');
    return response.data;
  }
};
