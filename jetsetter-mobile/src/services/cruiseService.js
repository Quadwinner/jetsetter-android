import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

// Create axios instance for cruise API
const cruiseApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000, // 30 seconds for cruise searches
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
cruiseApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class CruiseService {
  /**
   * Get list of available cruises (matching web app endpoint)
   * GET /api/cruises
   */
  async getCruises() {
    try {
      console.log('🚢 Fetching cruises from API...');

      const { data } = await cruiseApi.get('/cruises');
      console.log('📥 Cruises response:', data);

      return {
        success: true,
        data: data.data || [],
      };
    } catch (error) {
      console.error('❌ Fetch cruises error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch cruises',
      };
    }
  }

  /**
   * Save booking to database (matching web app endpoint)
   * POST /api/cruises/bookings
   */
  async saveBooking(bookingPayload) {
    try {
      console.log('💾 Saving cruise booking to database...');
      console.log('📤 Booking payload:', {
        orderId: bookingPayload.orderId,
        cruiseName: bookingPayload.cruiseName,
        totalAmount: bookingPayload.totalAmount,
      });

      const { data } = await cruiseApi.post('/cruises/bookings', bookingPayload);
      console.log('📥 Booking save response:', data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('❌ Save booking error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * Search for cruises
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.destination - Destination (optional)
   * @param {string} searchParams.departurePort - Departure port (optional)
   * @param {string} searchParams.cruiseLine - Cruise line (optional)
   * @param {string} searchParams.departureDate - Departure date (optional)
   * @param {string} searchParams.duration - Duration (optional)
   * @param {number} searchParams.passengers - Number of passengers
   * @param {number} searchParams.minPrice - Minimum price (optional)
   * @param {number} searchParams.maxPrice - Maximum price (optional)
   * @returns {Promise<Object>} Search results with cruise offers
   */
  async searchCruises(searchParams) {
    try {
      console.log('Searching cruises with params:', searchParams);

      const { data } = await cruiseApi.get('/cruises/search', {
        params: searchParams,
      });

      console.log('Cruise search response:', data);

      return {
        success: true,
        cruises: data.data || [],
        meta: data.meta || {},
      };
    } catch (error) {
      console.error('Cruise search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search cruises',
        details: error.response?.data?.details || null,
      };
    }
  }

  /**
   * Get cruise details by ID
   * @param {string} cruiseId - Cruise ID
   * @returns {Promise<Object>} Cruise details
   */
  async getCruiseDetails(cruiseId) {
    try {
      console.log('Getting cruise details for ID:', cruiseId);

      const { data } = await cruiseApi.get(`/cruises/details/${cruiseId}`);

      return {
        success: true,
        cruise: data.data,
      };
    } catch (error) {
      console.error('Get cruise details error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get cruise details',
      };
    }
  }

  /**
   * Create a cruise booking
   * @param {Object} bookingData - Booking information
   * @param {Object} bookingData.cruise - Selected cruise
   * @param {Array} bookingData.passengers - Passenger information
   * @param {Object} bookingData.contactInfo - Contact information
   * @param {Object} bookingData.paymentInfo - Payment information
   * @returns {Promise<Object>} Booking confirmation
   */
  async createBooking(bookingData) {
    try {
      console.log('Creating cruise booking');

      const { data } = await cruiseApi.post('/cruises/booking', bookingData);

      console.log('Booking created:', data);

      return {
        success: true,
        bookingId: data.bookingId,
        bookingReference: data.bookingReference,
        bookingData: data.data,
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
   * Modify a cruise booking
   * @param {string} bookingId - Booking ID or reference
   * @param {Object} modifications - Modifications to apply
   * @param {Array} modifications.newPassengers - Updated passenger information (optional)
   * @param {string} modifications.newDepartureDate - Updated departure date (optional)
   * @param {Object} modifications.newContactInfo - Updated contact information (optional)
   * @returns {Promise<Object>} Modification result
   */
  async modifyBooking(bookingId, modifications) {
    try {
      console.log('Modifying cruise booking:', bookingId);

      const { data } = await cruiseApi.put(`/cruises/booking/${bookingId}`, modifications);

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
   * Cancel a cruise booking
   * @param {string} bookingId - Booking ID or reference
   * @param {string} reason - Cancellation reason (optional)
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelBooking(bookingId, reason = 'Customer request') {
    try {
      console.log('Cancelling cruise booking:', bookingId);

      const { data } = await cruiseApi.delete(`/cruises/booking/${bookingId}`, {
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
   * Format price with currency
   * @param {number} amount - Price amount
   * @param {string} currency - Currency code (default: USD)
   * @returns {string} Formatted price
   */
  formatPrice(amount, currency = 'USD') {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
    };

    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }

  /**
   * Format duration for display
   * @param {string} duration - Duration string
   * @returns {string} Formatted duration
   */
  formatDuration(duration) {
    if (!duration) return 'N/A';
    return duration; // Already formatted as "7 Nights"
  }

}

export default new CruiseService();





