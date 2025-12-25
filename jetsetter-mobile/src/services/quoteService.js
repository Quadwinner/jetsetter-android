import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

// Axios instance for quote-related API calls
const quoteApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token if available
quoteApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const quoteService = {
  /**
   * Create a quote for a direct booking (flight, hotel, cruise, package)
   * Backend endpoint: POST /api/quotes?action=create-for-booking
   */
  async createQuoteForBooking(payload) {
    const {
      bookingType,
      title,
      description,
      totalAmount,
      currency = 'USD',
      breakdown = {},
      bookingDetails = {},
      customerEmail,
      customerName,
      customerPhone,
    } = payload;

    try {
      const body = {
        booking_type: bookingType,
        title,
        description,
        total_amount: totalAmount,
        currency,
        breakdown,
        booking_details: bookingDetails,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
      };

      const { data } = await quoteApi.post('/quotes?action=create-for-booking', body);

      if (!data?.success || !data?.data) {
        throw new Error(data?.message || 'Failed to create quote');
      }

      return data.data; // Quote object with id
    } catch (error) {
      console.error('❌ createQuoteForBooking error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to create quote for booking'
      );
    }
  },
};

export default quoteService;


