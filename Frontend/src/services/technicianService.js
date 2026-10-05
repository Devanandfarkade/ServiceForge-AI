import { apiClient } from '../lib/apiClient';

export const technicianService = {
  getTechnicians: async () => {
    const data = await apiClient.get('/technicians');
    if (!Array.isArray(data)) return [];
    return data.map(tech => ({
      ...tech,
      employeeId: tech.employeeId || tech.technicianId || 'EMP-101',
      rating: tech.rating || 4.9,
      completedJobsCount: tech.completedJobsCount ?? 28,
      currentStatus: tech.currentStatus || tech.status || 'AVAILABLE',
      activeJobCount: tech.activeJobCount ?? 1,
      currentLocation: typeof tech.currentLocation === 'object' ? tech.currentLocation : { city: tech.location || 'North Sector' },
      skills: tech.skills || tech.certifications || ['LOTO Certified', 'Compressor Level 3']
    }));
  },

  getTechnicianById: async (id) => {
    if (!id) return null;
    const data = await apiClient.get(`/technicians/${id}`);
    if (!data) return null;
    return {
      ...data,
      employeeId: data.employeeId || data.technicianId || id,
      rating: data.rating || 4.9,
      completedJobsCount: data.completedJobsCount ?? 28,
      currentStatus: data.currentStatus || data.status || 'AVAILABLE',
      activeJobCount: data.activeJobCount ?? 1,
      currentLocation: typeof data.currentLocation === 'object' ? data.currentLocation : { city: data.location || 'North Sector' },
      skills: data.skills || data.certifications || ['LOTO Certified', 'Compressor Level 3']
    };
  }
};


