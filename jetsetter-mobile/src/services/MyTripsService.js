import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';
import supabase from './supabase';

const API_BASE_URL = API_CONFIG.BASE_URL;

const myTripsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

myTripsApi.interceptors.request.use(async (config) => {
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

class MyTripsService {
  /**
   * Get user's inquiries/requests
   * Endpoint: GET /api/inquiries (with user filter)
   * Falls back to Supabase if API fails
   */
  async getMyInquiries() {
    try {
      console.log('📡 Fetching inquiries from API...');
      const response = await myTripsApi.get('/inquiries');
      console.log('✅ Got inquiries from API:', response.data?.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ API error fetching inquiries:', error.response?.status, error.response?.statusText);
      
      // If API fails (403, 404, 500), fetch directly from Supabase
      if (error.response?.status === 403 || error.response?.status === 404 || error.response?.status >= 500) {
        console.log('⚠️ API unavailable, fetching from Supabase...');
        return await this.getInquiriesFromSupabase();
      }
      
      throw this.handleError(error);
    }
  }

  /**
   * Fetch inquiries directly from Supabase (fallback)
   */
  async getInquiriesFromSupabase() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Build query - filter by user email or user_id if available
      let query = supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If user is logged in, filter by user_id or email
      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else {
        // If no user, try to get email from AsyncStorage and filter by customer_email
        const userEmail = await AsyncStorage.getItem('userEmail') || 
                         await AsyncStorage.getItem('email');
        if (userEmail) {
          query = query.eq('customer_email', userEmail);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(error.message || 'Failed to fetch inquiries from database');
      }
      
      console.log('✅ Got inquiries from Supabase:', data?.length || 0);
      
      return {
        success: true,
        data: data || [],
        message: 'Inquiries loaded successfully',
      };
    } catch (error) {
      console.error('❌ Supabase fetch error:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to load inquiries',
      };
    }
  }

  /**
   * Get user's bookings
   * Endpoint: GET /api/bookings (or similar)
   */
  async getMyBookings() {
    try {
      const response = await myTripsApi.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Get bookings error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get single inquiry by ID
   * Falls back to Supabase if API fails
   */
  async getInquiryById(inquiryId) {
    try {
      console.log('📡 Fetching inquiry from API:', inquiryId);
      const response = await myTripsApi.get(`/inquiries/${inquiryId}`);
      console.log('✅ API response:', JSON.stringify(response.data, null, 2));
      
      // Ensure response has the expected structure
      if (response.data.success !== undefined) {
        return response.data;
      } else if (response.data.id || response.data.inquiry_type) {
        // If response is the inquiry object directly, wrap it
        return {
          success: true,
          data: response.data,
          message: 'Inquiry loaded successfully',
        };
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('❌ API error fetching inquiry:', error.response?.status, error.message);
      
      // If API fails for any reason, fetch from Supabase
      console.log('⚠️ API unavailable, fetching from Supabase...');
      return await this.getInquiryByIdFromSupabase(inquiryId);
    }
  }

  /**
   * Fetch single inquiry from Supabase (fallback)
   */
  async getInquiryByIdFromSupabase(inquiryId) {
    try {
      console.log('📡 Fetching inquiry from Supabase with ID:', inquiryId);
      
      // Fetch inquiry with quotes relationship
      const { data, error } = await supabase
        .from('inquiries')
        .select('*, quotes(*)')
        .eq('id', inquiryId)
        .single();
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(error.message || 'Inquiry not found');
      }
      
      console.log('✅ Got inquiry from Supabase:', data?.id);
      console.log('📋 Quotes count:', data?.quotes?.length || 0);
      
      return {
        success: true,
        data: data,
        message: 'Inquiry loaded successfully',
      };
    } catch (error) {
      console.error('❌ Supabase fetch error:', error);
      throw new Error(error.message || 'Failed to load inquiry');
    }
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || 
                     error.response.data?.error || 
                     'Failed to load data';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your internet connection.');
    }
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export default new MyTripsService();


