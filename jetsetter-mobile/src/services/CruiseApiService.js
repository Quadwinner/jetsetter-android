import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

const BASE = API_CONFIG.BASE_URL;

const CruiseApiService = {
  async getAllCruises() {
    const { data } = await axios.get(`${BASE}/cruises`);
    return data;
  },

  async checkGatewayStatus() {
    const { data } = await axios.get(`${BASE}/payments`, { params: { action: 'gateway-status' } });
    return data;
  },

  async createHostedCheckout(paymentData) {
    const { data } = await axios.post(`${BASE}/payments`, {
      ...paymentData,
      action: 'hosted-checkout',
    }, { timeout: 30000 });
    return data;
  },

  async verifyPayment(orderId) {
    const { data } = await axios.get(`${BASE}/payments`, {
      params: { action: 'payment-verify', orderId },
    });
    return data;
  },

  async saveBooking(bookingData) {
    const { data } = await axios.post(`${BASE}/cruises/bookings`, bookingData);
    return data;
  },

  async validateCoupon(code, bookingType, amount) {
    const { data } = await axios.post(`${BASE}/coupons/validate`, { code, bookingType, amount });
    return data;
  },

  generateOrderId() {
    return 'CRZ' + Date.now().toString(36).toUpperCase();
  },

  async storePendingBooking(booking) {
    await AsyncStorage.setItem('pendingCruiseBooking', JSON.stringify(booking));
  },

  async getPendingBooking() {
    const raw = await AsyncStorage.getItem('pendingCruiseBooking');
    return raw ? JSON.parse(raw) : null;
  },

  async clearPendingBooking() {
    await AsyncStorage.removeItem('pendingCruiseBooking');
  },
};

export default CruiseApiService;
