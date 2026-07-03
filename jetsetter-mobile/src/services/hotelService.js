import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';
import currencyService from './currencyService';

// Create axios instance for hotel API
const hotelApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000, // 30 seconds for hotel searches
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
hotelApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class HotelService {
  /**
   * Search for hotels
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.cityCode - City IATA code (e.g., "PAR")
   * @param {string} searchParams.checkInDate - Check-in date (YYYY-MM-DD)
   * @param {string} searchParams.checkOutDate - Check-out date (YYYY-MM-DD)
   * @param {number} searchParams.adults - Number of adults
   * @param {number} searchParams.radius - Search radius (default: 20)
   * @param {string} searchParams.radiusUnit - Radius unit (default: "KM")
   * @returns {Promise<Object>} Search results with hotel offers
   */
  async searchHotels(searchParams) {
    try {
      console.log('Searching hotels with params:', searchParams);

      const { data } = await hotelApi.get('/hotels/search', {
        params: {
          cityCode: searchParams.cityCode,
          checkInDate: searchParams.checkInDate,
          checkOutDate: searchParams.checkOutDate,
          adults: searchParams.adults,
          radius: searchParams.radius || 20,
          radiusUnit: searchParams.radiusUnit || 'KM',
        },
      });

      console.log('Hotel search response:', data);

      // Backend may return the array directly (data.data) or nested under
      // data.data.hotels — normalize to an array so the results screen renders.
      const list = Array.isArray(data.data)
        ? data.data
        : (data.data?.hotels || data.hotels || []);

      return {
        success: true,
        hotels: list,
        meta: data.meta || data.data?.meta || {},
      };
    } catch (error) {
      console.error('Hotel search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search hotels',
        details: error.response?.data?.details || null,
      };
    }
  }

  /**
   * Get popular destinations
   * @returns {Promise<Object>} List of destinations
   */
  async getDestinations() {
    try {
      const { data } = await hotelApi.get('/hotels/destinations');
      return {
        success: true,
        destinations: data.data || [],
      };
    } catch (error) {
      console.error('Get destinations error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a hotel booking
   * @param {Object} bookingData - Booking information
   * @param {string} bookingData.hotelId - Hotel ID
   * @param {string} bookingData.offerId - Offer ID
   * @param {Object} bookingData.guestDetails - Guest information
   * @param {string} bookingData.checkInDate - Check-in date
   * @param {string} bookingData.checkOutDate - Check-out date
   * @param {number} bookingData.totalPrice - Total price
   * @param {string} bookingData.currency - Currency code
   * @returns {Promise<Object>} Booking confirmation
   */
  async createBooking(bookingData) {
    try {
      console.log('Creating hotel booking');

      const { data } = await hotelApi.post('/hotels/booking', bookingData);

      console.log('Booking created:', data);

      return {
        success: true,
        booking: data.booking,
        message: data.message,
      };
    } catch (error) {
      console.error('Create booking error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create booking',
        details: error.response?.data?.details || null,
      };
    }
  }

  /**
   * Process hotel payment
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment confirmation
   */
  async processPayment(paymentData) {
    try {
      console.log('Processing hotel payment');

      const { data } = await hotelApi.post('/hotels/payment', paymentData);

      return {
        success: true,
        payment: data.payment,
        message: data.message,
      };
    } catch (error) {
      console.error('Payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment failed',
      };
    }
  }

  /**
   * Modify a hotel booking
   * @param {string} bookingId - Booking ID or reference
   * @param {Object} modifications - Modifications to apply
   * @param {string} modifications.newCheckInDate - Updated check-in date (optional)
   * @param {string} modifications.newCheckOutDate - Updated check-out date (optional)
   * @param {number} modifications.newGuestCount - Updated guest count (optional)
   * @param {Object} modifications.newGuestDetails - Updated guest information (optional)
   * @returns {Promise<Object>} Modification result
   */
  async modifyBooking(bookingId, modifications) {
    try {
      console.log('Modifying hotel booking:', bookingId);

      const { data } = await hotelApi.put(`/hotels/booking/${bookingId}`, modifications);

      return {
        success: true,
        bookingId: data.bookingId,
        booking: data.booking,
        message: data.message || 'Booking modified successfully',
      };
    } catch (error) {
      console.error('Modify booking error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to modify booking',
        details: error.response?.data?.details || null,
      };
    }
  }

  /**
   * Cancel a hotel booking
   * @param {string} bookingId - Booking ID or reference
   * @param {string} reason - Cancellation reason (optional)
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelBooking(bookingId, reason = 'Customer request') {
    try {
      console.log('Cancelling hotel booking:', bookingId);

      const { data } = await hotelApi.delete(`/hotels/booking/${bookingId}`, {
        data: { reason },
      });

      return {
        success: true,
        bookingId: data.bookingId,
        cancellationId: data.cancellationId,
        refundAmount: data.refundAmount,
        message: data.message || 'Booking cancelled successfully',
      };
    } catch (error) {
      console.error('Cancel booking error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel booking',
        details: error.response?.data?.details || null,
      };
    }
  }

  /**
   * Extract city code from destination string
   * @param {string} destination - Destination string
   * @returns {string} City code
   */
  extractCityCode(destination) {
    // Try to extract code from format like "Paris (PAR)"
    const match = destination.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : destination;
  }

  /**
   * Format price with currency
   * @param {number} amount - Price amount
   * @param {string} currency - Currency code (default: USD)
   * @returns {string} Formatted price
   */
  formatPrice(amount, currency = 'USD') {
    return currencyService.format(amount, currency);
  }

  /**
   * Calculate number of nights
   * @param {string} checkIn - Check-in date
   * @param {string} checkOut - Check-out date
   * @returns {number} Number of nights
   */
  calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end - start;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Format date for display
   * @param {string} date - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(date) {
    if (!date) return 'N/A';

    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

}

export default new HotelService();
