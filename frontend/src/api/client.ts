// src/api/client.ts
import axios from "axios";
import { getToken } from "../utils/storage";


const apiClient = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000" 
});

apiClient.interceptors.request.use((config) => {
  const token = getToken(); 
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;