import { mockTechnicians } from '../data/mockData';

export const technicianService = {
  getTechnicians: async () => {
    return [...mockTechnicians];
  },
  getTechnicianById: async (id) => {
    return mockTechnicians.find(t => t.technicianId === id) || null;
  }
};
