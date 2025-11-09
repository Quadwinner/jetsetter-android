import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { auth } from './firebase';

// Only import Google Sign-In on supported platforms
let GoogleSignin = null;
if (Platform.OS !== 'web') {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    // Configure Google Sign-In only if available
    GoogleSignin?.configure({
      webClientId: '84512959275-l25c7c0qagj87bbpb7fdtomiseubmnju.apps.googleusercontent.com',
    });
  } catch (error) {
    console.log('Google Sign-In not available:', error.message);
  }
}

class AuthService {
  /**
   * Sign up with email and password
   */
  async signup(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Send email verification
      await sendEmailVerification(user);

      // Save user data to AsyncStorage
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName,
        emailVerified: user.emailVerified,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('isAuthenticated', 'true');

      return { success: true, user: userData };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  /**
   * Sign in with email and password
   */
  async signin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data to AsyncStorage
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('isAuthenticated', 'true');

      return { success: true, user: userData };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      // Check if Google Sign-In is available
      if (!GoogleSignin) {
        console.log('⚠️ Google Sign-In module not available');
        return {
          success: false,
          error: 'Google Sign-In requires a development build.\n\nTo enable Google Sign-In:\n1. Build the app with: npx expo run:android (or run:ios)\n2. Or create a development build with EAS\n\nFor now, please use email/password login.'
        };
      }

      // Check if running on web platform
      if (Platform.OS === 'web') {
        console.log('⚠️ Google Sign-In not supported on web');
        return {
          success: false,
          error: 'Google Sign-In is only available on mobile devices.\n\nPlease use email/password login on web, or test on a mobile device.'
        };
      }

      console.log('🔐 Initiating Google Sign-In...');

      // Check if device supports Google Play Services (Android only)
      if (Platform.OS === 'android') {
        console.log('📱 Checking Google Play Services...');
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Get user info from Google
      console.log('👤 Opening Google Sign-In prompt...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful, user:', userInfo.user?.email);

      if (!userInfo.data?.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create Firebase credential
      console.log('🔑 Creating Firebase credential...');
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);

      // Sign in with Firebase
      console.log('🔥 Signing in with Firebase...');
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      // Save user data
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('isAuthenticated', 'true');

      console.log('✅ Google Sign-In complete!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Google sign-in error:', error);

      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === '-5') {
        return {
          success: false,
          error: 'Google Sign-In was cancelled. Please try again.'
        };
      }

      if (error.code === 'IN_PROGRESS') {
        return {
          success: false,
          error: 'Google Sign-In is already in progress. Please wait.'
        };
      }

      if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          success: false,
          error: 'Google Play Services is not available on this device. Please update Google Play Services or use email/password login.'
        };
      }

      return {
        success: false,
        error: error.message || 'Google sign-in failed. Please try again or use email/password login.'
      };
    }
  }

  /**
   * Sign out
   */
  async signout() {
    try {
      // Sign out from Google if signed in and available
      if (GoogleSignin) {
        try {
          const isSignedIn = await GoogleSignin.isSignedIn();
          if (isSignedIn) {
            await GoogleSignin.signOut();
          }
        } catch (error) {
          console.log('Google sign-out skipped:', error.message);
        }
      }

      await signOut(auth);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.setItem('isAuthenticated', 'false');
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  /**
   * Get current user from AsyncStorage
   */
  async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const isAuth = await AsyncStorage.getItem('isAuthenticated');
      return isAuth === 'true';
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('isAuthenticated', 'true');
        callback(userData);
      } else {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.setItem('isAuthenticated', 'false');
        callback(null);
      }
    });
  }

  /**
   * Get user-friendly error messages
   */
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email address is already in use';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/operation-not-allowed':
        return 'Operation not allowed';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'An error occurred. Please try again';
    }
  }
}

export default new AuthService();
