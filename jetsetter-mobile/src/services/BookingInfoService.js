import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

// Force correct production API URL
const API_BASE_URL = 'https://www.jetsetterss.com/api';

const bookingInfoApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
bookingInfoApi.interceptors.request.use(async (config) => {
  const token =
    (await AsyncStorage.getItem('token')) ||
    (await AsyncStorage.getItem('supabase_token')) ||
    (await AsyncStorage.getItem('authToken')) ||
    (await AsyncStorage.getItem('auth_token'));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class BookingInfoService {
  /**
   * Get existing booking info for a quote
   * @param {string} quoteId - Quote ID
   * @returns {Promise<object>} Booking info data or null if not found
   */
  async getBookingInfo(quoteId) {
    try {
      console.log('📥 Fetching booking info for quote:', quoteId);
      const response = await bookingInfoApi.get(
        `/quotes?id=${quoteId}&endpoint=booking-info`
      );

      if (response.data.success && response.data.data) {
        console.log('✅ Booking info found:', response.data.data);
        return response.data.data;
      }

      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ No booking info found (404)');
        return null;
      }
      if (error.response?.status === 403) {
        console.error('❌ Not authorized to access booking info');
        throw new Error('Not authorized to access booking information');
      }
      console.error('❌ Error fetching booking info:', error);
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch booking information'
      );
    }
  }

  /**
   * Save or update booking info for a quote
   * @param {string} quoteId - Quote ID
   * @param {object} bookingData - Booking information data
   * @returns {Promise<object>} Saved booking info with status
   */
  async saveBookingInfo(quoteId, bookingData) {
    try {
      console.log('💾 Saving booking info for quote:', quoteId);
      console.log('📦 Booking data:', JSON.stringify(bookingData, null, 2));

      // Filter to only valid fields (same as web)
      const validFields = [
        'full_name',
        'email',
        'phone',
        'date_of_birth',
        'nationality',
        'passport_number',
        'passport_expiry_date',
        'passport_issue_date',
        'passport_issuing_country',
        'govt_id_type',
        'govt_id_number',
        'govt_id_issue_date',
        'govt_id_expiry_date',
        'govt_id_issuing_authority',
        'govt_id_issuing_country',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'booking_details',
        'terms_accepted',
        'privacy_policy_accepted',
      ];

      const filteredData = {};
      validFields.forEach((field) => {
        if (bookingData[field] !== undefined) {
          // Convert empty strings to null for date fields
          const dateFields = [
            'date_of_birth',
            'passport_expiry_date',
            'passport_issue_date',
            'govt_id_issue_date',
            'govt_id_expiry_date',
          ];
          if (dateFields.includes(field) && bookingData[field] === '') {
            filteredData[field] = null;
          } else {
            filteredData[field] = bookingData[field];
          }
        }
      });

      const response = await bookingInfoApi.post(
        `/quotes?id=${quoteId}&endpoint=booking-info`,
        filteredData
      );

      if (response.data.success) {
        console.log('✅ Booking info saved successfully');
        console.log('📋 Status:', response.data.status);
        return {
          success: true,
          data: response.data.data,
          status: response.data.status,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || 'Failed to save booking information');
    } catch (error) {
      console.error('❌ Error saving booking info:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Not authorized to submit booking information');
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.message ||
          'Invalid booking information. Please check your entries.'
        );
      }
      if (error.response?.status === 401) {
        throw new Error('Please log in to submit booking information');
      }

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to save booking information'
      );
    }
  }

  /**
   * Check if booking info is complete (ready for payment)
   * @param {object} bookingInfo - Booking info object
   * @param {string} inquiryType - Inquiry type ('flight', 'hotel', etc.)
   * @returns {object} { isComplete: boolean, missingFields: string[] }
   */
  checkBookingInfoComplete(bookingInfo, inquiryType) {
    if (!bookingInfo) {
      return {
        isComplete: false,
        missingFields: ['all booking information'],
      };
    }

    const missingFields = [];

    // Required for all bookings
    if (!bookingInfo.full_name || !bookingInfo.email || !bookingInfo.phone) {
      missingFields.push('personal information');
    }

    // Government ID required for all
    if (!bookingInfo.govt_id_type || !bookingInfo.govt_id_number) {
      missingFields.push('government ID information');
    }

    // Passport required only for flights
    const isFlight = inquiryType === 'flight';
    if (isFlight && (!bookingInfo.passport_number || !bookingInfo.passport_expiry_date)) {
      missingFields.push('passport information');
    }

    // Terms required
    if (!bookingInfo.terms_accepted || !bookingInfo.privacy_policy_accepted) {
      missingFields.push('terms acceptance');
    }

    // Check status
    const status = bookingInfo.status;
    const hasRequiredFields = !missingFields.length;

    return {
      isComplete: hasRequiredFields && (status === 'completed' || status === 'verified'),
      missingFields,
      status,
    };
  }
}

export default new BookingInfoService();







