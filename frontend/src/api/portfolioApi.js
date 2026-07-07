import apiClient from './apiClient';

export const fetchSkillList = async () => {
  try {
    const data = await apiClient.get('/portfolio/skills/');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Failed to fetch skill list" };
  }
};

export const fetchVideoList = async () => {
  try {
    const data = await apiClient.get('/verisphere/videos/');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Failed to fetch video list" };
  }
};
