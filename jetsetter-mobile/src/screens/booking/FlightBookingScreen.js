import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import flightService from '../../services/flightService';
import { ADDON_LIST, THEME } from '../../constants/flightConstants';
import { calculateFare, formatTime, parseDuration } from '../../utils/flightUtils';

export default function FlightBookingScreen({ route, navigation }) {
  const { selectedFlight, searchParams } = route.params;
  const insets = useSafeAreaInsets();
  const count = parseInt(searchParams?.travelers) || 1;

  const itinerary = selectedFlight?.itineraries?.[0];
  const segments = itinerary?.segments || [];
  const first = segments[0];
  const last = segments[segments.length - 1];

  const [passengers, setPassengers] = useState(
    Array.from({ length: count }, (_, i) => ({
      id: String(i + 1),
      firstName: '', lastName: '', dob: '', gender: 'MALE',
      email: '', phone: '', nationality: 'US',
      passportNumber: '', passportExpiry: '',
    }))
  );
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updatePassenger = (idx, field, val) => {
    const updated = [...passengers];
    updated[idx] = { ...updated[idx], [field]: val };
    setPassengers(updated);
  };

  const toggleAddon = (addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const fare = calculateFare(selectedFlight, count, selectedAddons, 0);
      const result = await flightService.validateCoupon(couponCode.trim(), parseFloat(fare.totalAmount), null);
      if (result.success) {
        setAppliedCoupon(result);
        Alert.alert('Coupon Applied!', `Saving $${result.discountAmount?.toFixed(2)}`);
      } else {
        Alert.alert('Invalid Coupon', result.message || 'Coupon not valid');
      }
    } catch {
      Alert.alert('Error', 'Could not validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    passengers.forEach((p, i) => {
      if (!p.firstName) errs[`${i}_firstName`] = 'Required';
      if (!p.lastName) errs[`${i}_lastName`] = 'Required';
      if (!p.dob) errs[`${i}_dob`] = 'Required';
      if (!p.phone) errs[`${i}_phone`] = 'Required';
    });
    if (!contactEmail || !/\S+@\S+\.\S+/.test(contactEmail)) errs.contactEmail = 'Valid email required';
    if (!contactPhone) errs.contactPhone = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceed = async () => {
    if (!validate()) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const fare = calculateFare(selectedFlight, count, selectedAddons, appliedCoupon?.discountAmount || 0);
      const orderId = flightService.generateOrderId();

      const bookingData = {
        orderId,
        selectedFlight,
        searchParams,
        passengers,
        contactEmail,
        contactPhone,
        selectedAddons,
        fareBreakdown: fare,
        appliedCoupon,
      };

      await flightService.storePendingBooking(bookingData);

      const result = await flightService.initiatePayment({
        amount: parseFloat(fare.totalAmount),
        currency: fare.currency,
        orderId,
        bookingType: 'flight',
        customerEmail: contactEmail,
        customerName: `${passengers[0].firstName} ${passengers[0].lastName}`,
        customerPhone: contactPhone,
        description: `Flight ${first?.departure?.iataCode} → ${last?.arrival?.iataCode}`,
        returnUrl: `jetsettermobile://payment/callback?orderId=${orderId}&bookingType=flight`,
        cancelUrl: `jetsettermobile://payment/cancel?orderId=${orderId}`,
        bookingData,
        flightData: selectedFlight,
      });

      if (result.success && result.checkoutUrl) {
        await Linking.openURL(result.checkoutUrl);
      } else {
        throw new Error(result.message || 'Payment initiation failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fare = calculateFare(selectedFlight, count, selectedAddons, appliedCoupon?.discountAmount || 0);

  return (
    <View style={{ flex: 1, backgroundColor: THEME.pageBg }}>
      {/* Header */}
      <LinearGradient colors={[THEME.primary, THEME.primaryDark]} style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Passenger Details</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
        {/* Flight Summary */}
        <LinearGradient colors={[THEME.primary, THEME.primaryDark]} style={s.summaryCard}>
          <View style={s.summaryRow}>
            <View style={s.summaryAirport}>
              <Text style={s.summaryCode}>{first?.departure?.iataCode}</Text>
              <Text style={s.summaryTime}>{formatTime(first?.departure?.at)}</Text>
            </View>
            <View style={s.summaryMiddle}>
              <Ionicons name="airplane" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={s.summaryDuration}>{parseDuration(itinerary?.duration)}</Text>
            </View>
            <View style={[s.summaryAirport, { alignItems: 'flex-end' }]}>
              <Text style={s.summaryCode}>{last?.arrival?.iataCode}</Text>
              <Text style={s.summaryTime}>{formatTime(last?.arrival?.at)}</Text>
            </View>
          </View>
          <Text style={s.summaryMeta}>
            {searchParams?.travelClass || 'Economy'} · {count} Traveler{count > 1 ? 's' : ''} · {parseDuration(itinerary?.duration)}
          </Text>
        </LinearGradient>

        {/* Passenger Forms */}
        {passengers.map((p, idx) => (
          <View key={idx} style={s.section}>
            <Text style={s.sectionTitle}>Passenger {idx + 1} (Adult)</Text>

            <View style={s.row}>
              <View style={s.half}>
                <Text style={s.label}>First Name <Text style={s.req}>*</Text></Text>
                <TextInput
                  style={[s.input, errors[`${idx}_firstName`] && s.inputError]}
                  placeholder="John"
                  value={p.firstName}
                  onChangeText={v => updatePassenger(idx, 'firstName', v)}
                />
              </View>
              <View style={s.half}>
                <Text style={s.label}>Last Name <Text style={s.req}>*</Text></Text>
                <TextInput
                  style={[s.input, errors[`${idx}_lastName`] && s.inputError]}
                  placeholder="Doe"
                  value={p.lastName}
                  onChangeText={v => updatePassenger(idx, 'lastName', v)}
                />
              </View>
            </View>

            <Text style={s.label}>Date of Birth <Text style={s.req}>*</Text></Text>
            <TextInput
              style={[s.input, errors[`${idx}_dob`] && s.inputError]}
              placeholder="YYYY-MM-DD"
              value={p.dob}
              onChangeText={v => updatePassenger(idx, 'dob', v)}
            />

            <Text style={s.label}>Gender</Text>
            <View style={s.genderRow}>
              {['MALE', 'FEMALE'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[s.genderBtn, p.gender === g && s.genderBtnActive]}
                  onPress={() => updatePassenger(idx, 'gender', g)}
                >
                  <Text style={[s.genderText, p.gender === g && s.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Phone <Text style={s.req}>*</Text></Text>
            <TextInput
              style={[s.input, errors[`${idx}_phone`] && s.inputError]}
              placeholder="+1 234 567 8900"
              keyboardType="phone-pad"
              value={p.phone}
              onChangeText={v => updatePassenger(idx, 'phone', v)}
            />

            <Text style={s.label}>Passport Number</Text>
            <TextInput
              style={s.input}
              placeholder="A1234567"
              value={p.passportNumber}
              onChangeText={v => updatePassenger(idx, 'passportNumber', v)}
              autoCapitalize="characters"
            />
          </View>
        ))}

        {/* Contact Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Contact Information</Text>
          <Text style={s.label}>Email <Text style={s.req}>*</Text></Text>
          <TextInput
            style={[s.input, errors.contactEmail && s.inputError]}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={contactEmail}
            onChangeText={setContactEmail}
          />
          <Text style={s.label}>Phone <Text style={s.req}>*</Text></Text>
          <TextInput
            style={[s.input, errors.contactPhone && s.inputError]}
            placeholder="+1 234 567 8900"
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
          />
        </View>

        {/* Add-ons */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Add-ons</Text>
          {ADDON_LIST.map(addon => {
            const selected = !!selectedAddons.find(a => a.id === addon.id);
            return (
              <TouchableOpacity
                key={addon.id}
                style={[s.addonCard, selected && s.addonCardActive]}
                onPress={() => toggleAddon(addon)}
              >
                <View style={s.addonLeft}>
                  <Ionicons name={addon.icon} size={22} color={selected ? '#fff' : THEME.primary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[s.addonName, selected && { color: '#fff' }]}>{addon.name}</Text>
                    <Text style={[s.addonDesc, selected && { color: 'rgba(255,255,255,0.8)' }]}>{addon.description}</Text>
                  </View>
                </View>
                <Text style={[s.addonPrice, selected && { color: '#fff' }]}>${addon.price}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Coupon */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Promo Code</Text>
          <View style={s.couponRow}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              placeholder="Enter promo code"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={s.applyBtn} onPress={applyCoupon} disabled={couponLoading}>
              {couponLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.applyBtnText}>APPLY</Text>}
            </TouchableOpacity>
          </View>
          {appliedCoupon && (
            <Text style={s.couponSuccess}>✓ {couponCode} applied — saving ${appliedCoupon.discountAmount?.toFixed(2)}</Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky Fare Summary */}
      <View style={[s.fareCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <LinearGradient colors={[THEME.primary, THEME.primaryDark]} style={s.fareGradient}>
          <Text style={s.fareTitle}>Fare Summary</Text>
          <View style={s.fareLine}><Text style={s.fareLabel}>Base Fare ({count}x)</Text><Text style={s.fareVal}>${fare.baseFare}</Text></View>
          <View style={s.fareLine}><Text style={s.fareLabel}>Taxes & Fees</Text><Text style={s.fareVal}>${fare.taxes}</Text></View>
          {parseFloat(fare.addonsTotal) > 0 && (
            <View style={s.fareLine}><Text style={s.fareLabel}>Add-ons</Text><Text style={s.fareVal}>${fare.addonsTotal}</Text></View>
          )}
          {parseFloat(fare.couponDiscount) > 0 && (
            <View style={s.fareLine}><Text style={s.fareLabel}>Discount</Text><Text style={[s.fareVal, { color: '#6EE7B7' }]}>-${fare.couponDiscount}</Text></View>
          )}
          <View style={[s.fareLine, s.fareTotal]}>
            <Text style={s.fareTotalLabel}>Total</Text>
            <Text style={s.fareTotalVal}>${fare.totalAmount} {fare.currency}</Text>
          </View>
          <TouchableOpacity
            style={[s.proceedBtn, loading && { opacity: 0.7 }]}
            onPress={handleProceed}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color={THEME.primary} /> : <Text style={s.proceedBtnText}>Proceed to Payment</Text>}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  summaryCard: { margin: 16, borderRadius: 14, padding: 18 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  summaryAirport: { alignItems: 'flex-start' },
  summaryCode: { fontSize: 24, fontWeight: '800', color: '#fff' },
  summaryTime: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  summaryMiddle: { alignItems: 'center' },
  summaryDuration: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  summaryMeta: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: THEME.textSecondary, marginBottom: 6, marginTop: 10 },
  req: { color: THEME.error },
  input: { borderWidth: 1, borderColor: THEME.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: THEME.textPrimary, backgroundColor: '#fff', marginBottom: 2 },
  inputError: { borderColor: THEME.error },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  genderBtn: { flex: 1, borderWidth: 1, borderColor: THEME.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  genderBtnActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  genderText: { fontSize: 14, color: THEME.textSecondary, fontWeight: '600' },
  genderTextActive: { color: '#fff' },
  addonCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: THEME.border, borderRadius: 10, padding: 14, marginBottom: 10 },
  addonCardActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  addonLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  addonName: { fontSize: 14, fontWeight: '600', color: THEME.textPrimary },
  addonDesc: { fontSize: 12, color: THEME.textSecondary, marginTop: 2 },
  addonPrice: { fontSize: 14, fontWeight: '700', color: THEME.primary, marginLeft: 10 },
  couponRow: { flexDirection: 'row', alignItems: 'center' },
  applyBtn: { backgroundColor: THEME.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  couponSuccess: { color: THEME.success, fontSize: 13, marginTop: 8, fontWeight: '600' },
  fareCard: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  fareGradient: { padding: 18 },
  fareTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 10 },
  fareLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fareLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  fareVal: { fontSize: 13, color: '#fff', fontWeight: '600' },
  fareTotal: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: 10, marginTop: 4 },
  fareTotalLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  fareTotalVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  proceedBtn: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  proceedBtnText: { color: THEME.primary, fontSize: 16, fontWeight: '700' },
});
