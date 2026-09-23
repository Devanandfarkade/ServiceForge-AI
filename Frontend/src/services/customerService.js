import { mockCustomers } from '../data/mockData';

export const customerService = {
  getCustomers: async () => {
    return [...mockCustomers];
  },
  getCustomerById: async (id) => {
    return mockCustomers.find(c => c.customerId === id) || null;
  }
};
