import { apiClient } from '../lib/apiClient';

export const customerService = {
  getCustomers: async () => {
    const data = await apiClient.get('/customers');
    return Array.isArray(data) ? data : [];
  },
  getCustomerById: async (id) => {
    if (!id) return null;
    return await apiClient.get(`/customers/${id}`);
  }
};
