import axios from 'axios';
import { API_CONFIG } from '../constants/config';

// ARC Pay is accessed only through the Jetsetters backend. Merchant credentials
// and gateway API calls must never be present in the mobile application.
const paymentApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Check gateway availability through the backend.
 * GET /api/payments?action=gateway-status
 */
const checkGatewayStatus = async () => {
  try {
    const response = await paymentApi.get('/payments', {
      params: { action: 'gateway-status' },
    });

    return {
      success: true,
      gatewayOperational: response.data.gatewayStatus?.status === 'OPERATING',
      status: response.data.gatewayStatus?.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Gateway unavailable',
      gatewayOperational: false,
    };
  }
};

/**
 * Create a hosted checkout session through the backend.
 * POST /api/payments?action=hosted-checkout
 */
const createHostedCheckout = async (checkoutData) => {
  try {
    const response = await paymentApi.post('/payments?action=hosted-checkout', checkoutData);

    return {
      success: response.data.success,
      sessionId: response.data.sessionId,
      checkoutUrl: response.data.checkoutUrl || response.data.paymentPageUrl,
      orderId: response.data.orderId,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create checkout session',
    };
  }
};

export default {
  checkGatewayStatus,
  createHostedCheckout,
};
