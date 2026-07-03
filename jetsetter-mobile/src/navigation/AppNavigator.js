import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';
import { COLORS } from '../constants/config';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import FlightSearchScreen from '../screens/booking/FlightSearchScreen';
import FlightResultsScreen from '../screens/booking/FlightResultsScreen';
import FlightPaymentScreen from '../screens/booking/FlightPaymentScreen';
import FlightConfirmationScreen from '../screens/booking/FlightConfirmationScreen';
import HotelSearchScreen from '../screens/booking/HotelSearchScreen';
import HotelResultsScreen from '../screens/booking/HotelResultsScreen';
import HotelDetailsScreen from '../screens/booking/HotelDetailsScreen';
import HotelPaymentScreen from '../screens/booking/HotelPaymentScreen';
import HotelConfirmationScreen from '../screens/booking/HotelConfirmationScreen';
import CruiseHomeScreen from '../screens/booking/CruiseHomeScreen';
import CruiseSearchScreen from '../screens/booking/CruiseSearchScreen';
import CruiseResultsScreen from '../screens/booking/CruiseResultsScreen';
import CruiseDetailsScreen from '../screens/booking/CruiseDetailsScreen';
import CruiseBookingScreen from '../screens/booking/CruiseBookingScreen';
import CruiseConfirmationScreen from '../screens/booking/CruiseConfirmationScreen';
import PackageListScreen from '../screens/packages/PackageListScreen';
import PackageDetailsScreen from '../screens/packages/PackageDetailsScreen';
import PackageBookingScreen from '../screens/packages/PackageBookingScreen';
import PackageConfirmationScreen from '../screens/packages/PackageConfirmationScreen';
import MyTripsScreen from '../screens/trips/MyTripsScreen';
import BookingDetailScreen from '../screens/trips/BookingDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import LegalScreen from '../screens/legal/LegalScreen';
import NewRequestScreen from '../screens/requests/NewRequestScreen';
import RequestScreen from '../screens/requests/RequestScreen';
import InquiryDetailScreen from '../screens/requests/InquiryDetailScreen';
import BookingInfoFormScreen from '../screens/booking/BookingInfoFormScreen';

// ARC Pay Payment Screens
import ArcPaymentScreen from '../screens/payment/ArcPaymentScreen';
import PaymentSuccessScreen from '../screens/payment/PaymentSuccessScreen';
import PaymentFailedScreen from '../screens/payment/PaymentFailedScreen';
import ArcPayWebView from '../screens/payment/ArcPayWebView';

