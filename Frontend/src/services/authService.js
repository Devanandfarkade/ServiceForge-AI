import { getValidIdToken } from '../lib/cognito';

export const authService = {
  getCurrentUser: async () => {
    const token = await getValidIdToken();
    if (!token) return null;
    return { token };
  },
  getOrganization: async () => {
    return null;
  }
};

