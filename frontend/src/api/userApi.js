import apiClient from './apiClient';

export const registerUser = async (userData) => {
  return await apiClient.post('/auth/users/', userData);
};

export const activateAccount = async (uid, token) => {
  return await apiClient.post('/auth/users/activation/', { uid, token });
};

export const resendActivation = async (email) => {
  return await apiClient.post('/auth/users/resend_activation/', { email });
};

export const loginUser = async (username, password) => {
  return await apiClient.post('/auth/jwt/create/', { username, password });
};

export const refreshAccessToken = async (refresh) => {
  return await apiClient.post('/auth/jwt/refresh/', { refresh });
};

export const fetchUserProfile = async (token) => {
  return await apiClient.get('/auth/users/me/', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updateUserProfile = async (userData, token) => {
  return await apiClient.patch('/auth/users/me/', userData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const forgotPassword = async (email) => {
  return await apiClient.post('/auth/users/reset_password/', { email });
};

export const resetPassword = async (uid, token, newPassword) => {
  return await apiClient.post('/auth/users/reset_password_confirm/', {
    uid, token, new_password: newPassword,
  });
};

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const changePassword = async (currentPassword, newPassword, token) => {
  return await apiClient.post('/auth/users/set_password/',
    { current_password: currentPassword, new_password: newPassword }, authHeader(token));
};

export const updateNotificationSettings = async (settings, token) => {
  return await apiClient.patch('/auth/users/me/', settings, authHeader(token));
};

export const deactivateAccount = async (password, token) => {
  return await apiClient.post('/auth/deactivate', { password }, authHeader(token));
};

export const uploadImage = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  const data = await apiClient.post('/upload/image/', formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
};
