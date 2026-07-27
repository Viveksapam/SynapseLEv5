import apiClient from './apiClient';

export const fetchSiteSettings = async () => {
  try {
    return await apiClient.get('/core/settings/');
  } catch (error) {
    return null;
  }
};
