/**
 * ARC Pay Payment Service
 * 
 * Implements the Hosted Checkout integration with ARC Pay following the
 * implementation guide. This service handles:
 * - Payment initiation (gets payment page URL from backend)
 * - Payment verification (verifies payment after callback)
 * - Payment status checking
 * 
 * The backend handles all the complexity - this service only needs to send quote_id
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

// API Base URL - same as web platform
const API_BASE_URL = API_CONFIG.BASE_URL || 'https://www.jetsetterss.com/api';

class ArcPaymentService {
  /**
   * Get authentication token from storage
   */
  async getAuthToken() {
    try {
      // Try different token keys (same as web platform)
      const token = await AsyncStorage.getItem('token') ||
                    await AsyncStorage.getItem('supabase_token') ||
                    await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Initiate payment with ARC Pay
   * 
   * IMPORTANT: Backend only needs quote_id!
   * Backend fetches all other details (amount, currency, customer info) from Supabase
   * 
   * @param {string} quoteId - The quote ID to pay for
   * @param {object} options - Optional: return_url, cancel_url for deep linking
   * @returns {Promise<object>} Payment session data
   */
  async initiatePayment(quoteId, options = {}) {
    try {
      const token = await this.getAuthToken();
      
      console.log('💳 Initiating ARC Pay payment for quote:', quoteId);
      console.log('📡 API URL:', `${API_BASE_URL}/payments?action=initiate-payment`);
      
      const response = await axios.post(
        `${API_BASE_URL}/payments?action=initiate-payment`,
        {
          quote_id: quoteId,
          // Optional: Override return URLs for mobile deep linking
          return_url: options.returnUrl,
          cancel_url: options.cancelUrl,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('📥 Payment initiation response:', response.data);

      // Response structure from backend:
      // {
      //   success: true,
      //   sessionId: "SESSION0002...",
      //   paymentId: "uuid...",
      //   paymentPageUrl: "https://na.gateway.mastercard.com/checkout/pay/SESSION...",
      //   successIndicator: "abc123...",
      //   merchantId: "TESTARC05511704"
      // }
      
      if (response.data.success) {
        const { 
          sessionId, 
          paymentId, 
          paymentPageUrl, 
          successIndicator 
        } = response.data;
        
        // Store payment info for later verification
        await AsyncStorage.multiSet([
          ['current_payment_id', paymentId || ''],
          ['current_session_id', sessionId || ''],
          ['current_quote_id', quoteId],
          ['success_indicator', successIndicator || ''],
        ]);
        
        return {
          success: true,
          paymentId,
          sessionId,
          paymentPageUrl,
          successIndicator,
        };
      }
      
      throw new Error(response.data.error || response.data.details || 'Payment initiation failed');
    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify payment after callback
   * Called after user completes payment on hosted page
   * 
   * @param {object} params - Callback parameters
   * @param {string} params.resultIndicator - Result indicator from ARC Pay
   * @param {string} params.sessionId - Session ID
   * @param {string} params.quoteId - Quote ID
   * @returns {Promise<object>} Payment verification result
   */
  async verifyPayment(params) {
    try {
      const { resultIndicator, sessionId, quoteId } = params;
      
      console.log('🔍 Verifying payment:', { resultIndicator, sessionId, quoteId });
      
      // Get quote_id from stored payment or params
      const storedQuoteId = quoteId || await AsyncStorage.getItem('current_quote_id');
      
      const response = await axios.get(
        `${API_BASE_URL}/payments?action=payment-callback`,
        {
          params: {
            resultIndicator,
            sessionId,
            quote_id: storedQuoteId,
          },
          timeout: 30000,
        }
      );

      console.log('📥 Payment verification response:', response.data);
      
      // Clear stored payment data
      await this.clearPaymentData();

      return response.data;
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get payment details by ID
   * 
   * @param {string} paymentId - Payment ID
   * @returns {Promise<object>} Payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const token = await this.getAuthToken();
      
      const response = await axios.get(
        `${API_BASE_URL}/payments?action=get-payment-details`,
        {
          params: { paymentId },
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Get payment details error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get stored payment session data
   * Useful for recovering payment state after app restart
   */
  async getStoredPaymentData() {
    try {
      const keys = [
        'current_payment_id',
        'current_session_id', 
        'current_quote_id',
        'success_indicator'
      ];
      
      const results = await AsyncStorage.multiGet(keys);
      const data = {};
      
      results.forEach(([key, value]) => {
        data[key.replace('current_', '')] = value;
      });
      
      return data;
    } catch (error) {
      console.error('Error getting stored payment data:', error);
      return null;
    }
  }

  /**
   * Clear stored payment data
   */
  async clearPaymentData() {
    try {
      await AsyncStorage.multiRemove([
        'current_payment_id',
        'current_session_id',
        'current_quote_id',
        'success_indicator',
      ]);
    } catch (error) {
      console.error('Error clearing payment data:', error);
    }
  }

  /**
   * Check if a URL is a payment callback URL
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isCallbackUrl(url) {
    return url.includes('/payment/callback') || 
           url.includes('resultIndicator=') ||
           url.includes('payment=success') ||
           url.includes('payment=failed') ||
           url.includes('payment=cancelled');
  }

  /**
   * Extract callback parameters from URL
   * @param {string} url - Callback URL
   * @returns {object} Extracted parameters
   */
  extractCallbackParams(url) {
    try {
      const urlObj = new URL(url);
      return {
        resultIndicator: urlObj.searchParams.get('resultIndicator'),
        sessionId: urlObj.searchParams.get('sessionId') || urlObj.searchParams.get('session.id'),
        paymentStatus: urlObj.searchParams.get('payment'),
        orderId: urlObj.searchParams.get('orderId'),
      };
    } catch (error) {
      console.error('Error parsing callback URL:', error);
      return {};
    }
  }

  /**
   * Check if a URL should be allowed in the payment WebView
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isAllowedUrl(url) {
    const allowedDomains = [
      'gateway.mastercard.com',
      'arcpay.travel',
      '3ds',
      'acs.',
      'secure',
      'jetsetterss.com',
      'prod-six-phi.vercel.app',
    ];
    
    return allowedDomains.some(domain => url.includes(domain)) ||
           url.includes('payment/callback') ||
           url.includes('resultIndicator');
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.error || 
                     error.response.data?.details || 
                     error.response.data?.message ||
                     `Server error: ${error.response.status}`;
      return new Error(message);
    } else if (error.request) {
      // No response received
      return new Error('Network error. Please check your internet connection.');
    }
    // Other error
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export default new ArcPaymentService();
