import apiClient from './apiClient';

export const fetchProjectList = async () => {
  try {
    const data = await apiClient.get('/project/');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Failed to fetch project list" };
  }
};
