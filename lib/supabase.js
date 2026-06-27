import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://znmgfnbrdbxiwjnvywdh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubWdmbmJyZGJ4aXdqbnZ5d2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzUwNTksImV4cCI6MjA5ODE1MTA1OX0.GneTn6xcMAWVadRg_N3QOkqzqDm1D3VwghrfyFHhqMw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
