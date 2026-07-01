import axios from 'axios';
import { API_CONFIG } from '../constants/config';

const BASE = API_CONFIG.BASE_URL;

const homeService = {
  async searchAirports(keyword) {
    const { data } = await axios.post(`${BASE}/airports/search`, { keyword, limit: 10 });
    return data;
  },

  async searchFlights(searchParams) {
    const { data } = await axios.post(`${BASE}/flights/search`, searchParams, { timeout: 15000 });
    return data;
  },

  async getMostBookedDestinations(origin = 'JFK') {
    const { data } = await axios.get(`${BASE}/flights/analytics/booked`, { params: { origin } });
    return data;
  },

  async getCheapestDates(origin, destination) {
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 7);
    const dateStr = departureDate.toISOString().split('T')[0];
    const { data } = await axios.get(`${BASE}/flights/cheapest-dates`, {
      params: { origin, destination, oneWay: true, departureDate: dateStr },
    });
    return data;
  },

  async getGeoLocation() {
    try {
      const { data } = await axios.get(`${BASE}/geo/location`);
      return data;
    } catch {
      return { city: 'New York', country_code: 'US', currency: 'USD' };
    }
  },

  async sendCallbackRequest(formData) {
    const { data } = await axios.post(`${BASE}/send-email`, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: 'cruise',
      details: {
        preferredTime: formData.callTime,
        message: formData.info || 'Interested in cruise booking',
      },
    });
    return data;
  },
};

export default homeService;
