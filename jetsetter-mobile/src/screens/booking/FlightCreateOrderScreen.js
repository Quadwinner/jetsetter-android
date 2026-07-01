import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import flightService from '../../services/flightService';
import { THEME } from '../../constants/flightConstants';

export default function FlightCreateOrderScreen({ route, navigation }) {
  const { orderId, transactionId, bookingData: passedData } = route.params || {};
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [pnr, setPnr] = useState('');
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    processOrder();
  }, []);

  const processOrder = async () => {
    try {
      // Get pending booking from AsyncStorage if not passed
      const bookingData = passedData || await flightService.getPendingBookingLocal();
      if (!bookingData) throw new Error('Booking data not found');

      const { selectedFlight, passengers, contactEmail, contactPhone, fareBreakdown } = bookingData;

      const formattedTravelers = passengers.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dob,
        gender: p.gender,
        mobile: p.phone || contactPhone,
        email: p.email || contactEmail,
        nationality: p.nationality || 'US',
        passportNumber: p.passportNumber || '',
        passportExpiry: p.passportExpiry || '',
        documentType: 'PASSPORT',
        requiresWheelchair: false,
      }));

      const result = await flightService.createOrder({
        flightOffer: selectedFlight,
        travelers: formattedTravelers,
        contactInfo: { email: contactEmail, countryCode: '+1', phoneNumber: contactPhone },
        totalAmount: parseFloat(fareBreakdown?.totalAmount || 0),
        transactionId: transactionId || '',
        orderId: orderId || bookingData.orderId,
        fareBreakdown,
      });

      if (result.success) {
        await flightService.clearPendingBooking();
        setBookingRef(result.data?.bookingReference || result.bookingReference || orderId);
        setPnr(result.data?.pnr || result.pnr || '');
        setStatus('success');

        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50 }).start();

        setTimeout(() => {
          navigation.replace('FlightSuccess', {
            bookingRef: result.data?.bookingReference || result.bookingReference || orderId,
            pnr: result.data?.pnr || result.pnr || '',
            bookingData,
            selectedFlight,
          });
        }, 2000);
      } else {
        throw new Error(result.message || 'Order creation failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Booking failed. Please contact support.');
      setStatus('error');
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {status === 'processing' && (
        <>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={s.title}>Processing your booking…</Text>
          <Text style={s.subtitle}>Please do not close the app</Text>
          <View style={s.progressBar}>
            <Animated.View style={[s.progressFill, { width: '70%' }]} />
          </View>
        </>
      )}

      {status === 'success' && (
        <>
          <Animated.View style={[s.successIcon, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="checkmark-circle" size={80} color={THEME.success} />
          </Animated.View>
          <Text style={s.title}>Booking Confirmed!</Text>
          <Text style={s.subtitle}>Redirecting to your e-ticket…</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <Ionicons name="close-circle" size={80} color={THEME.error} />
          <Text style={[s.title, { color: THEME.error }]}>Booking Failed</Text>
          <Text style={s.subtitle}>{errorMsg}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={processOrder}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.supportBtn} onPress={() => navigation.navigate('Cruise')}>
            <Text style={s.supportText}>Back to Home</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.pageBg, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: THEME.textPrimary, marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 14, color: THEME.textSecondary, marginTop: 8, textAlign: 'center' },
  progressBar: { width: '80%', height: 6, backgroundColor: THEME.border, borderRadius: 3, marginTop: 24, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: THEME.primary, borderRadius: 3 },
  successIcon: { alignItems: 'center' },
  retryBtn: { backgroundColor: THEME.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, marginTop: 24 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  supportBtn: { marginTop: 12, paddingVertical: 10 },
  supportText: { color: THEME.textSecondary, fontSize: 14 },
});
