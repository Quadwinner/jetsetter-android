import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';
import currencyService from './currencyService';

const packageApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

packageApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

class PackageService {
  async searchPackages(searchParams = {}) {
    try {
      console.log('Searching packages:', searchParams);
      const { data } = await packageApi.get('/packages/search', { params: searchParams });
      return { success: true, packages: data.data || [], meta: data.meta || {} };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getPackageDetails(packageId) {
    try {
      const { data } = await packageApi.get(`/packages/${packageId}`);
      return { success: true, package: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createBooking(bookingData) {
    try {
      const { data } = await packageApi.post('/packages/booking', bookingData);
      return { success: true, booking: data.booking };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async modifyBooking(bookingId, modifications) {
    try {
      console.log('Modifying package booking:', bookingId);
      const { data } = await packageApi.put(`/packages/booking/${bookingId}`, modifications);
      return { success: true, bookingId: data.bookingId, booking: data.booking, message: data.message || 'Booking modified successfully' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to modify booking', details: error.response?.data?.details || null };
    }
  }

  async cancelBooking(bookingId, reason = 'Customer request') {
    try {
      console.log('Cancelling package booking:', bookingId);
      const { data } = await packageApi.delete(`/packages/booking/${bookingId}`, { data: { reason } });
      return { success: true, bookingId: data.bookingId, cancellationId: data.cancellationId, refundAmount: data.refundAmount, message: data.message || 'Booking cancelled successfully' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to cancel booking', details: error.response?.data?.details || null };
    }
  }

  formatPrice(amount, currency = 'USD') {
    return currencyService.format(amount, currency);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

}

export default new PackageService();
