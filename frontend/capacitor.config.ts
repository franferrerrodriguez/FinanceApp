import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cartia.financiaapp',
  appName: 'FinanciaApp',
  webDir: 'dist',
  server: {
    // Required for secure context (localStorage, Supabase) on Android WebView
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
