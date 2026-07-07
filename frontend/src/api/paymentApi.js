import apiClient from './apiClient';

export const postCreateRazorpayOrder = async (orderId, token) => {
  try {
    return await apiClient.post('/payment/create-intent/', { order_id: orderId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    return null;
  }
};

export const postVerifyRazorpaySignature = async (data, token) => {
  try {
    return await apiClient.post('/payment/verify-signature/', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    return null;
  }
};
