import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../api/client';

export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔍 [Auth] Checking for saved token...");
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          console.log("📡 [Auth] Token found! Pinging /auth/profile...");
          const response = await apiClient.get('/auth/profile');
          console.log("✅ [Auth] Backend recognized token! User data:", response.data);
          setUser(response.data); 
        } catch (error: any) {
          console.error("❌ [Auth] Backend rejected token!", error.response?.status, error.response?.data);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        console.log("⚠️ [Auth] No token found in local storage.");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.access_token);
    setUser(response.data.user); 
  };

  const register = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { email, password });
    localStorage.setItem('token', response.data.access_token);
    setUser(response.data.user); 
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};