import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';
import supabase from './supabase';

/**
 * MyTripsService — user's inquiries (with quotes) + completed bookings.
 * ─────────────────────────────────────────────────────────────
 * Previously this read identity from Firebase (auth.currentUser) and queried
 * Supabase directly. After the auth switch there's no Firebase session, so that
 * path returned empty and (with RLS) the anon Supabase query would be blocked.
 * We now go through the backend /inquiries/my endpoint, which authenticates via
 * the stored token, runs with the service role (RLS-safe), and matches the user
 * by token id OR email — exactly like the website.
 */

const API_BASE_URL = API_CONFIG.BASE_URL;

const myTripsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

async function getToken() {
  return (
    (await AsyncStorage.getItem('authToken')) ||
    (await AsyncStorage.getItem('token')) ||
    (await AsyncStorage.getItem('supabase_token')) ||
    null
  );
}

async function getStoredUser() {
  try {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

myTripsApi.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

class MyTripsService {
  /**
   * User's inquiries + attached quotes, from the backend (matches the website).
   */
  async getMyInquiries() {
    try {
      const res = await myTripsApi.get('/inquiries/my');
      const data = res.data?.data || res.data?.inquiries || res.data || [];
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error('❌ getMyInquiries error:', error.response?.status, error.message);
      // Best-effort fallback: direct Supabase by stored email.
      return await this.getInquiriesFromSupabase();
    }
  }

  async getInquiriesFromSupabase() {
    try {
      const user = await getStoredUser();
      if (!user?.email) return { success: true, data: [] };
      const { data, error } = await supabase
        .from('inquiries')
        .select('*, quotes(*)')
        .ilike('customer_email', user.email)
        .order('created_at', { ascending: false });
      if (error) return { success: true, data: [] };
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: true, data: [] };
    }
  }

  /**
   * Completed bookings for the signed-in user — fetched from the SAME backend
   * endpoint the website uses (GET /flights/bookings?userId=...), so bookings
   * made on web or app appear on both. Matches by the user id (which equals the
   * Supabase auth uid). Falls back to any on-device bookings if the call fails.
   */
  async getMyBookings() {
    try {
      const user = await getStoredUser();
      const userId = user?.id || user?.uid;
      if (!userId) return { success: true, data: await this._localBookings() };

      const res = await myTripsApi.get('/flights/bookings', { params: { userId } });
      const data = res.data?.data || res.data?.bookings || [];
      const server = Array.isArray(data) ? data : [];
      if (server.length > 0) return { success: true, data: server };

      // No server rows — surface any on-device bookings as a fallback.
      return { success: true, data: await this._localBookings() };
    } catch (error) {
      console.error('❌ getMyBookings error:', error.response?.status, error.message);
      return { success: true, data: await this._localBookings() };
    }
  }

  /** On-device booking cache (fallback only). */
  async _localBookings() {
    const results = [];
    try {
      const keys = ['completedBooking', 'completedHotelBooking', 'completedFlightBooking'];
      for (const k of keys) {
        const raw = await AsyncStorage.getItem(k);
        if (raw) {
          try { results.push(JSON.parse(raw)); } catch (_) { /* skip bad entry */ }
        }
      }
    } catch (_) { /* ignore */ }
    return results;
  }

  /**
   * Single inquiry (with quotes) — backend first, Supabase fallback.
   */
  async getInquiryById(inquiryId) {
    try {
      const response = await myTripsApi.get(`/inquiries/${inquiryId}`);
      if (response.data?.success !== undefined) return response.data;
      if (response.data?.id || response.data?.inquiry_type) {
        return { success: true, data: response.data, message: 'Inquiry loaded successfully' };
      }
      return response.data;
    } catch (error) {
      console.error('❌ getInquiryById error:', error.response?.status, error.message);
      return await this.getInquiryByIdFromSupabase(inquiryId);
    }
  }

  async getInquiryByIdFromSupabase(inquiryId) {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, quotes(*)')
      .eq('id', inquiryId)
      .single();
    if (error) throw new Error(error.message || 'Inquiry not found');
    return { success: true, data, message: 'Inquiry loaded successfully' };
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'Failed to load data';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your internet connection.');
    }
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export default new MyTripsService();
