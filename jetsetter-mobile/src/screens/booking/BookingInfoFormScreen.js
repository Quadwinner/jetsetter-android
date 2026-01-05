import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BookingInfoService from '../../services/BookingInfoService';
import { COLORS } from '../../constants/config';

const BookingInfoFormScreen = ({ route, navigation }) => {
  const { quoteId, inquiryType } = route.params;
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    passport_number: '',
    passport_expiry_date: '',
    passport_issue_date: '',
    passport_issuing_country: '',
    govt_id_type: '',
    govt_id_number: '',
    govt_id_issue_date: '',
    govt_id_expiry_date: '',
    govt_id_issuing_authority: '',
    govt_id_issuing_country: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    terms_accepted: false,
    privacy_policy_accepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  const isFlightBooking = inquiryType === 'flight';

  useEffect(() => {
    loadExistingBookingInfo();
  }, [quoteId]);

  const loadExistingBookingInfo = async () => {
    setLoading(true);
    try {
      const existing = await BookingInfoService.getBookingInfo(quoteId);
      if (existing) {
        setFormData({
          full_name: existing.full_name || '',
          email: existing.email || '',
          phone: existing.phone || '',
          date_of_birth: existing.date_of_birth || '',
          nationality: existing.nationality || '',
          passport_number: existing.passport_number || '',
          passport_expiry_date: existing.passport_expiry_date || '',
          passport_issue_date: existing.passport_issue_date || '',
          passport_issuing_country: existing.passport_issuing_country || '',
          govt_id_type: existing.govt_id_type || '',
          govt_id_number: existing.govt_id_number || '',
          govt_id_issue_date: existing.govt_id_issue_date || '',
          govt_id_expiry_date: existing.govt_id_expiry_date || '',
          govt_id_issuing_authority: existing.govt_id_issuing_authority || '',
          govt_id_issuing_country: existing.govt_id_issuing_country || '',
          emergency_contact_name: existing.emergency_contact_name || '',
          emergency_contact_phone: existing.emergency_contact_phone || '',
          emergency_contact_relationship: existing.emergency_contact_relationship || '',
          terms_accepted: existing.terms_accepted || false,
          privacy_policy_accepted: existing.privacy_policy_accepted || false,
        });
      }
    } catch (error) {
      console.error('Error loading booking info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && datePickerField) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      handleInputChange(datePickerField, dateStr);
    }
    if (Platform.OS === 'ios' && event.type === 'set') {
      setDatePickerField(null);
    }
  };

  const openDatePicker = (field) => {
    const currentValue = formData[field];
    if (currentValue) {
      setDatePickerValue(new Date(currentValue));
    } else {
      setDatePickerValue(new Date());
    }
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const validateForm = () => {
    if (!formData.full_name || !formData.email || !formData.phone) {
      Alert.alert('Validation Error', 'Please fill in all required personal information fields.');
      return false;
    }

    if (!formData.govt_id_type || !formData.govt_id_number) {
      Alert.alert('Validation Error', 'Government ID information is required for all bookings.');
      return false;
    }

    if (isFlightBooking && (!formData.passport_number || !formData.passport_expiry_date)) {
      Alert.alert('Validation Error', 'Passport information is required for flight bookings.');
      return false;
    }

    if (!formData.terms_accepted || !formData.privacy_policy_accepted) {
      Alert.alert('Validation Error', 'Please accept the terms and conditions and privacy policy.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const result = await BookingInfoService.saveBookingInfo(quoteId, formData);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Booking information saved successfully. You can now proceed to payment.',
          [
            {
              text: 'Continue to Payment',
              onPress: () => {
                navigation.goBack();
                if (route.params.onComplete) {
                  route.params.onComplete(result.data);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving booking info:', error);
      Alert.alert('Error', error.message || 'Failed to save booking information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading booking information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Information</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Complete Your Booking Information</Text>
            <Text style={styles.subtitle}>
              Please provide your travel information and documents to proceed with payment.
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.full_name}
                onChangeText={(value) => handleInputChange('full_name', value)}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => openDatePicker('date_of_birth')}
              >
                <Text style={formData.date_of_birth ? styles.dateText : styles.datePlaceholder}>
                  {formData.date_of_birth || 'Select date of birth'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nationality</Text>
              <TextInput
                style={styles.input}
                value={formData.nationality}
                onChangeText={(value) => handleInputChange('nationality', value)}
                placeholder="Enter your nationality"
              />
            </View>
          </View>

          {/* Government ID Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Government ID Information <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID Type <Text style={styles.required}>*</Text></Text>
              <View style={styles.selectOptions}>
                {['drivers_license', 'national_id', 'passport', 'other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.selectOption,
                      formData.govt_id_type === type && styles.selectOptionActive,
                    ]}
                    onPress={() => handleInputChange('govt_id_type', type)}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.govt_id_type === type && styles.selectOptionTextActive,
                      ]}
                    >
                      {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID Number <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.govt_id_number}
                onChangeText={(value) => handleInputChange('govt_id_number', value)}
                placeholder="Enter government ID number"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Issue Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => openDatePicker('govt_id_issue_date')}
              >
                <Text
                  style={
                    formData.govt_id_issue_date ? styles.dateText : styles.datePlaceholder
                  }
                >
                  {formData.govt_id_issue_date || 'Select issue date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expiry Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => openDatePicker('govt_id_expiry_date')}
              >
                <Text
                  style={
                    formData.govt_id_expiry_date ? styles.dateText : styles.datePlaceholder
                  }
                >
                  {formData.govt_id_expiry_date || 'Select expiry date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Issuing Authority</Text>
              <TextInput
                style={styles.input}
                value={formData.govt_id_issuing_authority}
                onChangeText={(value) => handleInputChange('govt_id_issuing_authority', value)}
                placeholder="e.g., DMV, Passport Office"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Issuing Country</Text>
              <TextInput
                style={styles.input}
                value={formData.govt_id_issuing_country}
                onChangeText={(value) => handleInputChange('govt_id_issuing_country', value)}
                placeholder="Enter issuing country"
              />
            </View>
          </View>

          {/* Passport Information (Only for Flights) */}
          {isFlightBooking && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Passport Information <Text style={styles.required}>*</Text>
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Passport Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.passport_number}
                  onChangeText={(value) => handleInputChange('passport_number', value)}
                  placeholder="Enter passport number"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Passport Expiry Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => openDatePicker('passport_expiry_date')}
                >
                  <Text
                    style={
                      formData.passport_expiry_date ? styles.dateText : styles.datePlaceholder
                    }
                  >
                    {formData.passport_expiry_date || 'Select expiry date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passport Issue Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => openDatePicker('passport_issue_date')}
                >
                  <Text
                    style={
                      formData.passport_issue_date ? styles.dateText : styles.datePlaceholder
                    }
                  >
                    {formData.passport_issue_date || 'Select issue date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Issuing Country</Text>
                <TextInput
                  style={styles.input}
                  value={formData.passport_issuing_country}
                  onChangeText={(value) => handleInputChange('passport_issuing_country', value)}
                  placeholder="Enter issuing country"
                />
              </View>
            </View>
          )}

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={formData.emergency_contact_name}
                onChangeText={(value) => handleInputChange('emergency_contact_name', value)}
                placeholder="Enter emergency contact name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.emergency_contact_phone}
                onChangeText={(value) => handleInputChange('emergency_contact_phone', value)}
                placeholder="Enter emergency contact phone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={formData.emergency_contact_relationship}
                onChangeText={(value) =>
                  handleInputChange('emergency_contact_relationship', value)
                }
                placeholder="e.g., Spouse, Parent, Friend"
              />
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms and Conditions</Text>

            <View style={styles.checkboxGroup}>
              <Switch
                value={formData.terms_accepted}
                onValueChange={(value) => handleInputChange('terms_accepted', value)}
                trackColor={{ false: '#d1d5db', true: COLORS.PRIMARY }}
                thumbColor={formData.terms_accepted ? '#fff' : '#f4f3f4'}
              />
              <View style={styles.checkboxLabel}>
                <Text style={styles.checkboxText}>
                  I accept the terms and conditions <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.checkboxSubtext}>
                  By accepting, you agree to our booking terms and conditions for travel services.
                </Text>
              </View>
            </View>

            <View style={styles.checkboxGroup}>
              <Switch
                value={formData.privacy_policy_accepted}
                onValueChange={(value) => handleInputChange('privacy_policy_accepted', value)}
                trackColor={{ false: '#d1d5db', true: COLORS.PRIMARY }}
                thumbColor={formData.privacy_policy_accepted ? '#fff' : '#f4f3f4'}
              />
              <View style={styles.checkboxLabel}>
                <Text style={styles.checkboxText}>
                  I accept the privacy policy <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.checkboxSubtext}>
                  By accepting, you consent to the collection and use of your personal information.
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, saving && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Save & Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={datePickerField === 'date_of_birth' ? new Date() : undefined}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  required: {
    color: '#ef4444',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  selectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  selectOptionActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  selectOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  checkboxGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  checkboxSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 16,
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingInfoFormScreen;







