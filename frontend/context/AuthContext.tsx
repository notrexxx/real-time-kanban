import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSegments } from 'expo-router';
import { saveToken, getToken, deleteToken } from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface AuthContextType {
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => void;
  session: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function loadSession() {
      try {
        const token = await getToken('jwt_token');
        if (token) setSession(token);
      } catch (error) {
        console.error('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(boards)');
    }
  }, [session, segments, isLoading]);

  const signIn = async (email: string, pass: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password: pass });
      const token = response.data.access_token;
      
      setSession(token);
      await saveToken('jwt_token', token);
    } catch (error) {
      console.error('Login failed', error);
      throw new Error('Invalid email or password');
    }
  };

  const signOut = async () => {
    setSession(null);
    await deleteToken('jwt_token');
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}