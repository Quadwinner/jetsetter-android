import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

/**
 * profileService — reads/writes the user's profile on the backend (the same
 * users row the website uses), so profile edits persist server-side and stay
 * consistent across web + app. GET/PUT /api/auth/me (auth required).
 */

async function getToken() {
  return (
    (await AsyncStorage.getItem('authToken')) ||
    (await AsyncStorage.getItem('token')) ||
    (await AsyncStorage.getItem('supabase_token')) ||
    null
  );
}

const profileService = {
  async getProfile() {
    try {
      const token = await getToken();
      if (!token) return { success: false, error: 'Not authenticated' };
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: data.message || 'Failed to load profile' };
      return { success: true, profile: data };
    } catch (e) {
      return { success: false, error: 'Network error' };
    }
  },

  async updateProfile(fields) {
    try {
      const token = await getToken();
      if (!token) return { success: false, error: 'Not authenticated' };
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(fields),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: data.message || 'Failed to update profile' };
      return { success: true, profile: data };
    } catch (e) {
      return { success: false, error: 'Network error' };
    }
  },
};

export default profileService;
