import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import packageService from '../../services/packageService';
import quoteService from '../../services/quoteService';
import useArcPayment from '../../utils/useArcPayment';

const PackageBookingScreen = ({ route, navigation }) => {
  const { package: pkg } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const { payForPackage, isProcessing } = useArcPayment();
  const [traveler, setTraveler] = useState({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '' });
  const [travelDate, setTravelDate] = useState('');

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [travelDateObj, setTravelDateObj] = useState(new Date());

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTravelDateObj(selectedDate);
      setTravelDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleBooking = async () => {
    // Validate traveler details
    if (!traveler.firstName || !traveler.lastName || !traveler.email || !traveler.phone || !travelDate) {
      Alert.alert('Missing Information', 'Please fill in all traveler fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(traveler.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const totalAmount = Number(pkg.price) || 0;
      const currency = 'USD';

      console.log('📦 Starting package booking via ARC Pay quote flow...');
      console.log('Total Amount:', totalAmount);

      const quote = await quoteService.createQuoteForBooking({
        bookingType: 'package',
        title: `Package Booking - ${pkg.title}`,
        description: `${pkg.location || 'Travel package'}${pkg.duration ? ` • ${pkg.duration}` : ''}`,
        totalAmount,
        currency,
        breakdown: {
          package_price: totalAmount,
          taxes: 0,
          fees: 0,
        },
        bookingDetails: {
          package: pkg,
          travel_date: travelDate,
          travelers: [traveler],
        },
        customerEmail: traveler.email,
        customerName: `${traveler.firstName} ${traveler.lastName}`,
        customerPhone: traveler.phone,
      });

      const quoteId = quote?.id;
      if (!quoteId) {
        throw new Error('Quote ID missing from server response');
      }

      setLoading(false);
      payForPackage(quoteId, totalAmount, {
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
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', paddingTop: insets.top + 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B' }}>Booking Details</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
        <View style={{ padding: 16 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 }}>{pkg.title}</Text>
            <Text style={{ color: '#64748B' }}>{pkg.location}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0890BC', marginTop: 12 }}>{packageService.formatPrice(pkg.price)}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>Traveler Details</Text>
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Travel Date *</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16 }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: travelDate ? '#1E293B' : '#94A3B8', fontSize: 16 }}>
                {travelDate || 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>First Name *</Text>
            <TextInput style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16 }} placeholder="John" value={traveler.firstName} onChangeText={(text) => setTraveler({ ...traveler, firstName: text })} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Last Name *</Text>
            <TextInput style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16 }} placeholder="Doe" value={traveler.lastName} onChangeText={(text) => setTraveler({ ...traveler, lastName: text })} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Email *</Text>
            <TextInput style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16 }} placeholder="john@example.com" value={traveler.email} onChangeText={(text) => setTraveler({ ...traveler, email: text })} keyboardType="email-address" autoCapitalize="none" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Phone *</Text>
            <TextInput style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12 }} placeholder="+1234567890" value={traveler.phone} onChangeText={(text) => setTraveler({ ...traveler, phone: text })} keyboardType="phone-pad" />
          </View>

          {/* Payment Information */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B' }}>Payment Information</Text>
          </View>
          <View style={{ backgroundColor: '#E6F4F8', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', gap: 12 }}>
            <Ionicons name="lock-closed" size={24} color="#10B981" />
            <Text style={{ flex: 1, fontSize: 14, color: '#1E40AF', lineHeight: 20 }}>
              Payment is completed on ARC Pay's secure hosted checkout. Card details are not collected or stored in this app.
            </Text>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={travelDateObj}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        padding: 16,
        paddingBottom: Math.max(insets.bottom, 16),
      }}>
        <TouchableOpacity style={{ backgroundColor: (loading || isProcessing) ? '#94A3B8' : '#0890BC', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }} onPress={handleBooking} disabled={loading || isProcessing}>
          {loading || isProcessing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Continue to ARC Pay</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PackageBookingScreen;
