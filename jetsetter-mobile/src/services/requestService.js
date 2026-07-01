import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://www.jetsetterss.com/api';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const requestService = {
  submitInquiry: async (inquiryData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(inquiryData),
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { throw new Error(`Server error: ${res.status}`); }
  },

  cancelBooking: async (bookingReference, email, reason) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/payments?action=cancel-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ bookingReference, reason }),
    });
    return res.json();
  },

  getMyInquiries: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/inquiries/my`, { headers });
    const data = await res.json();
    return data.success ? data.data : [];
  },
};

export default requestService;
