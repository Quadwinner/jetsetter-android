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
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import arcPayService from '../../services/arcPayService';
import cruiseService from '../../services/cruiseService';
import styles from './styles/CruiseBookingScreen.styles';

const CruiseBookingScreen = ({ route, navigation }) => {
  const { cruise } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Contact Information
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Passenger Information
  const [passengers, setPassengers] = useState({
    adults: [{ firstName: '', lastName: '', age: '', nationality: '' }],
    children: [],
  });

  const validateStep1 = () => {
    if (!contactInfo.firstName || !contactInfo.lastName) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!contactInfo.email) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    if (!contactInfo.phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    for (let i = 0; i < passengers.adults.length; i++) {
      const adult = passengers.adults[i];
      if (!adult.firstName || !adult.lastName || !adult.age || !adult.nationality) {
        Alert.alert('Error', `Please complete all details for Adult ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addAdult = () => {
    setPassengers(prev => ({
      ...prev,
      adults: [...prev.adults, { firstName: '', lastName: '', age: '', nationality: '' }]
    }));
  };

  const updateAdult = (index, field, value) => {
    setPassengers(prev => ({
      ...prev,
      adults: prev.adults.map((adult, i) =>
        i === index ? { ...adult, [field]: value } : adult
      )
    }));
  };

  const handleBooking = async () => {
    if (!validateStep2()) return;

    setLoading(true);

    try {
      const totalAmount = calculateTotal();
      const orderId = `CRZ${Date.now().toString(36).toUpperCase()}`;

      console.log('🚢 Starting cruise booking process...');
      console.log('Order ID:', orderId);
      console.log('Total Amount:', totalAmount);

      // 1. Check Gateway Status (matching web app)
      console.log('🔍 Checking payment gateway status...');
      const gatewayCheck = await arcPayService.checkGatewayStatus();
      
      if (!gatewayCheck.gatewayOperational) {
        setLoading(false);
        Alert.alert('Payment Unavailable', 'Payment gateway is currently unavailable. Please try again later.');
        return;
      }

      console.log('✅ Gateway is operational');

      // 2. Prepare Booking Data
      const bookingData = {
        cruiseId: cruise.id,
        cruiseName: cruise.name,
        cruiseImage: cruise.image,
        duration: cruise.duration,
        departure: cruise.departurePort,
        departureDate: cruise.departureDate,
        cruiseLine: cruise.cruiseLine,
        ship: cruise.ship,
        basePrice: parseFloat(cruise.price.replace(/[^0-9.]/g, '')),
        taxesAndFees: 150,
        portCharges: 200,
        totalAmount,
        contactInfo,
        passengerDetails: passengers,
      };

      // 3. Create ArcPay Hosted Checkout (matching web app)
      console.log('🔐 Creating ARC Pay hosted checkout...');
      const checkoutResponse = await arcPayService.createHostedCheckout({
        amount: totalAmount,
        currency: 'USD',
        orderId: orderId,
        bookingType: 'cruise',
        customerName: `${contactInfo.firstName} ${contactInfo.lastName}`,
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        description: `Cruise Booking - ${cruise.name}`,
        returnUrl: `jetsetterss://payment-callback?orderId=${orderId}&type=cruise`,
        cancelUrl: `jetsetterss://payment-cancel`,
        bookingData: bookingData,
      });

      console.log('📊 Checkout Response:', checkoutResponse);

      if (checkoutResponse.success && checkoutResponse.checkoutUrl) {
        setLoading(false);
        
        // 4. Navigate to WebView to load the ArcPay checkoutUrl
        console.log('🌐 Navigating to ArcPay WebView...');
        navigation.navigate('ArcPayWebView', {
          url: checkoutResponse.checkoutUrl,
          bookingData,
          orderId,
          sessionId: checkoutResponse.sessionId,
          totalAmount,
        });
      } else {
        setLoading(false);
        Alert.alert(
          'Payment Error',
          checkoutResponse.error || 'Unable to create payment session. Please try again.'
        );
      }
    } catch (error) {
      setLoading(false);
      console.error('❌ Booking error:', error);
      Alert.alert(
        'Booking Failed',
        'An unexpected error occurred during booking. Please try again.'
      );
    }
  };

  const calculateTotal = () => {
    const basePrice = parseFloat(cruise.price.replace(/[^0-9.]/g, ''));
    const taxesAndFees = 150;
    const portCharges = 200;
    const totalPassengers = passengers.adults.length + passengers.children.length;
    return (basePrice + taxesAndFees + portCharges) * totalPassengers;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepText,
              currentStep >= step && styles.stepTextActive
            ]}>
              {step}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            currentStep >= step && styles.stepLabelActive
          ]}>
            {step === 1 ? 'Contact' : step === 2 ? 'Passengers' : 'ARC Pay'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepSubtitle}>We'll use this information to send you booking confirmation</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={contactInfo.firstName}
          onChangeText={(text) => setContactInfo(prev => ({ ...prev, firstName: text }))}
          placeholder="Enter first name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={contactInfo.lastName}
          onChangeText={(text) => setContactInfo(prev => ({ ...prev, lastName: text }))}
          placeholder="Enter last name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={contactInfo.email}
          onChangeText={(text) => setContactInfo(prev => ({ ...prev, email: text }))}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={contactInfo.phone}
          onChangeText={(text) => setContactInfo(prev => ({ ...prev, phone: text }))}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Passenger Information</Text>
      <Text style={styles.stepSubtitle}>Enter details for all passengers</Text>

      {passengers.adults.map((adult, index) => (
        <View key={index} style={styles.passengerCard}>
          <Text style={styles.passengerTitle}>Adult {index + 1}</Text>

          <View style={styles.nameRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={adult.firstName}
                onChangeText={(text) => updateAdult(index, 'firstName', text)}
                placeholder="First name"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={adult.lastName}
                onChangeText={(text) => updateAdult(index, 'lastName', text)}
                placeholder="Last name"
              />
            </View>
          </View>

          <View style={styles.nameRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                value={adult.age}
                onChangeText={(text) => updateAdult(index, 'age', text)}
                placeholder="Age"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Nationality *</Text>
              <TextInput
                style={styles.input}
                value={adult.nationality}
                onChangeText={(text) => updateAdult(index, 'nationality', text)}
                placeholder="Nationality"
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addAdult}>
        <Ionicons name="add" size={20} color="#0066b2" />
        <Text style={styles.addButtonText}>Add Adult Passenger</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Pay</Text>
      <Text style={styles.stepSubtitle}>Card details are entered only on ARC Pay's secure hosted checkout.</Text>

      <View style={[styles.bookingSummary, { marginTop: 0, marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="lock-closed" size={22} color="#10B981" />
          <Text style={[styles.summaryTitle, { marginBottom: 0, marginLeft: 8 }]}>Secure ARC Pay Checkout</Text>
        </View>
        <Text style={[styles.summaryLabel, { marginTop: 10, lineHeight: 20 }]}>
          Continue to ARC Pay to complete payment. This app does not collect or store card numbers, expiry dates, or CVV.
        </Text>
      </View>

      {/* Booking Summary */}
      <View style={styles.bookingSummary}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cruise:</Text>
          <Text style={styles.summaryValue}>{cruise.name}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>{cruise.duration}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Passengers:</Text>
          <Text style={styles.summaryValue}>{passengers.adults.length + passengers.children.length}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Base Price:</Text>
          <Text style={styles.summaryValue}>{cruise.price}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taxes & Fees:</Text>
          <Text style={styles.summaryValue}>$150</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Port Charges:</Text>
          <Text style={styles.summaryValue}>$200</Text>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0066b2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Cruise</Text>
        <View style={styles.placeholder} />
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backFooterButton} onPress={handleBack}>
            <Text style={styles.backFooterButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={currentStep === 3 ? handleBooking : handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? 'Continue to ARC Pay' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CruiseBookingScreen;
