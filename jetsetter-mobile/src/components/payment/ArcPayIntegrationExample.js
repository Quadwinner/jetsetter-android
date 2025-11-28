/**
 * ARC Pay Integration Example
 * 
 * This file demonstrates how to integrate the ARC Pay payment system
 * into existing booking screens like FlightPaymentScreen, HotelPaymentScreen, etc.
 * 
 * There are two ways to use ARC Pay:
 * 
 * 1. Using the useArcPayment hook (Recommended)
 * 2. Direct navigation to ArcPaymentScreen
 */

import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import useArcPayment from '../utils/useArcPayment';

// ============================================
// EXAMPLE 1: Using the useArcPayment hook
// ============================================

export const ExampleWithHook = ({ quoteId, amount }) => {
  const { initiatePayment, isProcessing } = useArcPayment();

  const handlePayment = () => {
    initiatePayment({
      quoteId: quoteId,
      bookingType: 'flight',
      amount: amount,
      currency: 'USD',
      title: 'Flight Booking',
      onSuccess: (result) => {
        console.log('Payment successful!', result);
        // Handle success - e.g., update local state, show notification
      },
      onFailed: (error) => {
        console.log('Payment failed:', error);
        // Handle failure - e.g., show error message
      },
    });
  };

  return (
    <TouchableOpacity 
      onPress={handlePayment}
      disabled={isProcessing}
      style={{
        backgroundColor: isProcessing ? '#ccc' : '#1e40af',
        padding: 16,
        borderRadius: 12,
      }}
    >
      <Text style={{ color: '#fff', textAlign: 'center' }}>
        {isProcessing ? 'Processing...' : `Pay $${amount}`}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================
// EXAMPLE 2: Direct navigation
// ============================================

export const ExampleDirectNavigation = ({ navigation, quoteId, amount }) => {
  const handlePayment = () => {
    // Navigate directly to ArcPaymentScreen
    navigation.navigate('ArcPayment', {
      quoteId: quoteId,
      bookingType: 'hotel',
      amount: amount,
      currency: 'USD',
      title: 'Hotel Reservation',
      // Optional: Custom screens for success/failure
      returnScreen: 'HotelConfirmation', // Or any screen name
      failedScreen: 'PaymentFailed',
    });
  };

  return (
    <TouchableOpacity 
      onPress={handlePayment}
      style={{
        backgroundColor: '#1e40af',
        padding: 16,
        borderRadius: 12,
      }}
    >
      <Text style={{ color: '#fff', textAlign: 'center' }}>
        Pay ${amount}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================
// EXAMPLE 3: Convenience methods
// ============================================

export const ExampleConvenienceMethods = ({ quoteId, amount }) => {
  const { payForFlight, payForHotel, payForCruise, payForPackage } = useArcPayment();

  return (
    <View>
      {/* For flights */}
      <TouchableOpacity onPress={() => payForFlight(quoteId, amount)}>
        <Text>Pay for Flight</Text>
      </TouchableOpacity>

      {/* For hotels */}
      <TouchableOpacity onPress={() => payForHotel(quoteId, amount)}>
        <Text>Pay for Hotel</Text>
      </TouchableOpacity>

      {/* For cruises */}
      <TouchableOpacity onPress={() => payForCruise(quoteId, amount)}>
        <Text>Pay for Cruise</Text>
      </TouchableOpacity>

      {/* For packages */}
      <TouchableOpacity onPress={() => payForPackage(quoteId, amount)}>
        <Text>Pay for Package</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// EXAMPLE 4: Integration with existing payment screen
// ============================================

/**
 * To integrate with existing FlightPaymentScreen.js:
 * 
 * 1. Import the hook:
 *    import useArcPayment from '../../utils/useArcPayment';
 * 
 * 2. In your component:
 *    const { initiatePayment, isProcessing } = useArcPayment({
 *      onSuccessScreen: 'FlightConfirmation',
 *      onFailedScreen: 'PaymentFailed',
 *    });
 * 
 * 3. In your handlePayment function:
 *    
 *    // First create a quote/order in your backend
 *    const quoteResult = await createQuote({
 *      flightOffers: [selectedFlight],
 *      travelers: formattedTravelers,
 *      contactEmail,
 *      contactPhone,
 *    });
 *    
 *    if (quoteResult.success && quoteResult.quoteId) {
 *      // Then initiate ARC Pay payment
 *      initiatePayment({
 *        quoteId: quoteResult.quoteId,
 *        bookingType: 'flight',
 *        amount: parseFloat(price),
 *        currency: currency,
 *        title: `Flight: ${origin} → ${destination}`,
 *      });
 *    }
 */

// ============================================
// TEST CARDS FOR ARC PAY
// ============================================

/**
 * Test Cards for ARC Pay (Test Environment)
 * 
 * | Card Number        | Type       | 3DS Behavior    | Expected Result |
 * |-------------------|------------|-----------------|-----------------|
 * | 5123456789012346  | Mastercard | ✅ Frictionless | Approved        |
 * | 4440000042200014  | Visa       | ✅ Frictionless | Approved        |
 * | 5123450000000008  | Mastercard | 🔐 Challenge    | Approved (OTP)  |
 * | 2223000000000007  | Mastercard | 🔐 Challenge    | Approved (OTP)  |
 * | 4440000009900010  | Visa       | 🔐 Challenge    | Approved (OTP)  |
 * 
 * Test Details:
 * - Expiry Date: Use 01/39 for all test cards
 * - CVV: Any 3 digits (e.g., 100, 123)
 * - OTP for Challenge: Any 6 digits (e.g., 123456)
 * - Cardholder Name: Any name
 */

export const ARC_PAY_TEST_CARDS = {
  MASTERCARD_FRICTIONLESS: {
    number: '5123456789012346',
    expiry: '01/39',
    cvv: '100',
    name: 'Test User',
  },
  VISA_FRICTIONLESS: {
    number: '4440000042200014',
    expiry: '01/39',
    cvv: '100',
    name: 'Test User',
  },
  MASTERCARD_CHALLENGE: {
    number: '5123450000000008',
    expiry: '01/39',
    cvv: '100',
    name: 'Test User',
    otp: '123456',
  },
  VISA_CHALLENGE: {
    number: '4440000009900010',
    expiry: '01/39',
    cvv: '100',
    name: 'Test User',
    otp: '123456',
  },
};

export default {
  ExampleWithHook,
  ExampleDirectNavigation,
  ExampleConvenienceMethods,
  ARC_PAY_TEST_CARDS,
};
