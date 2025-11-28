/**
 * Payment Failed Screen
 * 
 * Displayed when an ARC Pay payment fails.
 * Shows error reason and provides retry/support options.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentFailedScreen = ({ navigation, route }) => {
  const { 
    reason, 
    quoteId, 
    inquiryId,
    bookingType = 'booking',
  } = route.params || {};

  const retryPayment = () => {
    if (quoteId) {
      navigation.replace('ArcPayment', { 
        quoteId, 
        inquiryId,
        bookingType,
      });
    } else {
      navigation.goBack();
    }
  };

  const navigateToHome = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Main', params: { screen: 'Home' } },
      ],
    });
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@jetsetterss.com?subject=Payment%20Issue');
  };

  const callSupport = () => {
    Linking.openURL('tel:+18775387380');
  };

  // Get user-friendly error message
  const getErrorMessage = () => {
    if (!reason) {
      return 'Your payment could not be processed. Please try again.';
    }
    
    // Map common errors to friendly messages
    const errorMap = {
      'insufficient_funds': 'Your card has insufficient funds. Please try another card.',
      'card_declined': 'Your card was declined. Please try another payment method.',
      'expired_card': 'Your card has expired. Please use a valid card.',
      'invalid_card': 'The card details entered are invalid. Please check and try again.',
      'network_error': 'A network error occurred. Please check your connection and try again.',
      'timeout': 'The payment request timed out. Please try again.',
      '3ds_failed': 'Card authentication failed. Please try again or use a different card.',
    };
    
    // Check if reason matches any known error
    for (const [key, message] of Object.entries(errorMap)) {
      if (reason.toLowerCase().includes(key)) {
        return message;
      }
    }
    
    return reason;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="close" size={48} color="#fff" />
            </View>
          </View>
          
          {/* Error Message */}
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.subtitle}>{getErrorMessage()}</Text>
          
          {/* Troubleshooting Card */}
          <View style={styles.troubleshootCard}>
            <View style={styles.troubleshootHeader}>
              <Ionicons name="help-circle-outline" size={24} color="#92400e" />
              <Text style={styles.troubleshootTitle}>What you can try:</Text>
            </View>
            
            <View style={styles.suggestionList}>
              <View style={styles.suggestion}>
                <Ionicons name="card-outline" size={20} color="#78350f" />
                <Text style={styles.suggestionText}>
                  Check that your card details are correct
                </Text>
              </View>
              
              <View style={styles.suggestion}>
                <Ionicons name="wallet-outline" size={20} color="#78350f" />
                <Text style={styles.suggestionText}>
                  Ensure sufficient funds are available
                </Text>
              </View>
              
              <View style={styles.suggestion}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#78350f" />
                <Text style={styles.suggestionText}>
                  Try a different payment method or card
                </Text>
              </View>
              
              <View style={styles.suggestion}>
                <Ionicons name="call-outline" size={20} color="#78350f" />
                <Text style={styles.suggestionText}>
                  Contact your bank if the issue persists
                </Text>
              </View>
              
              <View style={styles.suggestion}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#78350f" />
                <Text style={styles.suggestionText}>
                  Ensure your card is enabled for online payments
                </Text>
              </View>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={retryPayment}
            >
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={navigateToHome}
            >
              <Ionicons name="home-outline" size={20} color="#1e40af" />
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
          
          {/* Support Section */}
          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportDescription}>
              Our support team is available 24/7 to assist you with any payment issues.
            </Text>
            
            <View style={styles.supportButtons}>
              <TouchableOpacity 
                style={styles.supportButton}
                onPress={callSupport}
              >
                <View style={styles.supportIconContainer}>
                  <Ionicons name="call" size={20} color="#1e40af" />
                </View>
                <View style={styles.supportButtonContent}>
                  <Text style={styles.supportButtonLabel}>Call Us</Text>
                  <Text style={styles.supportButtonText}>(877) 538-7380</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.supportButton}
                onPress={contactSupport}
              >
                <View style={styles.supportIconContainer}>
                  <Ionicons name="mail" size={20} color="#1e40af" />
                </View>
                <View style={styles.supportButtonContent}>
                  <Text style={styles.supportButtonLabel}>Email</Text>
                  <Text style={styles.supportButtonText}>support@jetsetterss.com</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Error Code (for debugging) */}
          {reason && (
            <View style={styles.errorCodeContainer}>
              <Text style={styles.errorCodeLabel}>Error Details:</Text>
              <Text style={styles.errorCode}>{reason}</Text>
            </View>
          )}
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
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
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
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  troubleshootCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  troubleshootHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  suggestionList: {
    gap: 12,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#78350f',
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
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
  supportSection: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  supportDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButtons: {
    gap: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  supportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportButtonContent: {
    flex: 1,
  },
  supportButtonLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  errorCodeContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginTop: 8,
  },
  errorCodeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  errorCode: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
});

export default PaymentFailedScreen;
