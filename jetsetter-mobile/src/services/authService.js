import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { decode as atob } from 'base-64';
import { API_CONFIG } from '../constants/config';

/**
 * authService — authenticates against the SAME backend as the website.
 * ─────────────────────────────────────────────────────────────
 * Previously this used Firebase and never stored an access token, so every
 * authenticated API call went out with no Authorization header → the backend
 * returned 401 and screens like My Trips / profile came back empty. It also
 * split identity (app = Firebase, backend = Supabase), so app-only users had no
 * backend record.
 *
 * Now we use the backend /api/auth endpoints (login / register / google-login /
 * forgot-password). They return a JWT the backend middleware verifies first and
 * always map to a real users row, so authenticated calls resolve the user. The
 * token is persisted under every key the various service files read.
 */

// Google Sign-In is native-only; guard the require so web/dev doesn't crash.
let GoogleSignin = null;
if (Platform.OS !== 'web') {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    GoogleSignin?.configure({
      webClientId: '84512959275-l25c7c0qagj87bbpb7fdtomiseubmnju.apps.googleusercontent.com',
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });
  } catch (error) {
    console.log('Google Sign-In not available:', error.message);
  }
}

const API = API_CONFIG.BASE_URL;

// Services read the token under different keys historically — write them all so
// a request is authenticated no matter which service issues it.
const TOKEN_KEYS = ['authToken', 'token', 'supabase_token', 'auth_token', 'userToken'];

let authListeners = [];
let currentUser = null;

function notify(user) {
  currentUser = user;
  authListeners.forEach((cb) => {
    try { cb(user); } catch (e) { console.log('auth listener error:', e?.message); }
  });
}

function userFromResponse(data) {
  const firstName = data.firstName || data.first_name || '';
  const lastName = data.lastName || data.last_name || '';
  const displayName = `${firstName} ${lastName}`.trim() || data.name || data.email;
  return {
    id: data.id,
    uid: data.id,
    email: data.email,
    firstName,
    lastName,
    displayName,
    role: data.role || 'user',
    photoURL: data.photoURL || null,
    emailVerified: true,
  };
}

function isTokenExpired(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return false;
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64));
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch (e) {
    return false; // if we can't decode, don't force a logout
  }
}

async function persistAuth(token, user) {
  await Promise.all(TOKEN_KEYS.map((k) => AsyncStorage.setItem(k, token)));
  await AsyncStorage.setItem('user', JSON.stringify(user));
  await AsyncStorage.setItem('isAuthenticated', 'true');
}

async function clearAuth() {
  await Promise.all([...TOKEN_KEYS, 'user'].map((k) => AsyncStorage.removeItem(k)));
  await AsyncStorage.setItem('isAuthenticated', 'false');
}

async function postJson(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* non-JSON error body */ }
  return { ok: res.ok, status: res.status, data };
}

class AuthService {
  async signup(email, password, displayName) {
    const parts = String(displayName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || 'Guest';
    const lastName = parts.slice(1).join(' ') || firstName; // backend requires a non-empty last name
    try {
      const { ok, data } = await postJson('/auth/register', { firstName, lastName, email, password });
      if (!ok) return { success: false, error: data.message || 'Registration failed' };
      if (data.token) {
        const user = userFromResponse(data);
        await persistAuth(data.token, user);
        notify(user);
        return { success: true, user };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  async signin(email, password) {
    try {
      const { ok, data } = await postJson('/auth/login', { email, password });
      if (!ok) return { success: false, error: data.message || 'Invalid email or password' };
      const user = userFromResponse(data);
      await persistAuth(data.token, user);
      notify(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  async signInWithGoogle() {
    try {
      if (!GoogleSignin) {
        return { success: false, error: 'Google Sign-In requires a development/production build. Please use email/password.' };
      }
      if (Platform.OS === 'web') {
        return { success: false, error: 'Google Sign-In is only available on mobile devices.' };
      }
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      if (!idToken) throw new Error('No ID token received from Google');

      const { ok, data } = await postJson('/auth/google-login', { token: idToken });
      if (!ok) return { success: false, error: data.message || 'Google sign-in failed' };

      const user = userFromResponse(data);
      await persistAuth(data.token, user);
      notify(user);
      return { success: true, user };
    } catch (error) {
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === '-5') {
        return { success: false, error: 'Google Sign-In was cancelled. Please try again.' };
      }
      if (error.code === 'IN_PROGRESS') {
        return { success: false, error: 'Google Sign-In is already in progress. Please wait.' };
      }
      if (error.code === 'DEVELOPER_ERROR' || String(error.code) === '10') {
        return { success: false, error: 'Google Sign-In is not configured for this build (keystore SHA-1 not registered). Please use email/password for now.' };
      }
      return { success: false, error: error.message || 'Google sign-in failed. Please try email/password.' };
    }
  }

  async signout() {
    try {
      if (GoogleSignin) {
        try { await GoogleSignin.signOut(); } catch (e) { /* not signed in with google */ }
      }
      await clearAuth();
      notify(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      const { ok, data } = await postJson('/auth/forgot-password', { email });
      if (!ok) return { success: false, error: data.message || 'Failed to send reset email' };
      return { success: true, message: data.message || 'Password reset email sent successfully' };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  async deleteAccount() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API}/auth/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      let data = {};
      try { data = await res.json(); } catch (e) { /* non-JSON */ }
      if (!res.ok) return { success: false, error: data.message || 'Failed to delete account' };
      await clearAuth();
      notify(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token && !isTokenExpired(token);
    } catch (error) {
      return false;
    }
  }

  /**
   * Token-based auth has no external listener, so we keep a lightweight emitter:
   * subscribers get an immediate callback with the persisted user (lets App.js
   * finish its splash) plus updates whenever signin/signup/signout fire.
   * Returns an unsubscribe function (matches the previous Firebase interface).
   */
  onAuthStateChange(callback) {
    authListeners.push(callback);

    (async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userJson = await AsyncStorage.getItem('user');
        if (token && !isTokenExpired(token) && userJson) {
          currentUser = JSON.parse(userJson);
          callback(currentUser);
        } else {
          if (token) await clearAuth(); // stale/expired session — clean it up
          currentUser = null;
          callback(null);
        }
      } catch (e) {
        callback(null);
      }
    })();

    return () => { authListeners = authListeners.filter((cb) => cb !== callback); };
  }

  getErrorMessage() {
    return 'An error occurred. Please try again';
  }
}

export default new AuthService();
