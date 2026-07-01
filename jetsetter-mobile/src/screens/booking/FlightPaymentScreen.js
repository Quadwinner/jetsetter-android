import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import flightService from '../../services/flightService';
import quoteService from '../../services/quoteService';
import useArcPayment from '../../utils/useArcPayment';
import styles from './styles/FlightPaymentScreen.styles';

const FlightPaymentScreen = ({ route, navigation }) => {
  const { selectedFlight, searchParams } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const { payForFlight, isProcessing } = useArcPayment();

  // Initialize travelers array based on search params
  const initializeTravelers = () => {
    return Array.from({ length: searchParams.travelers }, (_, index) => ({
      id: (index + 1).toString(),
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phone: '',
    }));
  };

  const [travelers, setTravelers] = useState(initializeTravelers());
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const updateTraveler = (index, field, value) => {
    const updatedTravelers = [...travelers];
    updatedTravelers[index][field] = value;
    setTravelers(updatedTravelers);
  };

  const validateForm = () => {
    // Validate travelers
    for (let i = 0; i < travelers.length; i++) {
      const traveler = travelers[i];
      if (!traveler.firstName || !traveler.lastName || !traveler.dateOfBirth || !traveler.gender) {
        Alert.alert('Missing Information', `Please fill in all required fields for Traveler ${i + 1}`);
        return false;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(traveler.dateOfBirth)) {
        Alert.alert('Invalid Date', `Please enter date of birth in YYYY-MM-DD format for Traveler ${i + 1}`);
        return false;
      }

      // Validate gender
      if (!['MALE', 'FEMALE'].includes(traveler.gender.toUpperCase())) {
        Alert.alert('Invalid Gender', `Please enter MALE or FEMALE for Traveler ${i + 1}`);
        return false;
      }
    }

    // Validate contact info
    if (!contactEmail || !contactPhone) {
      Alert.alert('Missing Contact', 'Please provide contact email and phone number');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const price = selectedFlight.price?.total || '0';
      const totalAmount = parseFloat(price);
      const currency = selectedFlight.price?.currency || 'USD';

      console.log('✈️ Starting flight booking via ARC Pay quote flow...');
      console.log('Total Amount:', totalAmount);

      // Format travelers for backend quote / booking_details
      const formattedTravelers = travelers.map((traveler) => ({
        id: traveler.id,
        dateOfBirth: traveler.dateOfBirth,
        name: {
          firstName: traveler.firstName,
          lastName: traveler.lastName,
        },
        gender: traveler.gender.toUpperCase(),
        contact: {
          emailAddress: traveler.email || contactEmail,
          phones: [
            {
              deviceType: 'MOBILE',
              countryCallingCode: '1',
              number: traveler.phone || contactPhone,
            },
          ],
        },
      }));

      const itinerary = selectedFlight.itineraries?.[0];
      const firstSegmentLocal = itinerary?.segments?.[0];
      const lastSegmentLocal = itinerary?.segments?.[itinerary.segments.length - 1];

      const origin = firstSegmentLocal?.departure?.iataCode || 'Origin';
      const destination = lastSegmentLocal?.arrival?.iataCode || 'Destination';

      const breakdown = {
        base_fare: totalAmount,
        taxes: 0,
        fees: 0,
      };

      const quote = await quoteService.createQuoteForBooking({
        bookingType: 'flight',
        title: `Flight Booking - ${origin} to ${destination}`,
        description: 'Flight booking via mobile app',
        totalAmount,
        currency,
        breakdown,
        bookingDetails: {
          flight_offer: selectedFlight,
          travelers: formattedTravelers,
          contact_info: {
            email: contactEmail,
            phone: contactPhone,
          },
          search_params: searchParams,
        },
        customerEmail: contactEmail,
        customerName: `${travelers[0].firstName} ${travelers[0].lastName}`,
        customerPhone: contactPhone,
      });

      const quoteId = quote?.id;

      if (!quoteId) {
        throw new Error('Quote ID missing from server response');
      }

      console.log('✅ Quote created for booking:', quoteId);

      // Start ARC Pay hosted checkout using quoteId
      payForFlight(quoteId, totalAmount, {
        onSuccess: () => {
          // ArcPaymentScreen will handle navigation to success screen
        },
        onFailed: (errorMessage) => {
          Alert.alert(
            'Payment Failed',
            errorMessage || 'Unable to complete payment. Please try again.'
          );
        },
      });
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please try again.');
      console.error('Booking error:', error);
    }
  };

  const price = selectedFlight.price?.total || '0';
  const currency = selectedFlight.price?.currency || 'USD';
  const itinerary = selectedFlight.itineraries?.[0];
  const firstSegment = itinerary?.segments?.[0];
  const lastSegment = itinerary?.segments?.[itinerary.segments.length - 1];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Flight Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.routeRow}>
              <Text style={styles.airportCode}>{firstSegment?.departure?.iataCode}</Text>
              <Ionicons name="arrow-forward" size={20} color="#64748B" />
              <Text style={styles.airportCode}>{lastSegment?.arrival?.iataCode}</Text>
            </View>
            <Text style={styles.summaryText}>
              {flightService.formatDateTime(firstSegment?.departure?.at)}
            </Text>
            <Text style={styles.summaryText}>
              Duration: {flightService.formatDuration(itinerary?.duration)}
            </Text>
            <Text style={styles.priceText}>
              Total: {flightService.formatPrice(parseFloat(price), currency)}
            </Text>
          </View>
        </View>

        {/* Traveler Details */}
        {travelers.map((traveler, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>Traveler {index + 1}</Text>
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    value={traveler.firstName}
                    onChangeText={(text) => updateTraveler(index, 'firstName', text)}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    value={traveler.lastName}
                    onChangeText={(text) => updateTraveler(index, 'lastName', text)}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Date of Birth *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={traveler.dateOfBirth}
                    onChangeText={(text) => updateTraveler(index, 'dateOfBirth', text)}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Gender *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MALE / FEMALE"
                    value={traveler.gender}
                    onChangeText={(text) => updateTraveler(index, 'gender', text)}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <Text style={styles.label}>Email (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="john.doe@example.com"
                value={traveler.email}
                onChangeText={(text) => updateTraveler(index, 'email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="5551234567"
                value={traveler.phone}
                onChangeText={(text) => updateTraveler(index, 'phone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        ))}

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.form}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="5551234567"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Payment Information is handled via ARC Pay Hosted Checkout (no card capture here) */}

        {/* Important Notes */}
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#0890BC" />
            <Text style={styles.infoText}>
              Please ensure all traveler details match their government-issued ID or passport.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Book Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            {flightService.formatPrice(parseFloat(price), currency)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, (loading || isProcessing) && styles.bookButtonDisabled]}
          onPress={handlePayment}
          disabled={loading || isProcessing}
        >
          {loading || isProcessing ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.bookButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.bookButtonText}>Continue to ARC Pay</Text>
              <Ionicons name="lock-closed" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FlightPaymentScreen;
