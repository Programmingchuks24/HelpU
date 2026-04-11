import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const MAX_SIZE = 2048;

const ChunkingSecureStore = {
  getItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(key);
    if (!value) return null;

    // If it's a "pointer" to chunks, rebuild it
    if (value === '___chunked___') {
      let fullValue = '';
      let index = 0;
      while (true) {
        const chunk = await SecureStore.getItemAsync(`${key}.${index}`);
        if (!chunk) break;
        fullValue += chunk;
        index++;
      }
      return fullValue;
    }
    return value;
  },
  setItem: async (key: string, value: string) => {
    if (value.length > MAX_SIZE) {
      // Mark this key as chunked
      await SecureStore.setItemAsync(key, '___chunked___');
      
      // Split and store chunks
      const chunks = value.match(new RegExp('.{1,' + MAX_SIZE + '}', 'g'));
      if (chunks) {
        for (let i = 0; i < chunks.length; i++) {
          await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]);
        }
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(key);
    if (value === '___chunked___') {
      let index = 0;
      while (true) {
        const chunk = await SecureStore.getItemAsync(`${key}.${index}`);
        if (!chunk) break;
        await SecureStore.deleteItemAsync(`${key}.${index}`);
        index++;
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// console.log("Supabase URL:", supabaseUrl);
// console.log("Supabase Anon Key:", supabaseAnonKey);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ChunkingSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});