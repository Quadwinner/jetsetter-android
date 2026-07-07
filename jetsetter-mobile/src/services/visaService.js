import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

const BASE_URL = API_CONFIG.BASE_URL;

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const visaService = {
  submitApplication: async (applicationData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/visa/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(applicationData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Submission failed');
    return data;
  },

  trackApplication: async (ref) => {
    const res = await fetch(`${BASE_URL}/visa/applications/track?ref=${encodeURIComponent(ref)}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Application not found');
    return data.data || data.application;
  },

  getMyApplications: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/visa/applications/my`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load applications');
    return data.data || data.applications || [];
  },

  getRequirements: async (origin, destination, visaType = 'tourist') => {
    const params = new URLSearchParams({ origin, destination, visaType });
    const res = await fetch(`${BASE_URL}/visa-requirements/requirements?${params}`);
    const data = await res.json();
    return data.data || data;
  },

  getPopularDestinations: async () => {
    const res = await fetch(`${BASE_URL}/visa-requirements/popular-destinations`);
    const data = await res.json();
    return data.data || data.destinations || [];
  },

  createCheckout: async (applicationId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/visa/applications/${applicationId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    return data;
  },

  cancelApplication: async (applicationId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/visa/applications/${applicationId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cancellation failed');
    return data;
  },
};

export default visaService;
