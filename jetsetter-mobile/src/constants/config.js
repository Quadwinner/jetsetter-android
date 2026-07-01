import Constants from 'expo-constants';

// API Configuration
// Base URL is env-driven: app.config.js copies process.env.API_BASE_URL into
// expo `extra`, so set API_BASE_URL in .env to point at a backend.
//   • Production (default):  https://www.jetsetterss.com/api
//   • Android emulator dev:  http://10.0.2.2:5004/api
//   • Physical device dev:   http://<your-LAN-IP>:5004/api  (same Wi-Fi)
const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

export const API_CONFIG = {
  BASE_URL: extra.API_BASE_URL || 'https://www.jetsetterss.com/api',
  TIMEOUT: 30000,
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  URL: 'https://qqmagqwumjipdqvxbiqu.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbWFncXd1bWppcGRxdnhiaXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMDEwMTIsImV4cCI6MjA2MDU3NzAxMn0.Ho8DYLWpX_vQ6syrI2zkU3G5pnNTdnYpgtpyjjGYlDA',
};

// Amadeus API Configuration
export const AMADEUS_CONFIG = {
  API_KEY: 'HSdhpX2AHnyj7LnL1TjDFL8MHj8lGz5G',
  API_SECRET: 'bXf2ed12C4ruJ1Nt',
  BASE_URL: 'https://api.amadeus.com',
};

// ARC Pay Configuration
export const ARC_PAY_CONFIG = {
  MERCHANT_ID: 'TESTARC05511704',
  API_URL: 'https://api.arcpay.travel/api/rest/version/100/merchant/TESTARC05511704',
  // Backend URL for payment processing (same as web platform)
  BACKEND_PAYMENT_URL: 'https://www.jetsetterss.com/api/payments',
  // Alternative backend for development
  DEV_PAYMENT_URL: 'https://prod-six-phi.vercel.app/api/payments',
  // Payment page URL (for reference - backend provides this)
  PAYMENT_PAGE_BASE: 'https://na.gateway.mastercard.com/checkout/pay',
  TEST_MODE: false,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Jetsetters',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.APP_ENV || 'development',
};

// Theme Colors — Jetsetters brand (teal)
export const COLORS = {
  PRIMARY: '#055B75',
  PRIMARY_DARK: '#034457',
  PRIMARY_LIGHT: '#0890BC',
  ACCENT: '#0890BC',
  SKY: '#65B3CF',
  SECONDARY: '#f59e0b',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#0890BC',
  LIGHT: '#F1FBFD',
  DARK: '#1e293b',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: '#6b7280',
  LIGHT_GRAY: '#e5e7eb',
};

// Screen Dimensions
export const SCREEN_CONFIG = {
  PADDING: 16,
  MARGIN: 8,
  BORDER_RADIUS: 8,
  SHADOW: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};
