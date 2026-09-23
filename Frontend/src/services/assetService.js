import { mockAssets } from '../data/mockData';

export const assetService = {
  getAssets: async () => {
    return [...mockAssets];
  },
  getAssetById: async (id) => {
    return mockAssets.find(a => a.assetId === id) || null;
  }
};
