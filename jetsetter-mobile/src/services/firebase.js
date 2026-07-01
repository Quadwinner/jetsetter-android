import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDQRZgBAkv6rfSqtJUQk6jLY56ftz0eEMg',
  authDomain: 'jets-1b5fa.firebaseapp.com',
  projectId: 'jets-1b5fa',
  storageBucket: 'jets-1b5fa.firebasestorage.app',
  messagingSenderId: '84512959275',
  appId: '1:84512959275:web:ea8a029a10024492dab36e',
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
let auth;

if (Platform.OS === 'web') {
  // Use browser persistence for web
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} else {
  // Use AsyncStorage persistence for native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
export default app;
