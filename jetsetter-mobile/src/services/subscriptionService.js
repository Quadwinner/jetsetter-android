import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

const BASE_URL = API_CONFIG.BASE_URL;

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const subscriptionService = {
  getStatus: async (userId) => {
    if (!userId) return { success: false, message: 'User ID required' };
    const res = await fetch(`${BASE_URL}/subscription/status/${encodeURIComponent(userId)}`);
    return res.json();
  },

  createCheckout: async (checkoutData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/subscription/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(checkoutData),
    });
    return res.json();
  },

  completeAfterPayment: async (transactionId, userId) => {
    const res = await fetch(`${BASE_URL}/subscription/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, userId }),
    });
    return res.json();
  },
};

export default subscriptionService;