// New Flight Screens
import FlightBookingScreen from '../screens/booking/FlightBookingScreen';
import FlightSeatMapScreen from '../screens/booking/FlightSeatMapScreen';
import FlightDetailsScreen from '../screens/booking/FlightDetailsScreen';
import FlightCreateOrderScreen from '../screens/booking/FlightCreateOrderScreen';
import FlightSuccessScreen from '../screens/booking/FlightSuccessScreen';
import ManageBookingScreen from '../screens/booking/ManageBookingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator (Profile removed - now accessible via top-right icon)
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#055B75',
        borderTopColor: '#034457',
      },
      tabBarActiveTintColor: '#ffffff',
      tabBarInactiveTintColor: '#A8D4E2',
    }}
  >
    <Tab.Screen
      name="Cruise"
      component={HomeScreen}
      options={{
        tabBarLabel: 'Cruise',
        tabBarIcon: ({ color }) => <Ionicons name="boat" size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Flights"
      component={FlightSearchScreen}
      options={{
        tabBarLabel: 'Flights',
        tabBarIcon: ({ color }) => <Ionicons name="airplane" size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Hotels"
      component={HotelSearchScreen}
      options={{
        tabBarLabel: 'Hotels',
        tabBarIcon: ({ color }) => <Ionicons name="bed" size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Packages"
      component={PackageListScreen}
      options={{
        tabBarLabel: 'Packages',
        tabBarIcon: ({ color }) => <Ionicons name="gift" size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="MyTrips"
      component={MyTripsScreen}
      options={{
        tabBarLabel: 'My Trips',
        tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={24} color={color} />,
      }}
    />
  </Tab.Navigator>
);

// Main Stack Navigator (wraps tabs + additional screens)
const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={MainTabs} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Legal" component={LegalScreen} />
    <Stack.Screen name="FlightResults" component={FlightResultsScreen} />
    <Stack.Screen name="FlightPayment" component={FlightPaymentScreen} />
    <Stack.Screen name="FlightBooking" component={FlightBookingScreen} />
    <Stack.Screen name="FlightSeatMap" component={FlightSeatMapScreen} />
    <Stack.Screen name="FlightDetails" component={FlightDetailsScreen} />
    <Stack.Screen name="FlightCreateOrder" component={FlightCreateOrderScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="FlightSuccess" component={FlightSuccessScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="FlightConfirmation" component={FlightConfirmationScreen} />
    <Stack.Screen name="ManageBooking" component={ManageBookingScreen} />
    <Stack.Screen name="HotelResults" component={HotelResultsScreen} />
    <Stack.Screen name="HotelDetails" component={HotelDetailsScreen} />
    <Stack.Screen name="HotelPayment" component={HotelPaymentScreen} />
    <Stack.Screen name="HotelConfirmation" component={HotelConfirmationScreen} />
    <Stack.Screen name="CruiseSearch" component={CruiseSearchScreen} />
    <Stack.Screen name="CruiseResults" component={CruiseResultsScreen} />
    <Stack.Screen name="CruiseDetails" component={CruiseDetailsScreen} />
    <Stack.Screen name="CruiseBooking" component={CruiseBookingScreen} />
    <Stack.Screen name="CruiseConfirmation" component={CruiseConfirmationScreen} />
    <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
    <Stack.Screen name="PackageBooking" component={PackageBookingScreen} />
    <Stack.Screen name="PackageConfirmation" component={PackageConfirmationScreen} />
    {/* ARC Pay Payment Screens */}
    <Stack.Screen 
      name="ArcPayment" 
      component={ArcPaymentScreen} 
      options={{ gestureEnabled: false }} 
    />
    <Stack.Screen 
      name="ArcPayWebView" 
      component={ArcPayWebView} 
      options={{ gestureEnabled: false }} 
    />
    <Stack.Screen 
      name="PaymentSuccess" 
      component={PaymentSuccessScreen} 
      options={{ gestureEnabled: false }} 
    />
    <Stack.Screen 
      name="PaymentFailed" 
      component={PaymentFailedScreen} 
    />
    {/* Booking Management */}
    <Stack.Screen 
      name="BookingDetail" 
      component={BookingDetailScreen} 
    />
    {/* Requests & Inquiries */}
    <Stack.Screen name="NewRequest" component={NewRequestScreen} />
    <Stack.Screen name="Request" component={RequestScreen} />
    <Stack.Screen name="InquiryDetail" component={InquiryDetailScreen} />
    <Stack.Screen 
      name="BookingInfoForm" 
      component={BookingInfoFormScreen}
      options={{
        title: 'Booking Information',
        headerStyle: {
          backgroundColor: COLORS.PRIMARY,
        },
        headerTintColor: '#fff',
      }}
    />
  </Stack.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const navigationRef = React.useRef(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasSeenOnboarding(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (navigationRef.current && !isCheckingOnboarding) {
      const navigation = navigationRef.current;
      notificationService.setupNotificationListeners(navigation);
    }
  }, [isCheckingOnboarding]);

  if (loading || isCheckingOnboarding) {
    return <SplashScreen />;
  }

  // Deep linking configuration for payment callbacks
  const linking = {
    prefixes: ['jetsettermobile://', 'jetsetterss://', 'https://jetsetterss.com'],
    config: {
      screens: {
        FlightCreateOrder: 'payment/callback',
        PaymentCallback: 'payment-callback',
        PaymentCancel: 'payment-cancel',
      },
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
      linking={linking}
    >
      {!hasSeenOnboarding ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      ) : isAuthenticated ? (
        <MainStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
