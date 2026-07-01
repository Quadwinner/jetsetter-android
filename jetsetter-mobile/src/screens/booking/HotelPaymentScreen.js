import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import hotelService from '../../services/hotelService';
import quoteService from '../../services/quoteService';
import useArcPayment from '../../utils/useArcPayment';
import styles from './styles/HotelPaymentScreen.styles';

const HotelPaymentScreen = ({ route, navigation }) => {
  const { hotel, selectedOffer, searchParams, nights } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const { payForHotel, isProcessing } = useArcPayment();
  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const totalPrice = selectedOffer.price * nights;

  const validateForm = () => {
    // Validate guest details
    if (!guestDetails.firstName || !guestDetails.lastName || !guestDetails.email || !guestDetails.phone) {
      Alert.alert('Missing Information', 'Please fill in all guest details');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestDetails.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleCompleteBooking = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('🏨 Starting hotel booking via ARC Pay quote flow...');
      console.log('Total Amount:', totalPrice);

      const currency = selectedOffer.currency || 'USD';
      const quote = await quoteService.createQuoteForBooking({
        bookingType: 'hotel',
        title: `Hotel Reservation - ${hotel.name}`,
        description: `${selectedOffer.roomType} for ${nights} night${nights > 1 ? 's' : ''}`,
        totalAmount: totalPrice,
        currency,
        breakdown: {
          room_rate: selectedOffer.price,
          nights,
          taxes: 0,
          fees: 0,
        },
        bookingDetails: {
          hotel,
          selected_offer: selectedOffer,
          search_params: searchParams,
          nights,
          guest_details: guestDetails,
        },
        customerEmail: guestDetails.email,
        customerName: `${guestDetails.firstName} ${guestDetails.lastName}`,
        customerPhone: guestDetails.phone,
      });

      const quoteId = quote?.id;
      if (!quoteId) {
        throw new Error('Quote ID missing from server response');
      }

      setLoading(false);
      payForHotel(quoteId, totalPrice, {
        currency,
        onFailed: (errorMessage) => {
          Alert.alert(
            'Payment Failed',
            errorMessage || 'Unable to complete payment. Please try again.'
          );
        },
      });
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Booking error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guest Details</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <Text style={styles.roomType}>{selectedOffer.roomType}</Text>
            <Text style={styles.datesText}>
              {hotelService.formatDate(searchParams.checkInDate)} - {hotelService.formatDate(searchParams.checkOutDate)}
            </Text>
            <Text style={styles.nightsText}>{nights} night{nights > 1 ? 's' : ''} • {searchParams.adults} guest{searchParams.adults > 1 ? 's' : ''}</Text>
            <Text style={styles.priceText}>
              Total: {hotelService.formatPrice(totalPrice, selectedOffer.currency)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Information</Text>
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  value={guestDetails.firstName}
                  onChangeText={(text) => setGuestDetails({ ...guestDetails, firstName: text })}
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  value={guestDetails.lastName}
                  onChangeText={(text) => setGuestDetails({ ...guestDetails, lastName: text })}
                />
              </View>
            </View>

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="john.doe@example.com"
              value={guestDetails.email}
              onChangeText={(text) => setGuestDetails({ ...guestDetails, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="+1234567890"
              value={guestDetails.phone}
              onChangeText={(text) => setGuestDetails({ ...guestDetails, phone: text })}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoBox}>
            <Ionicons name="lock-closed" size={24} color="#10B981" />
            <Text style={styles.infoText}>
              Payment is completed on ARC Pay's secure hosted checkout. Card details are not collected or stored in this app.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#0890BC" />
            <Text style={styles.infoText}>{selectedOffer.cancellationPolicy}</Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            {hotelService.formatPrice(totalPrice, selectedOffer.currency)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, (loading || isProcessing) && styles.bookButtonDisabled]}
          onPress={handleCompleteBooking}
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

export default HotelPaymentScreen;
