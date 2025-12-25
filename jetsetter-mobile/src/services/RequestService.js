import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';
import supabase from './supabase';

// Force correct production API URL - override config if it's wrong
const API_BASE_URL = 'https://www.jetsetterss.com/api';

// Log the URL being used for debugging
console.log('🔗 RequestService API Base URL:', API_BASE_URL);
if (API_CONFIG?.BASE_URL && API_CONFIG.BASE_URL !== API_BASE_URL) {
  console.warn('⚠️ API_CONFIG.BASE_URL mismatch:', API_CONFIG.BASE_URL, '-> Using:', API_BASE_URL);
}

const requestApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG?.TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

requestApi.interceptors.request.use(async (config) => {
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

class RequestService {
  /**
   * Normalize inquiry_type to match database constraint
   * Maps app values to database-expected values
   */
  normalizeInquiryType(type) {
    const typeMap = {
      'flight': 'flight',
      'hotel': 'hotel',
      'cruise': 'cruise',
      'package': 'package',
      'custom': 'general',
      'general': 'general',
      'general_inquiry': 'general',
    };
    
    const normalized = typeMap[type?.toLowerCase()] || 'general';
    console.log(`Normalized inquiry_type: ${type} -> ${normalized}`);
    return normalized;
  }

  /**
   * Create a new inquiry/request (same payload & endpoint as web /request form)
   * Endpoint: POST /api/inquiries (same as web)
   * @param {object} payload - Should match existing web JSON body
   */
  async createRequest(payload) {
    try {
      console.log('📤 Creating request to:', `${API_BASE_URL}/inquiries`);
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      
      // Use /api/inquiries endpoint directly (same as web)
      const response = await requestApi.post('/inquiries', payload);
      
      console.log('✅ Request created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API request error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        fullUrl: error.config?.baseURL + error.config?.url,
        data: error.response?.data
      });
      
      // If API endpoint fails, save directly to Supabase as fallback
      if (error.response?.status === 404 || error.response?.status >= 500) {
        console.log('⚠️ API endpoint not available, saving directly to Supabase');
        return await this.saveToSupabase(payload);
      }
      
      // For other errors, throw with context
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          `Failed to create request. Status: ${error.response?.status || 'unknown'}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Save inquiry directly to Supabase (fallback when backend API is not available)
   */
  async saveToSupabase(payload) {
    try {
      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      // Normalize inquiry_type to match database constraint
      const rawInquiryType = payload.inquiry_type || payload.tripType || 'custom';
      const normalizedInquiryType = this.normalizeInquiryType(rawInquiryType);
      
      // Prepare data for Supabase insert
      const inquiryData = {
        inquiry_type: normalizedInquiryType,
        customer_name: payload.customer_name,
        customer_email: payload.customer_email,
        customer_phone: payload.customer_phone,
        customer_country: payload.customer_country,
        special_requirements: payload.special_requirements,
        budget_range: payload.budget_range,
        preferred_contact_method: payload.preferred_contact_method || 'email',
        user_id: user?.id || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        // Type-specific fields
        ...(payload.flight_origin && { flight_origin: payload.flight_origin }),
        ...(payload.flight_destination && { flight_destination: payload.flight_destination }),
        ...(payload.flight_departure_date && { flight_departure_date: payload.flight_departure_date }),
        ...(payload.flight_return_date && { flight_return_date: payload.flight_return_date }),
        ...(payload.flight_passengers && { flight_passengers: payload.flight_passengers }),
        ...(payload.flight_class && { flight_class: payload.flight_class }),
        ...(payload.hotel_destination && { hotel_destination: payload.hotel_destination }),
        ...(payload.hotel_checkin_date && { hotel_checkin_date: payload.hotel_checkin_date }),
        ...(payload.hotel_checkout_date && { hotel_checkout_date: payload.hotel_checkout_date }),
        ...(payload.hotel_rooms && { hotel_rooms: payload.hotel_rooms }),
        ...(payload.hotel_guests && { hotel_guests: payload.hotel_guests }),
        ...(payload.hotel_room_type && { hotel_room_type: payload.hotel_room_type }),
        ...(payload.cruise_destination && { cruise_destination: payload.cruise_destination }),
        ...(payload.cruise_departure_date && { cruise_departure_date: payload.cruise_departure_date }),
        ...(payload.cruise_duration && { cruise_duration: payload.cruise_duration }),
        ...(payload.cruise_cabin_type && { cruise_cabin_type: payload.cruise_cabin_type }),
        ...(payload.cruise_passengers && { cruise_passengers: payload.cruise_passengers }),
        ...(payload.package_destination && { package_destination: payload.package_destination }),
        ...(payload.package_start_date && { package_start_date: payload.package_start_date }),
        ...(payload.package_end_date && { package_end_date: payload.package_end_date }),
        ...(payload.package_travelers && { package_travelers: payload.package_travelers }),
        ...(payload.package_budget_range && { package_budget_range: payload.package_budget_range }),
      };

      console.log('💾 Saving to Supabase with inquiry_type:', normalizedInquiryType);

      // Insert into Supabase inquiries table
      let { data, error } = await supabase
        .from('inquiries')
        .insert([inquiryData])
        .select()
        .single();

      // If inquiry_type constraint fails, try alternative value
      if (error && error.code === '23514' && error.message?.includes('inquiry_type')) {
        console.log(`⚠️ First attempt failed with inquiry_type: ${normalizedInquiryType}, trying alternatives...`);
        
        // Try 'general_inquiry' if 'general' failed
        if (normalizedInquiryType === 'general') {
          inquiryData.inquiry_type = 'general_inquiry';
          const retry = await supabase
            .from('inquiries')
            .insert([inquiryData])
            .select()
            .single();
          
          if (!retry.error) {
            console.log('✅ Retry with general_inquiry succeeded');
            data = retry.data;
            error = null;
          } else {
            error = retry.error;
          }
        }
      }

      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('Attempted inquiry_type:', normalizedInquiryType);
        console.error('Full inquiry data:', JSON.stringify(inquiryData, null, 2));
        throw new Error(
          error.message || 
          `Failed to save inquiry to database. Check inquiry_type value: ${normalizedInquiryType}`
        );
      }

      console.log('✅ Inquiry saved to Supabase successfully');
      console.log('📦 Returning response:', JSON.stringify({
        success: true,
        message: 'Inquiry submitted successfully',
        data: {
          inquiry: data,
        },
      }, null, 2));
      
      const response = {
        success: true,
        message: 'Inquiry submitted successfully',
        data: {
          inquiry: data,
        },
      };
      
      // Ensure inquiry has an id
      if (!response.data.inquiry?.id && data?.id) {
        response.data.inquiry = { ...response.data.inquiry, id: data.id };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Save to Supabase error:', error);
      throw new Error(error.message || 'Failed to save inquiry');
    }
  }
}

export default new RequestService();
