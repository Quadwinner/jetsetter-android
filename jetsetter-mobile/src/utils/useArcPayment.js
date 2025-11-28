/**
 * useArcPayment Hook
 * 
 * Custom React hook to easily integrate ARC Pay payments
 * in any booking screen throughout the app.
 * 
 * Usage:
 * ```
 * const { initiatePayment, isProcessing } = useArcPayment();
 * 
 * const handlePay = () => {
 *   initiatePayment({
 *     quoteId: 'quote-123',
 *     bookingType: 'flight',
 *     amount: 599.99,
 *   });
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

/**
 * Hook for ARC Pay payment integration
 * @param {object} options - Hook options
 * @param {string} options.onSuccessScreen - Screen to navigate to on success (default: 'PaymentSuccess')
 * @param {string} options.onFailedScreen - Screen to navigate to on failure (default: 'PaymentFailed')
 * @returns {object} Payment functions and state
 */
const useArcPayment = (options = {}) => {
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    onSuccessScreen = 'PaymentSuccess',
    onFailedScreen = 'PaymentFailed',
  } = options;

  /**
   * Initiate ARC Pay payment flow
   * @param {object} params - Payment parameters
   * @param {string} params.quoteId - Required: Quote ID to pay for
   * @param {string} params.bookingType - Type of booking (flight, hotel, cruise, package)
   * @param {number} params.amount - Amount to display (for reference)
   * @param {string} params.currency - Currency code (default: USD)
   * @param {string} params.title - Payment title to display
   * @param {string} params.inquiryId - Optional inquiry ID
   * @param {function} params.onSuccess - Callback on success
   * @param {function} params.onFailed - Callback on failure
   */
  const initiatePayment = useCallback((params) => {
    const {
      quoteId,
      bookingType = 'booking',
      amount,
      currency = 'USD',
      title = 'Payment',
      inquiryId,
      onSuccess,
      onFailed,
    } = params;

    if (!quoteId) {
      Alert.alert('Error', 'Quote ID is required to process payment');
      return;
    }

    setIsProcessing(true);

    // Navigate to ARC Payment screen
    navigation.navigate('ArcPayment', {
      quoteId,
      bookingType,
      amount,
      currency,
      title,
      inquiryId,
      onSuccess: (result) => {
        setIsProcessing(false);
        if (onSuccess) onSuccess(result);
      },
      onFailed: (error) => {
        setIsProcessing(false);
        if (onFailed) onFailed(error);
      },
      returnScreen: onSuccessScreen,
      failedScreen: onFailedScreen,
    });
  }, [navigation, onSuccessScreen, onFailedScreen]);

  /**
   * Quick payment for a known booking type
   */
  const payForFlight = useCallback((quoteId, amount, options = {}) => {
    initiatePayment({
      quoteId,
      amount,
      bookingType: 'flight',
      title: 'Flight Booking',
      ...options,
    });
  }, [initiatePayment]);

  const payForHotel = useCallback((quoteId, amount, options = {}) => {
    initiatePayment({
      quoteId,
      amount,
      bookingType: 'hotel',
      title: 'Hotel Reservation',
      ...options,
    });
  }, [initiatePayment]);

  const payForCruise = useCallback((quoteId, amount, options = {}) => {
    initiatePayment({
      quoteId,
      amount,
      bookingType: 'cruise',
      title: 'Cruise Booking',
      ...options,
    });
  }, [initiatePayment]);

  const payForPackage = useCallback((quoteId, amount, options = {}) => {
    initiatePayment({
      quoteId,
      amount,
      bookingType: 'package',
      title: 'Package Booking',
      ...options,
    });
  }, [initiatePayment]);

  return {
    initiatePayment,
    payForFlight,
    payForHotel,
    payForCruise,
    payForPackage,
    isProcessing,
  };
};

export default useArcPayment;
