import apiClient from './apiClient';

export const fetchOrderHistory = async (token) => {
  try {
    return await apiClient.get('/order/', {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    return [];
  }
};
