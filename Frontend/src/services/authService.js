import { currentUser, currentOrganization } from '../data/mockData';

export const authService = {
  getCurrentUser: async () => {
    return { ...currentUser, organization: currentOrganization };
  },
  getOrganization: async () => {
    return currentOrganization;
  }
};
