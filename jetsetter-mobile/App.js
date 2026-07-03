import React, { useEffect, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { setUser } from './src/store/slices/authSlice';
import authService from './src/services/authService';
import notificationService from './src/services/notificationService';
import currencyService from './src/services/currencyService';
import SplashScreen from './src/screens/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

function AppContent() {
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Listen to auth state changes (single source of truth)
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      if (!mounted) return;
      
      console.log('Auth state callback:', user ? `User: ${user.email}` : 'No user');
      
      if (user) {
        dispatch(setUser(user));
      } else {
        // Fallback: Check AsyncStorage for persisted user data
        try {
          const storedUser = await AsyncStorage.getItem('user');
          const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
          
          if (storedUser && isAuthenticated === 'true' && mounted) {
            console.log('Restoring user from AsyncStorage');
            dispatch(setUser(JSON.parse(storedUser)));
          } else {
            dispatch(setUser(null));
          }
        } catch (e) {
          console.log('Failed to restore from AsyncStorage:', e);
          dispatch(setUser(null));
        }
      }
      
      if (mounted) {
        setInitializing(false);
      }
    });

    // Initialize push notifications
    const initNotifications = async () => {
      try {
        await notificationService.registerForPushNotifications();
      } catch (error) {
        console.error('Notification initialization error:', error);
      }
    };

    initNotifications();

    // Detect the user's currency + load FX rates so prices show in local currency.
    currencyService.init().catch((e) => console.log('currency init failed:', e?.message));

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [dispatch]);

  if (initializing) {
    return <SplashScreen />;
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
