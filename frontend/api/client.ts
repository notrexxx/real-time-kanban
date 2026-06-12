import axios from 'axios';
import { getToken } from '../utils/storage';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// This interceptor works perfectly on Web, iOS, and Android now
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;