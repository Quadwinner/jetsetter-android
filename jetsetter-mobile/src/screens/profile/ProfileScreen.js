import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  Platform,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { logout as logoutAction, setUser } from '../../store/slices/authSlice';
import authService from '../../services/authService';
import profileService from '../../services/profileService';
import currencyService from '../../services/currencyService';
import styles from './styles/ProfileScreen.styles';

// Currencies we hold live FX rates for (backend /currency/rates). Offering only
// these guarantees conversion always works. Display is converted to the chosen
// currency; the amount charged stays USD (ARC Pay is USD-only).
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
];

const cur = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  note: { fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12 },
  rowActive: { backgroundColor: '#f0f9ff' },
  symBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sym: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  code: { fontSize: 15, fontWeight: '600', color: '#111827' },
  name: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
  });
  const [originalData, setOriginalData] = useState({});
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyService.getCurrency());

  // Load profile data from AsyncStorage
  const loadProfileData = useCallback(async () => {
    try {
      console.log('Loading profile data...');
      const authStatus = await AsyncStorage.getItem('isAuthenticated');
      const isAuth = authStatus === 'true';
      console.log('Is authenticated:', isAuth);
      setIsAuthenticated(isAuth);

      if (isAuth) {
        // Always check Firebase user data first
        const userData = await AsyncStorage.getItem('user');
        console.log('User data from AsyncStorage:', userData);

        if (userData) {
          const user = JSON.parse(userData);
          console.log('Parsed user:', user);

          // Convert Firebase user data to profile format
          const nameParts = (user.displayName || '').split(' ');
          const profileFromFirebase = {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: user.email || '',
            phone: '',
            gender: '',
            dateOfBirth: '',
          };

          // Check if we have additional profile data stored
          const storedProfile = await AsyncStorage.getItem('userProfile');
          if (storedProfile) {
            const savedProfile = JSON.parse(storedProfile);
            // Merge: Keep Firebase auth data but preserve user-edited fields like phone, gender, dob
            const mergedProfile = {
              ...profileFromFirebase,
              phone: savedProfile.phone || '',
              gender: savedProfile.gender || '',
              dateOfBirth: savedProfile.dateOfBirth || '',
            };
            console.log('Setting merged profile data:', mergedProfile);
            setProfileData(mergedProfile);
            setOriginalData(mergedProfile);
            // Update stored profile with latest Firebase data
            await AsyncStorage.setItem('userProfile', JSON.stringify(mergedProfile));
          } else {
            // No stored profile, use Firebase data
            console.log('Setting profile from Firebase:', profileFromFirebase);
            setProfileData(profileFromFirebase);
            setOriginalData(profileFromFirebase);
            await AsyncStorage.setItem('userProfile', JSON.stringify(profileFromFirebase));
          }
        } else {
          // Fallback to stored profile if no Firebase user data
          const storedProfile = await AsyncStorage.getItem('userProfile');
          if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            console.log('Using stored profile (no Firebase data):', profile);
            setProfileData(profile);
            setOriginalData(profile);
          } else {
            // No data at all
            console.log('No profile found, using default');
            const defaultProfile = {
              firstName: 'User',
              lastName: '',
              email: '',
              phone: '',
              gender: '',
              dateOfBirth: '',
            };
            setProfileData(defaultProfile);
            setOriginalData(defaultProfile);
          }
        }
      }
      // Server is the source of truth — overlay the backend profile when it's
      // reachable so edits persist across devices and match the website.
      try {
        const serverRes = await profileService.getProfile();
        if (serverRes.success && serverRes.profile) {
          const p = serverRes.profile;
          const serverProfile = {
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            email: p.email || '',
            phone: p.phone || '',
            gender: p.gender || '',
            dateOfBirth: p.dateOfBirth || '',
          };
          setProfileData(serverProfile);
          setOriginalData(serverProfile);
          await AsyncStorage.setItem('userProfile', JSON.stringify(serverProfile));
        }
      } catch (e) { /* offline — keep local copy */ }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  // Reload profile data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
      setSelectedCurrency(currencyService.getCurrency());
    }, [loadProfileData])
  );

  // Persist the chosen currency and update every price display app-wide.
  const handleSelectCurrency = async (code) => {
    await currencyService.setCurrency(code);
    setSelectedCurrency(code);
    setShowCurrencyModal(false);
  };

  const currencyLabel = () => {
    const c = CURRENCIES.find((x) => x.code === selectedCurrency);
    return c ? `${c.code} · ${c.symbol}` : selectedCurrency;
  };

  // Navigate to login screen
  const handleLogin = async () => {
    // Clear authentication state to trigger navigation to AuthStack
    await AsyncStorage.setItem('isAuthenticated', 'false');
    await AsyncStorage.removeItem('user');
    dispatch(logoutAction());
  };

  // Handle logout
  // The actual sign-out. Kept separate so it can run from either the native
  // Alert callback or the web confirm (RN Alert button callbacks don't fire on web).
  const doLogout = async () => {
    try {
      await authService.signout();
      dispatch(logoutAction());
      await AsyncStorage.removeItem('userProfile');
      setIsAuthenticated(false);
      setProfileData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
      });
      setIsEditing(false);
      if (Platform.OS !== 'web') Alert.alert('Success', 'Logged out successfully!');
    } catch (error) {
      console.error('Error logging out:', error);
      if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        window.alert('Failed to logout. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to logout. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // RN Alert's multi-button callbacks don't fire on web; use window.confirm.
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to logout?')) {
        doLogout();
      }
      return;
    }
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]
    );
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));

      // Keep the auth 'user' object in sync so name/email edits survive the next
      // screen focus — loadProfileData re-derives those fields from 'user', so
      // without this the edits would be silently reverted.
      try {
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : {};
        const updatedUser = {
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          displayName: `${profileData.firstName} ${profileData.lastName}`.trim(),
          email: profileData.email || user.email,
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        dispatch(setUser(updatedUser));
      } catch (e) {
        console.log('Could not sync user object:', e?.message);
      }

      // Persist to the backend (same users row the website reads) so the
      // profile is consistent across web + app, not just on this device.
      try {
        await profileService.updateProfile({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          gender: profileData.gender,
          dateOfBirth: profileData.dateOfBirth,
        });
      } catch (e) { /* offline — saved locally, will sync on next edit */ }

      setOriginalData(profileData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  // Handle reset
  const handleReset = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  // Permanent account deletion (Play Store / GDPR requirement).
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and personal data. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await authService.deleteAccount();
              if (result.success) {
                await AsyncStorage.removeItem('userProfile');
                dispatch(logoutAction());
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete account. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle field change
  const handleFieldChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
  };

  // Currency selector menu row (used in both guest & authenticated views)
  const renderCurrencyRow = (isLast = false) => (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={() => setShowCurrencyModal(true)}
    >
      <Ionicons name="cash-outline" size={24} color="#0ea5e9" style={styles.menuItemIcon} />
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>Currency</Text>
        <Text style={styles.menuItemSubtitle}>Prices shown in {currencyLabel()}</Text>
      </View>
      <Text style={{ color: '#0ea5e9', fontWeight: '700', marginRight: 6 }}>{selectedCurrency}</Text>
      <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
    </TouchableOpacity>
  );

  // Currency picker modal
  const renderCurrencyModal = () => (
    <Modal
      visible={showCurrencyModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCurrencyModal(false)}
    >
      <Pressable style={cur.backdrop} onPress={() => setShowCurrencyModal(false)}>
        <Pressable style={cur.sheet} onPress={() => {}}>
          <View style={cur.handle} />
          <Text style={cur.title}>Choose Currency</Text>
          <Text style={cur.note}>Prices are shown in your currency. Payment is charged in USD.</Text>
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {CURRENCIES.map((c) => {
              const active = c.code === selectedCurrency;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[cur.row, active && cur.rowActive]}
                  onPress={() => handleSelectCurrency(c.code)}
                >
                  <View style={cur.symBox}>
                    <Text style={cur.sym}>{c.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cur.code}>{c.code}</Text>
                    <Text style={cur.name}>{c.name}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color="#0ea5e9" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // Render guest view
  const renderGuestView = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person" size={60} style={styles.profileIcon} />
        </View>
        <Text style={styles.userName} numberOfLines={1}>Guest User</Text>
        <View style={styles.guestBadge}>
          <Text style={styles.guestBadgeText}>Not Logged In</Text>
        </View>
      </View>

      <View style={styles.authSection}>
        <Ionicons name="lock-closed-outline" size={64} color="#0ea5e9" style={styles.authIcon} />
        <Text style={styles.authTitle}>Sign In to Your Account</Text>
        <Text style={styles.authText}>
          Access your bookings, manage your profile, and enjoy exclusive benefits by signing in.
        </Text>
        <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
          <Text style={styles.authButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {renderCurrencyRow(true)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color="#0ea5e9" style={styles.menuItemIcon} />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Help & Support</Text>
            <Text style={styles.menuItemSubtitle}>Get assistance with your bookings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
          <Ionicons name="information-circle-outline" size={24} color="#0ea5e9" style={styles.menuItemIcon} />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>About</Text>
            <Text style={styles.menuItemSubtitle}>Learn more about Jetsetter</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render authenticated view
  const renderAuthenticatedView = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person" size={60} style={styles.profileIcon} />
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {profileData.firstName} {profileData.lastName}
        </Text>
        <Text style={styles.userEmail}>{profileData.email}</Text>
      </View>

      <View style={styles.content}>
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.firstName}
              onChangeText={(value) => handleFieldChange('firstName', value)}
              editable={isEditing}
              placeholder="Enter first name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.lastName}
              onChangeText={(value) => handleFieldChange('lastName', value)}
              editable={isEditing}
              placeholder="Enter last name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.email}
              onChangeText={(value) => handleFieldChange('email', value)}
              editable={isEditing}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.phone}
              onChangeText={(value) => handleFieldChange('phone', value)}
              editable={isEditing}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  profileData.gender === 'male' && styles.genderButtonActive
                ]}
                onPress={() => isEditing && handleFieldChange('gender', 'male')}
                disabled={!isEditing}
              >
                <Text style={[
                  styles.genderButtonText,
                  profileData.gender === 'male' && styles.genderButtonTextActive
                ]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  profileData.gender === 'female' && styles.genderButtonActive
                ]}
                onPress={() => isEditing && handleFieldChange('gender', 'female')}
                disabled={!isEditing}
              >
                <Text style={[
                  styles.genderButtonText,
                  profileData.gender === 'female' && styles.genderButtonTextActive
                ]}>
                  Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  profileData.gender === 'other' && styles.genderButtonActive
                ]}
                onPress={() => isEditing && handleFieldChange('gender', 'other')}
                disabled={!isEditing}
              >
                <Text style={[
                  styles.genderButtonText,
                  profileData.gender === 'other' && styles.genderButtonTextActive
                ]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.dateOfBirth}
              onChangeText={(value) => handleFieldChange('dateOfBirth', value)}
              editable={isEditing}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Edit/Save Buttons */}
          {isEditing ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile}>
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          {renderCurrencyRow()}

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color="#0ea5e9" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Notifications</Text>
              <Text style={styles.menuItemSubtitle}>Manage your notification preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Legal', { url: 'https://www.jetsetterss.com/privacy-policy', title: 'Privacy Policy' })}
          >
            <Ionicons name="shield-outline" size={24} color="#0ea5e9" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Privacy Policy</Text>
              <Text style={styles.menuItemSubtitle}>How we handle your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Legal', { url: 'https://www.jetsetterss.com/terms-conditions', title: 'Terms & Conditions' })}
          >
            <Ionicons name="document-text-outline" size={24} color="#0ea5e9" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Terms & Conditions</Text>
              <Text style={styles.menuItemSubtitle}>Our terms of service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Legal', { url: 'https://www.jetsetterss.com/contact', title: 'Help & Support' })}
          >
            <Ionicons name="help-circle-outline" size={24} color="#0ea5e9" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Help & Support</Text>
              <Text style={styles.menuItemSubtitle}>Get assistance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={24} color="#dc2626" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: '#dc2626' }]}>Delete Account</Text>
              <Text style={styles.menuItemSubtitle}>Permanently delete your account & data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#dc2626" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <>
      {isAuthenticated ? renderAuthenticatedView() : renderGuestView()}
      {renderCurrencyModal()}
    </>
  );
};

export default ProfileScreen;
