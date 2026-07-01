import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';
import supabase from './supabase';
import { auth } from './firebase';

const API_BASE_URL = API_CONFIG.BASE_URL;

const myTripsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Get Firebase ID token for auth
const getFirebaseToken = async () => {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (_) {}
  // Fallback to stored tokens
  return (
    (await AsyncStorage.getItem('authToken')) ||
    (await AsyncStorage.getItem('token')) ||
    null
  );
};

myTripsApi.interceptors.request.use(async (config) => {
  const token = await getFirebaseToken();
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
      console.log('📡 Fetching inquiries from Supabase...');
      return await this.getInquiriesFromSupabase();
    } catch (error) {
      console.error('❌ Error fetching inquiries:', error.message);
      return { success: true, data: [] };
    }
  }

  async getInquiriesFromSupabase() {
    try {
      // Get current user email from Firebase auth
      const { auth } = require('./firebase');
      const currentUser = auth.currentUser;

      if (!currentUser?.email) {
        console.log('No logged in user, returning empty inquiries');
        return { success: true, data: [] };
      }

      const userEmail = currentUser.email;
      console.log('📡 Fetching inquiries for user:', userEmail);

      // Also try to get Supabase user ID for users who signed up via web
      let supabaseUserId = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        supabaseUserId = user?.id;
      } catch (_) {}

      let query = supabase
        .from('inquiries')
        .select('*, quotes(*)')
        .order('created_at', { ascending: false });

      // Filter by email OR supabase user_id to catch both web and mobile users
      if (supabaseUserId) {
        query = query.or(`customer_email.eq.${userEmail},user_id.eq.${supabaseUserId}`);
      } else {
        query = query.eq('customer_email', userEmail);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase query error:', error);
        return { success: true, data: [] };
      }

      console.log('✅ Got inquiries from Supabase:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Supabase fetch error:', error);
      return { success: true, data: [] };
    }
  }

  /**
   * Get user's bookings
   * Endpoint: GET /api/bookings (or similar)
   */
  async getMyBookings() {
    try {
      const { auth } = require('./firebase');
      const currentUser = auth.currentUser;
      if (!currentUser?.email) return { success: true, data: [] };

      // Fetch cruise bookings from Supabase by email
      const { data, error } = await supabase
        .from('cruise_bookings')
        .select('*')
        .eq('customer_email', currentUser.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get bookings error:', error.message);
        return { success: true, data: [] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get bookings error:', error.message);
      return { success: true, data: [] };
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


