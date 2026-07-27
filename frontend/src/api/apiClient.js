import axios from 'axios';
import { API_BASE } from './config';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const strMessage = error.response?.data?.detail || error.message;
    return Promise.reject(new Error(strMessage));
  }
);

export default apiClient;
