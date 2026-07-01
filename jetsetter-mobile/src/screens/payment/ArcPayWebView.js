import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import cruiseService from '../../services/cruiseService';

const ArcPayWebView = ({ route, navigation }) => {
  const { url, bookingData, orderId, sessionId, totalAmount } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  const handleNavigationStateChange = (navState) => {
    console.log('🌐 Navigation state:', navState.url);
    
    // Check for success callback
    if (navState.url.includes('payment-callback') || navState.url.includes('success')) {
      console.log('✅ Payment successful, saving booking...');
      handlePaymentSuccess();
    }
    
    // Check for cancel callback
    if (navState.url.includes('payment-cancel') || navState.url.includes('cancel')) {
      console.log('❌ Payment cancelled');
      handlePaymentCancel();
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Extract transaction ID from URL if available
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const transactionId = urlParams.get('transactionId') || sessionId;

      // Save booking to database (matching web app endpoint)
      const payload = {
        orderId: orderId,
        cruiseName: bookingData.cruiseName,
        cruiseImage: bookingData.cruiseImage,
        duration: bookingData.duration,
        departure: bookingData.departure,
        departureDate: bookingData.departureDate,
        cruiseLine: bookingData.cruiseLine,
        ship: bookingData.ship,
        basePrice: bookingData.basePrice,
        taxesAndFees: bookingData.taxesAndFees,
        portCharges: bookingData.portCharges,
        totalAmount: bookingData.totalAmount,
        contactInfo: bookingData.contactInfo,
        passengerDetails: bookingData.passengerDetails,
        transactionId: transactionId,
        sessionId: sessionId,
      };

      console.log('💾 Saving cruise booking to database...');
      const result = await cruiseService.saveBooking(payload);

      if (result.success) {
        console.log('✅ Booking saved successfully');
        navigation.replace('CruiseConfirmation', {
          bookingData: {
            cruise: {
              id: bookingData.cruiseId,
              name: bookingData.cruiseName,
              image: bookingData.cruiseImage,
              duration: bookingData.duration,
              departurePort: bookingData.departure,
              departureDate: bookingData.departureDate,
              cruiseLine: bookingData.cruiseLine,
              ship: bookingData.ship,
              price: `From $${bookingData.basePrice}`,
            },
            contactInfo: bookingData.contactInfo,
            passengers: bookingData.passengerDetails,
            totalAmount: bookingData.totalAmount,
            orderReference: orderId,
            payment: {
              transactionId,
              sessionId,
              status: 'APPROVED',
              amount: totalAmount,
              processedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        Alert.alert('Warning', 'Payment successful but booking save failed. Please contact support.');
        navigation.replace('CruiseConfirmation', {
          bookingData: {
            cruise: {
              id: bookingData.cruiseId,
              name: bookingData.cruiseName,
              image: bookingData.cruiseImage,
              duration: bookingData.duration,
              departurePort: bookingData.departure,
              departureDate: bookingData.departureDate,
              cruiseLine: bookingData.cruiseLine,
              ship: bookingData.ship,
              price: `From $${bookingData.basePrice}`,
            },
            contactInfo: bookingData.contactInfo,
            passengers: bookingData.passengerDetails,
            totalAmount: bookingData.totalAmount,
            orderReference: orderId,
            payment: {
              transactionId,
              sessionId,
              status: 'APPROVED',
              amount: totalAmount,
              processedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error) {
      console.error('❌ Error saving booking:', error);
      Alert.alert('Error', 'Failed to save booking. Please contact support with your order ID: ' + orderId);
    }
  };

  const handlePaymentCancel = () => {
    Alert.alert(
      'Payment Cancelled',
      'Your payment was cancelled. You can try again or go back.',
      [
        {
          text: 'Try Again',
          onPress: () => webViewRef.current?.reload(),
        },
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
          style: 'cancel',
        },
      ]
    );
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    setError(nativeEvent.description);
    setLoading(false);
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleGoBack = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel the payment process?',
      [
        {
          text: 'Continue Payment',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          onPress: () => navigation.goBack(),
          style: 'destructive',
        },
      ]
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.webViewHeader}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#0066b2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066b2" />
          <Text style={styles.loadingText}>Loading secure payment...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        style={styles.webView}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        cacheEnabled={false}
      />

      {/* Security Badge */}
      <View style={[styles.securityBadge, { paddingBottom: insets.bottom }]}>
        <Ionicons name="lock-closed" size={16} color="#10b981" />
        <Text style={styles.securityText}>Secured by ARC Pay</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  webView: {
    flex: 1,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#0066b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 12,
  },
  backButtonText: {
    color: '#0066b2',
    fontSize: 16,
  },
});

export default ArcPayWebView;
