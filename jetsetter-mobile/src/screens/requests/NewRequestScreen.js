import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RequestService from '../../services/RequestService';
import { COLORS } from '../../constants/config';

const tripTypes = ['flight', 'hotel', 'cruise', 'package', 'custom'];

const NewRequestScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState({ field: null, visible: false });

  const [inquiryType, setInquiryType] = useState('flight');
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_country: '',
    special_requirements: '',
    budget_range: '',
    preferred_contact_method: 'email',
    flight_origin: '',
    flight_destination: '',
    flight_departure_date: '',
    flight_return_date: '',
    flight_passengers: '1',
    flight_class: 'economy',
    hotel_destination: '',
    hotel_checkin_date: '',
    hotel_checkout_date: '',
    hotel_rooms: '1',
    hotel_guests: '1',
    hotel_room_type: '',
    cruise_destination: '',
    cruise_departure_date: '',
    cruise_duration: '7',
    cruise_cabin_type: '',
    cruise_passengers: '1',
    package_destination: '',
    package_start_date: '',
    package_end_date: '',
    package_travelers: '1',
    package_budget_range: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData(prev => ({
          ...prev,
          customer_name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email?.split('@')[0] || '',
          customer_email: user.email || '',
        }));
      }
    } catch (error) {
      console.log('Could not load user info:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDateChange = (event, selectedDate, field) => {
    setShowDatePicker({ field: null, visible: false });
    if (event.type === 'set' && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      handleChange(field, dateStr);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    }
    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Invalid email format';
    }
    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Phone is required';
    }

    if (inquiryType === 'flight') {
      if (!formData.flight_origin.trim()) newErrors.flight_origin = 'Origin is required';
      if (!formData.flight_destination.trim()) newErrors.flight_destination = 'Destination is required';
      if (!formData.flight_departure_date) newErrors.flight_departure_date = 'Departure date is required';
    } else if (inquiryType === 'hotel') {
      if (!formData.hotel_destination.trim()) newErrors.hotel_destination = 'Destination is required';
      if (!formData.hotel_checkin_date) newErrors.hotel_checkin_date = 'Check-in date is required';
      if (!formData.hotel_checkout_date) newErrors.hotel_checkout_date = 'Check-out date is required';
    } else if (inquiryType === 'cruise') {
      if (!formData.cruise_destination.trim()) newErrors.cruise_destination = 'Destination is required';
      if (!formData.cruise_departure_date) newErrors.cruise_departure_date = 'Departure date is required';
    } else if (inquiryType === 'package') {
      if (!formData.package_destination.trim()) newErrors.package_destination = 'Destination is required';
      if (!formData.package_start_date) newErrors.package_start_date = 'Start date is required';
      if (!formData.package_end_date) newErrors.package_end_date = 'End date is required';
    }
    // 'custom' (General Inquiry) has no required type-specific fields

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTypeSpecificData = () => {
    switch (inquiryType) {
      case 'flight':
        return {
          flight_origin: formData.flight_origin,
          flight_destination: formData.flight_destination,
          flight_departure_date: formData.flight_departure_date,
          flight_return_date: formData.flight_return_date || null,
          flight_passengers: parseInt(formData.flight_passengers) || 1,
          flight_class: formData.flight_class,
        };
      case 'hotel':
        return {
          hotel_destination: formData.hotel_destination,
          hotel_checkin_date: formData.hotel_checkin_date,
          hotel_checkout_date: formData.hotel_checkout_date,
          hotel_rooms: parseInt(formData.hotel_rooms) || 1,
          hotel_guests: parseInt(formData.hotel_guests) || 1,
          hotel_room_type: formData.hotel_room_type,
        };
      case 'cruise':
        return {
          cruise_destination: formData.cruise_destination,
          cruise_departure_date: formData.cruise_departure_date,
          cruise_duration: parseInt(formData.cruise_duration) || 7,
          cruise_cabin_type: formData.cruise_cabin_type,
          cruise_passengers: parseInt(formData.cruise_passengers) || 1,
        };
      case 'package':
        return {
          package_destination: formData.package_destination,
          package_start_date: formData.package_start_date,
          package_end_date: formData.package_end_date,
          package_travelers: parseInt(formData.package_travelers) || 1,
          package_budget_range: formData.package_budget_range,
        };
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);
    try {
      const inquiryData = {
        inquiry_type: inquiryType,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_country: formData.customer_country || null,
        special_requirements: formData.special_requirements || null,
        budget_range: formData.budget_range || null,
        preferred_contact_method: formData.preferred_contact_method,
        ...getTypeSpecificData(),
      };

      const result = await RequestService.createRequest(inquiryData);
      
      console.log('📥 Received result from RequestService:', JSON.stringify(result, null, 2));
      console.log('🔍 Checking result.success:', result.success);
      console.log('🔍 Checking result.data?.inquiry:', result.data?.inquiry);

      // Handle success - check multiple possible response structures
      const inquiry = result.data?.inquiry || result.inquiry || result.data;
      const inquiryId = inquiry?.id || result.data?.id || result.id;

      console.log('✅ Success check passed:', result.success && inquiry);
      console.log('🆔 Inquiry ID:', inquiryId);

      if (result.success && inquiry) {
        console.log('✅ Request submitted successfully!');
        console.log('📢 Showing success alert...');
        
        // Show success message
        if (Platform.OS === 'web') {
          // On web, show alert and navigate immediately
          alert('Request Submitted!\n\nYour inquiry has been submitted successfully! Our travel experts will get back to you within 24 hours.');
          console.log('🔙 Navigating back (web)...');
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MyTrips');
          }
        } else {
          // On mobile, use Alert.alert with navigation
          Alert.alert(
            'Request Submitted',
            'Your inquiry has been submitted successfully! Our travel experts will get back to you within 24 hours.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('🔙 Navigating back after OK...');
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('MyTrips');
                  }
                },
              },
            ],
            { cancelable: false }
          );
        }
      } else {
        console.error('❌ Success check failed:', { success: result.success, hasInquiry: !!inquiry });
        throw new Error(result.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFlightFields = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Origin *</Text>
        <TextInput
          style={[styles.input, errors.flight_origin && styles.inputError]}
          placeholder="e.g., JFK, New York"
          value={formData.flight_origin}
          onChangeText={(value) => handleChange('flight_origin', value)}
        />
        {errors.flight_origin && <Text style={styles.errorText}>{errors.flight_origin}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Destination *</Text>
        <TextInput
          style={[styles.input, errors.flight_destination && styles.inputError]}
          placeholder="e.g., LAX, Los Angeles"
          value={formData.flight_destination}
          onChangeText={(value) => handleChange('flight_destination', value)}
        />
        {errors.flight_destination && <Text style={styles.errorText}>{errors.flight_destination}</Text>}
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Departure Date *</Text>
          <TouchableOpacity
            style={[styles.input, errors.flight_departure_date && styles.inputError]}
            onPress={() => setShowDatePicker({ field: 'flight_departure_date', visible: true })}
          >
            <Text style={styles.dateText}>
              {formData.flight_departure_date || 'Select date'}
            </Text>
          </TouchableOpacity>
          {errors.flight_departure_date && (
            <Text style={styles.errorText}>{errors.flight_departure_date}</Text>
          )}
        </View>

        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Return Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker({ field: 'flight_return_date', visible: true })}
          >
            <Text style={styles.dateText}>
              {formData.flight_return_date || 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Passengers *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.flight_passengers}
            onChangeText={(value) => handleChange('flight_passengers', value)}
          />
        </View>

        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Class</Text>
          <View style={styles.pickerContainer}>
            {['economy', 'premium_economy', 'business', 'first'].map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[
                  styles.pickerOption,
                  formData.flight_class === cls && styles.pickerOptionActive,
                ]}
                onPress={() => handleChange('flight_class', cls)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    formData.flight_class === cls && styles.pickerOptionTextActive,
                  ]}
                >
                  {cls.charAt(0).toUpperCase() + cls.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </>
  );

  const renderHotelFields = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Destination *</Text>
        <TextInput
          style={[styles.input, errors.hotel_destination && styles.inputError]}
          placeholder="e.g., Paris, France"
          value={formData.hotel_destination}
          onChangeText={(value) => handleChange('hotel_destination', value)}
        />
        {errors.hotel_destination && <Text style={styles.errorText}>{errors.hotel_destination}</Text>}
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Check-in Date *</Text>
          <TouchableOpacity
            style={[styles.input, errors.hotel_checkin_date && styles.inputError]}
            onPress={() => setShowDatePicker({ field: 'hotel_checkin_date', visible: true })}
          >
            <Text style={styles.dateText}>
              {formData.hotel_checkin_date || 'Select date'}
            </Text>
          </TouchableOpacity>
          {errors.hotel_checkin_date && (
            <Text style={styles.errorText}>{errors.hotel_checkin_date}</Text>
          )}
        </View>

        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Check-out Date *</Text>
          <TouchableOpacity
            style={[styles.input, errors.hotel_checkout_date && styles.inputError]}
            onPress={() => setShowDatePicker({ field: 'hotel_checkout_date', visible: true })}
          >
            <Text style={styles.dateText}>
              {formData.hotel_checkout_date || 'Select date'}
            </Text>
          </TouchableOpacity>
          {errors.hotel_checkout_date && (
            <Text style={styles.errorText}>{errors.hotel_checkout_date}</Text>
          )}
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Rooms *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.hotel_rooms}
            onChangeText={(value) => handleChange('hotel_rooms', value)}
          />
        </View>

        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Guests *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.hotel_guests}
            onChangeText={(value) => handleChange('hotel_guests', value)}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Room Type</Text>
        <View style={styles.pickerContainer}>
          {['standard', 'deluxe', 'suite', 'penthouse'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pickerOption,
                formData.hotel_room_type === type && styles.pickerOptionActive,
              ]}
              onPress={() => handleChange('hotel_room_type', type)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formData.hotel_room_type === type && styles.pickerOptionTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderCruiseFields = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Destination *</Text>
        <TextInput
          style={[styles.input, errors.cruise_destination && styles.inputError]}
          placeholder="e.g., Caribbean, Mediterranean"
          value={formData.cruise_destination}
          onChangeText={(value) => handleChange('cruise_destination', value)}
        />
        {errors.cruise_destination && <Text style={styles.errorText}>{errors.cruise_destination}</Text>}
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Departure Date *</Text>
          <TouchableOpacity
            style={[styles.input, errors.cruise_departure_date && styles.inputError]}
            onPress={() => setShowDatePicker({ field: 'cruise_departure_date', visible: true })}
          >
            <Text style={styles.dateText}>
              {formData.cruise_departure_date || 'Select date'}
            </Text>
          </TouchableOpacity>
          {errors.cruise_departure_date && (
            <Text style={styles.errorText}>{errors.cruise_departure_date}</Text>
          )}
        </View>

        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Duration (days) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.cruise_duration}
            onChangeText={(value) => handleChange('cruise_duration', value)}
            placeholder="7"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Passengers *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.cruise_passengers}
            onChangeText={(value) => handleChange('cruise_passengers', value)}
          />
        </View>

        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Cabin Type</Text>
          <View style={styles.pickerContainer}>
            {['interior', 'oceanview', 'balcony', 'suite'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  formData.cruise_cabin_type === type && styles.pickerOptionActive,
                ]}
                onPress={() => handleChange('cruise_cabin_type', type)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    formData.cruise_cabin_type === type && styles.pickerOptionTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </>
  );

  const renderPackageFields = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Destination *</Text>
        <TextInput
          style={[styles.input, errors.package_destination && styles.inputError]}
          placeholder="e.g., Bali, Indonesia"
          value={formData.package_destination}
          onChangeText={(value) => handleChange('package_destination', value)}
        />
        {errors.package_destination && <Text style={styles.errorText}>{errors.package_destination}</Text>}
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Start Date *</Text>
          <TouchableOpacity
            style={[styles.input, errors.package_start_date && styles.inputError]}
            onPress={() => setShowDatePicker({ field: 'package_start_date', visible: true })}
          >
            <Text style={styles.dateText}>
              {formData.package_start_date || 'Select date'}
            </Text>
          </TouchableOpacity>
          {errors.package_start_date && (
            <Text style={styles.errorText}>{errors.package_start_date}</Text>
          )}
        </View>

        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>End Date *</Text>
          <TouchableOpacity
            style={[styles.input, errors.package_end_date && styles.inputError]}
            onPress={() => setShowDatePicker({ field: 'package_end_date', visible: true })}
          >
            <Text style={styles.dateText}>
              {formData.package_end_date || 'Select date'}
            </Text>
          </TouchableOpacity>
          {errors.package_end_date && (
            <Text style={styles.errorText}>{errors.package_end_date}</Text>
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Travelers *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.package_travelers}
          onChangeText={(value) => handleChange('package_travelers', value)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Budget Range</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., $2000 - $5000"
          value={formData.package_budget_range}
          onChangeText={(value) => handleChange('package_budget_range', value)}
        />
      </View>
    </>
  );

  const renderCommonFields = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, errors.customer_name && styles.inputError]}
          placeholder="Enter your full name"
          value={formData.customer_name}
          onChangeText={(value) => handleChange('customer_name', value)}
        />
        {errors.customer_name && <Text style={styles.errorText}>{errors.customer_name}</Text>}
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={[styles.input, errors.customer_email && styles.inputError]}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.customer_email}
            onChangeText={(value) => handleChange('customer_email', value)}
          />
          {errors.customer_email && <Text style={styles.errorText}>{errors.customer_email}</Text>}
        </View>

        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.customer_phone && styles.inputError]}
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
            value={formData.customer_phone}
            onChangeText={(value) => handleChange('customer_phone', value)}
          />
          {errors.customer_phone && <Text style={styles.errorText}>{errors.customer_phone}</Text>}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Country</Text>
        <TextInput
          style={styles.input}
          placeholder="Your country"
          value={formData.customer_country}
          onChangeText={(value) => handleChange('customer_country', value)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Budget Range</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., $1000 - $2000"
          value={formData.budget_range}
          onChangeText={(value) => handleChange('budget_range', value)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Special Requirements</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any special requests or requirements..."
          multiline
          numberOfLines={4}
          value={formData.special_requirements}
          onChangeText={(value) => handleChange('special_requirements', value)}
        />
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>What type of travel are you interested in?</Text>
          <View style={styles.typeSelector}>
            {tripTypes.map((type) => {
              const typeConfig = {
                flight: { icon: 'airplane', label: 'Flight Tickets', desc: 'Book domestic or international flights.' },
                hotel: { icon: 'bed', label: 'Hotel Accommodation', desc: 'Find the perfect place to stay.' },
                cruise: { icon: 'boat', label: 'Cruise Vacation', desc: 'Luxury cruise experiences.' },
                package: { icon: 'briefcase', label: 'Vacation Packages', desc: 'Complete travel packages.' },
                custom: { icon: 'chatbubbles', label: 'General Inquiry', desc: 'Other travel questions.' },
              };
              const config = typeConfig[type] || typeConfig.custom;
              const isActive = inquiryType === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeCard,
                    isActive && styles.typeCardActive,
                  ]}
                  onPress={() => setInquiryType(type)}
                >
                  <View style={styles.typeCardContent}>
                    <View style={[styles.typeIconContainer, isActive && styles.typeIconContainerActive]}>
                      <Ionicons name={config.icon} size={24} color={isActive ? '#FFFFFF' : COLORS.PRIMARY} />
                    </View>
                    <View style={styles.typeCardText}>
                      <Text style={[styles.typeCardLabel, isActive && styles.typeCardLabelActive]}>
                        {config.label}
                      </Text>
                      <Text style={[styles.typeCardDesc, isActive && styles.typeCardDescActive]}>
                        {config.desc}
                      </Text>
                    </View>
                    <View style={[styles.radioButton, isActive && styles.radioButtonActive]}>
                      {isActive && <View style={styles.radioButtonInner} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Contact Information</Text>
          {inquiryType === 'flight' && renderFlightFields()}
          {inquiryType === 'hotel' && renderHotelFields()}
          {inquiryType === 'cruise' && renderCruiseFields()}
          {inquiryType === 'package' && renderPackageFields()}
          {renderCommonFields()}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker.visible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) =>
            handleDateChange(event, date, showDatePicker.field)
          }
          minimumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },
  typeSelector: {
    marginBottom: 24,
    gap: 12,
  },
  typeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  typeCardActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#eff6ff',
  },
  typeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconContainerActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  typeCardText: {
    flex: 1,
  },
  typeCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  typeCardLabelActive: {
    color: COLORS.PRIMARY,
  },
  typeCardDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  typeCardDescActive: {
    color: '#374151',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: COLORS.PRIMARY,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  pickerOptionActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  pickerOptionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  pickerOptionTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
};

export default NewRequestScreen;



