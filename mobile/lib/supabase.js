import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Web uygulamasıyla aynı Supabase projesi
const SUPABASE_URL = 'https://knobvfyrxpitogkfidod.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tSFehwlz56Wq0LHVxq0ptQ_TjDeOpK9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Uygulama ön plandayken token'ı otomatik yenile, arka planda dururken durdur
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
