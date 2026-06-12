import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function saveToken(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getToken(key: string) {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

export async function deleteToken(key: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}