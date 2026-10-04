import api from './api';

export const marketplaceService = {
  getFarmerListings: async (params = {}) => {
    const response = await api.get('/marketplace/listings', { params });
    return response.data;
  },

  getMyListings: async () => {
    const response = await api.get('/marketplace/my-listings');
    return response.data;
  },

  createListing: async (listingData) => {
    const response = await api.post('/marketplace/listings', listingData);
    return response.data;
  },

  updateListing: async (id, listingData) => {
    const response = await api.put(`/marketplace/listings/${id}`, listingData);
    return response.data;
  },

  deleteListing: async (id) => {
    const response = await api.delete(`/marketplace/listings/${id}`);
    return response.data;
  },

  getExternalListings: async (params = {}) => {
    const response = await api.get('/marketplace/external', { params });
    return response.data;
  }
};
