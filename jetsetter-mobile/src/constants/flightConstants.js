export const TRAVEL_CLASSES = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];

export const TRAVEL_CLASS_LABELS = {
  ECONOMY: 'Economy',
  PREMIUM_ECONOMY: 'Premium Economy',
  BUSINESS: 'Business',
  FIRST: 'First Class',
};

export const ADDON_LIST = [
  {
    id: 'travel_insurance',
    name: 'Travel Insurance',
    price: 25,
    icon: 'shield-checkmark-outline',
    description: 'Trip cancellation, medical, lost baggage',
  },
  {
    id: 'airport_transfer',
    name: 'Airport Transfer',
    price: 35,
    icon: 'car-outline',
    description: '24/7 professional drivers, free waiting',
  },
  {
    id: 'vip_service',
    name: 'VIP Service',
    price: 30,
    icon: 'star-outline',
    description: 'Priority check-in, boarding, baggage',
  },
];

export const NATIONALITY_LIST = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AE', name: 'UAE' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
];

export const CANCELLATION_REASONS = [
  'Change of plans',
  'Travel restrictions',
  'Schedule conflict',
  'Health reasons',
  'Weather concerns',
  'Other',
];

export const THEME = {
  primary: '#055B75',
  primaryDark: '#034457',
  secondary: '#65B3CF',
  secondaryLight: '#E0F7FA',
  pageBg: '#F8FAFC',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  white: '#FFFFFF',
  starYellow: '#FFD700',
};
