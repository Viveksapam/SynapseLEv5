import apiClient from './apiClient';

export const fetchProductList = async () => {
  try {
    const data = await apiClient.get('/product/');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Failed to fetch product list" };
  }
};
