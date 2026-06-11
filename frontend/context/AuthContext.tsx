import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useRouter, useSegments } from 'expo-router';

// Point to the NestJS backend
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

  // 1. Check for a saved token when the app boots up
  useEffect(() => {
    async function loadSession() {
      try {
        const token = await SecureStore.getItemAsync('jwt_token');
        if (token) setSession(token);
      } catch (error) {
        console.error('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  // 2. The Frontend Bouncer: Redirect users based on their session
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // No token? Kick them to the login screen
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Have a token but sitting on the login screen? Send them to the boards
      router.replace('/(boards)');
    }
  }, [session, segments, isLoading]);

  // 3. Login logic (Talks to NestJS)
  const signIn = async (email: string, pass: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password: pass });
      const token = response.data.access_token;
      
      setSession(token);
      await SecureStore.setItemAsync('jwt_token', token);
    } catch (error) {
      console.error('Login failed', error);
      throw new Error('Invalid email or password');
    }
  };

  const signOut = async () => {
    setSession(null);
    await SecureStore.deleteItemAsync('jwt_token');
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}