import api from './api';

export const financeService = {
  getTransactions: async (params = {}) => {
    const response = await api.get('/finance/transactions', { params });
    return response.data;
  },

  createTransaction: async (data) => {
    const response = await api.post('/finance/transactions', data);
    return response.data;
  },

  updateTransaction: async (id, data) => {
    const response = await api.put(`/finance/transactions/${id}`, data);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/finance/transactions/${id}`);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/finance/summary');
    return response.data;
  }
};
