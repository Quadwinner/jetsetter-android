/**
 * Payment Success Screen
 * 
 * Displayed after a successful ARC Pay payment.
 * Shows payment confirmation and navigation options.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  BackHandler,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentSuccessScreen = ({ navigation, route }) => {
  const { 
    paymentId, 
    quoteId, 
    inquiryId,
    bookingType = 'booking',
    paymentDetails,
  } = route.params || {};

  useEffect(() => {
    // Prevent going back to payment screen
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigateToBookings();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const navigateToBookings = () => {
    // Navigate to My Trips/Bookings screen
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Main', params: { screen: 'MyTrips' } },
      ],
    });
  };

  const navigateToHome = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Main', params: { screen: 'Home' } },
      ],
    });
  };

  // Format payment reference
  const getPaymentReference = () => {
    if (paymentDetails?.transaction_id) {
      return paymentDetails.transaction_id.slice(-8).toUpperCase();
    }
    if (paymentId) {
      return paymentId.slice(-8).toUpperCase();
    }
    return 'CONFIRMED';
  };

  // Get booking type label
  const getBookingTypeLabel = () => {
    switch (bookingType) {
      case 'flight':
        return 'Flight Booking';
      case 'hotel':
        return 'Hotel Reservation';
      case 'cruise':
        return 'Cruise Booking';
      case 'package':
        return 'Package Booking';
      default:
        return 'Booking';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Success Icon with Animation */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
          </View>
          
          {/* Success Message */}
          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>
            Your {getBookingTypeLabel().toLowerCase()} has been confirmed.
          </Text>
          
          {/* Payment Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Reference</Text>
              <Text style={styles.detailValue}>{getPaymentReference()}</Text>
            </View>
            
            {paymentDetails?.amount && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount Paid</Text>
                <Text style={styles.detailValue}>
                  {paymentDetails.currency || 'USD'} {parseFloat(paymentDetails.amount).toFixed(2)}
                </Text>
              </View>
            )}
            
            {paymentDetails?.payment_status && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.statusText}>
                    {paymentDetails.payment_status.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          
          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="mail-outline" size={24} color="#1e40af" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Confirmation Email Sent</Text>
              <Text style={styles.infoText}>
                A confirmation email with your booking details has been sent to your registered email address.
              </Text>
            </View>
          </View>
          
          {/* What's Next Section */}
          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsTitle}>What's Next?</Text>
            <View style={styles.nextStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Check your email for booking confirmation</Text>
            </View>
            <View style={styles.nextStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>View booking details in "My Trips"</Text>
            </View>
            <View style={styles.nextStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Contact us if you have any questions</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={navigateToBookings}
            >
              <Ionicons name="briefcase-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>View My Bookings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={navigateToHome}
            >
              <Ionicons name="home-outline" size={20} color="#1e40af" />
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
          
          {/* Support Info */}
          <View style={styles.supportBox}>
            <Text style={styles.supportText}>Need help with your booking?</Text>
            <Text style={styles.supportContact}>
              Call us at <Text style={styles.supportLink}>(877) 538-7380</Text>
            </Text>
            <Text style={styles.supportContact}>
              or email <Text style={styles.supportLink}>support@jetsetterss.com</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3b82f6',
    lineHeight: 18,
  },
  nextStepsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  stepText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: '600',
  },
  supportBox: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
  },
  supportText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  supportContact: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  supportLink: {
    color: '#1e40af',
    fontWeight: '500',
  },
});

export default PaymentSuccessScreen;
