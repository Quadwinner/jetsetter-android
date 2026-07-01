import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';
import { generateOrderId, parseDuration } from '../utils/flightUtils';

const BASE_URL = API_CONFIG.BASE_URL;

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const flightService = {
  searchAirports: async (keyword) => {
    const res = await fetch(`${BASE_URL}/airports/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, limit: 10 }),
    });
    const data = await res.json();
    return data.success ? data.data : [];
  },

  searchFlights: async (params) => {
    const res = await fetch(`${BASE_URL}/flights/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        departDate: params.departDate,
        returnDate: params.returnDate || '',
        tripType: params.tripType || 'oneWay',
        travelers: params.travelers || 1,
        travelClass: params.travelClass || 'ECONOMY',
      }),
    });
    if (!res.ok) throw new Error('Flight search failed');
    const data = await res.json();
    return { success: data.success, flights: data.data || [], meta: data.meta || {} };
  },

  getCheapestDates: async (origin, destination) => {
    const res = await fetch(
      `${BASE_URL}/flights/cheapest-dates?origin=${origin}&destination=${destination}`
    );
    const data = await res.json();
    return data.success ? data.data : [];
  },

  validateCoupon: async (code, orderTotal, userId) => {
    const res = await fetch(`${BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderTotal, bookingType: 'flight', userId }),
    });
    return res.json();
  },

  initiatePayment: async (paymentData) => {
    const res = await fetch(`${BASE_URL}/payments?action=hosted-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return res.json();
  },

  getPendingBooking: async (orderId) => {
    const res = await fetch(
      `${BASE_URL}/payments?action=get-pending-booking&orderId=${orderId}`
    );
    return res.json();
  },

  createOrder: async (orderData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/flights/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Order creation failed');
    return res.json();
  },

  getUserBookings: async (userId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/flights/bookings?userId=${userId}`, { headers });
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getBookingByRef: async (bookingRef) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/flights/bookings/${bookingRef}`, { headers });
    return res.json();
  },

  cancelBooking: async (bookingReference, reason) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/payments?action=cancel-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ bookingReference, reason }),
    });
    return res.json();
  },

  // Store pending booking before ARC Pay redirect
  storePendingBooking: async (bookingData) => {
    await AsyncStorage.setItem('pendingFlightBooking', JSON.stringify(bookingData));
  },

  getPendingBookingLocal: async () => {
    const raw = await AsyncStorage.getItem('pendingFlightBooking');
    return raw ? JSON.parse(raw) : null;
  },

  clearPendingBooking: async () => {
    await AsyncStorage.removeItem('pendingFlightBooking');
  },

  generateOrderId,

  // Utility: extract IATA code from "City (CODE)" string
  extractIataCode: (str) => {
    const match = (str || '').match(/\(([A-Z]{3})\)/);
    return match ? match[1] : str;
  },

  formatDuration: parseDuration,

  formatPrice: (amount, currency = 'USD') => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return `${symbols[currency] || currency}${Number(amount).toFixed(2)}`;
  },

  formatDateTime: (dateTime) => {
    if (!dateTime) return 'N/A';
    const d = new Date(dateTime);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
};

export default flightService;
