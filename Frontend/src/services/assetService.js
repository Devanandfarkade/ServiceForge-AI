import { apiClient } from '../lib/apiClient';

export const assetService = {
  getAssets: async () => {
    const data = await apiClient.get('/assets');
    return Array.isArray(data) ? data : [];
  },
  getAssetsByCustomer: async (customerId) => {
    if (!customerId) return [];
    const data = await apiClient.get(`/assets?customerId=${encodeURIComponent(customerId)}`);
    return Array.isArray(data) ? data : [];
  },
  getAssetById: async (id) => {
    if (!id) return null;
    return await apiClient.get(`/assets/${id}`);
  }
};
