import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

/**
 * currencyService — display prices in the user's local currency.
 * ─────────────────────────────────────────────────────────────
 * The booking APIs return prices in USD. This service detects the user's
 * currency (saved override → IP geo → device locale → USD), loads FX rates from
 * the backend (GET /currency/rates), and converts amounts for DISPLAY ONLY.
 * The amount actually charged stays in USD (payment uses the raw value), so
 * conversion never affects what the customer pays — only what they see.
 */

const SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'AED ', AUD: 'A$', CAD: 'C$',
  SGD: 'S$', JPY: '¥', CNY: '¥', CHF: 'CHF ', NZD: 'NZ$', ZAR: 'R', SAR: 'SAR ',
  THB: '฿', MYR: 'RM', HKD: 'HK$', KRW: '₩', BRL: 'R$', RUB: '₽',
};

// Country (ISO-2) → currency. Common travel markets; falls back to USD.
const COUNTRY_CURRENCY = {
  US: 'USD', IN: 'INR', GB: 'GBP', AE: 'AED', AU: 'AUD', CA: 'CAD', SG: 'SGD',
  JP: 'JPY', CN: 'CNY', CH: 'CHF', NZ: 'NZD', ZA: 'ZAR', SA: 'SAR', TH: 'THB',
  MY: 'MYR', HK: 'HKD', KR: 'KRW', BR: 'BRL', RU: 'RUB',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR',
  BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR',
};

const NO_DECIMAL = new Set(['JPY', 'KRW', 'INR']);

const state = { currency: 'USD', rates: { USD: 1 }, ready: false };
let listeners = [];
const notify = () => listeners.forEach((cb) => { try { cb(state); } catch (_) {} });

async function loadRates() {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/currency/rates`);
    const data = await res.json();
    // Accept several shapes: {rates}, {data:{rates}}, {data:{USD:...}}, {USD:...}
    const rates = data.rates || data.data?.rates || data.data || data;
    if (rates && typeof rates === 'object' && Number(rates.USD)) {
      state.rates = rates;
    } else if (rates && typeof rates === 'object' && Object.keys(rates).length) {
      state.rates = { USD: 1, ...rates };
    }
  } catch (_) { /* keep default {USD:1} — no conversion */ }
}

async function detectCurrency() {
  try {
    const manual = await AsyncStorage.getItem('userCurrencyManual');
    const saved = await AsyncStorage.getItem('userCurrency');
    if (manual === 'true' && saved) return saved;
  } catch (_) {}

  // IP geo (matches the website's approach)
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/geo/location`);
    const data = await res.json();
    const cc = String(
      data.country_code || data.countryCode || data.data?.country_code || data.data?.countryCode || ''
    ).toUpperCase();
    if (COUNTRY_CURRENCY[cc]) return COUNTRY_CURRENCY[cc];
  } catch (_) {}

  // Device locale (e.g. "en-IN" → IN)
  try {
    const locale = (typeof Intl !== 'undefined' && Intl.NumberFormat)
      ? Intl.NumberFormat().resolvedOptions().locale
      : '';
    const region = String(locale).split('-')[1]?.toUpperCase();
    if (COUNTRY_CURRENCY[region]) return COUNTRY_CURRENCY[region];
  } catch (_) {}

  return 'USD';
}

const currencyService = {
  async init() {
    const [detected] = await Promise.all([detectCurrency(), loadRates()]);
    state.currency = detected || 'USD';
    state.ready = true;
    notify();
  },

  getCurrency: () => state.currency,
  getSymbol: (code = state.currency) => SYMBOLS[code] || `${code} `,
  isReady: () => state.ready,
  supported: () => Object.keys(SYMBOLS),

  async setCurrency(code) {
    state.currency = code;
    try {
      await AsyncStorage.setItem('userCurrency', code);
      await AsyncStorage.setItem('userCurrencyManual', 'true');
    } catch (_) {}
    notify();
  },

  // amount in `from` currency (default USD) → user's currency.
  // Accepts numbers or strings like "$699" / "1,299.00" (symbols & separators stripped).
  convert(amount, from = 'USD') {
    const a = typeof amount === 'string'
      ? (parseFloat(amount.replace(/[^0-9.\-]/g, '')) || 0)
      : (parseFloat(amount) || 0);
    const rFrom = Number(state.rates[from]) || 1;
    const rTo = Number(state.rates[state.currency]) || 1;
    return (a / rFrom) * rTo;
  },

  format(amount, from = 'USD') {
    const value = this.convert(amount, from);
    const sym = SYMBOLS[state.currency] || `${state.currency} `;
    const decimals = NO_DECIMAL.has(state.currency) ? 0 : 2;
    // Manual thousands separators — Hermes' toLocaleString options are unreliable.
    const fixed = value.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${sym}${withSep}${decPart ? '.' + decPart : ''}`;
  },

  subscribe(cb) {
    listeners.push(cb);
    return () => { listeners = listeners.filter((x) => x !== cb); };
  },
};

export default currencyService;
