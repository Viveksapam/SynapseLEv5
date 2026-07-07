import apiClient from './apiClient';

export const registerUser = async (userData) => {
  return await apiClient.post('/auth/register', userData);
};

export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  return await apiClient.post('/auth/token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

export const fetchUserProfile = async (token) => {
  return await apiClient.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updateUserProfile = async (userData, token) => {
  return await apiClient.put('/auth/profile', userData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const verifyEmail = async (username, code) => {
  return await apiClient.post('/auth/verify-email', { username, code });
};

export const resendVerificationCode = async (username) => {
  return await apiClient.post('/auth/resend-verification', { username });
};

export const forgotPassword = async (username) => {
  return await apiClient.post('/auth/forgot-password', { username });
};

export const resetPassword = async (username, code, newPassword) => {
  return await apiClient.post('/auth/reset-password', { username, code, new_password: newPassword });
};

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const changePassword = async (currentPassword, newPassword, token) => {
  return await apiClient.post('/auth/change-password',
    { current_password: currentPassword, new_password: newPassword }, authHeader(token));
};

export const updateNotificationSettings = async (settings, token) => {
  return await apiClient.put('/auth/settings', settings, authHeader(token));
};

export const deactivateAccount = async (password, token) => {
  return await apiClient.post('/auth/deactivate', { password }, authHeader(token));
};
