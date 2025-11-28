/**
 * ARC Pay Payment Screen
 * 
 * WebView-based payment screen that handles the ARC Pay Hosted Checkout flow.
 * Features:
 * - Loads ARC Pay hosted payment page in WebView
 * - Handles 3DS authentication automatically
 * - Captures callback URL and verifies payment
 * - Shows loading, error, and verification states
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  BackHandler,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import ArcPaymentService from '../../services/payment/ArcPaymentService';

const ArcPaymentScreen = ({ navigation, route }) => {
  const { 
    quoteId, 
    inquiryId, 
    bookingType = 'booking',
    amount,
    currency = 'USD',
    title = 'Payment',
    onSuccess,
    onFailed,
    returnScreen = 'PaymentSuccess',
    failedScreen = 'PaymentFailed',
  } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  
  const webViewRef = useRef(null);
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    initializePayment();
    
    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (paymentUrl && !verifying) {
        showCancelConfirmation();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  const showCancelConfirmation = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: handleCancel,
        },
      ]
    );
  };

  const handleCancel = async () => {
    await ArcPaymentService.clearPaymentData();
    navigation.goBack();
  };

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      hasHandledCallback.current = false;
      
      console.log('🚀 Starting ARC Pay payment for quote:', quoteId);
      
      if (!quoteId) {
        throw new Error('Quote ID is required to process payment');
      }
      
      const result = await ArcPaymentService.initiatePayment(quoteId);
      
      if (result.success && result.paymentPageUrl) {
        console.log('✅ Payment URL received:', result.paymentPageUrl);
        setPaymentUrl(result.paymentPageUrl);
      } else {
        throw new Error('Failed to get payment URL from server');
      }
    } catch (err) {
      console.error('❌ Payment initialization failed:', err);
      const errorMessage = err.message || 'Failed to initialize payment. Please try again.';
      setError(errorMessage);
      Alert.alert(
        'Payment Error',
        errorMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle WebView navigation state changes
   * Captures the callback URL when ARC Pay redirects back
   */
  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;
    console.log('🔗 WebView navigating to:', url);
    
    // Prevent handling the same callback multiple times
    if (hasHandledCallback.current) {
      return;
    }
    
    // Check if this is a callback URL
    if (ArcPaymentService.isCallbackUrl(url)) {
      hasHandledCallback.current = true;
      console.log('📥 Callback URL detected:', url);
      
      // Extract parameters from URL
      const params = ArcPaymentService.extractCallbackParams(url);
      
      // Handle the callback
      await handlePaymentCallback({
        ...params,
        quoteId,
        callbackUrl: url,
      });
    }
  };

  /**
   * Handle payment callback - verify with backend
   */
  const handlePaymentCallback = async (params) => {
    try {
      setVerifying(true);
      setPaymentUrl(null); // Hide WebView
      
      console.log('🔍 Processing payment callback:', params);
      
      // Check for cancel
      if (params.paymentStatus === 'cancelled' || params.callbackUrl?.includes('cancel')) {
        console.log('❌ Payment cancelled by user');
        Alert.alert(
          'Payment Cancelled',
          'You cancelled the payment.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // If we have resultIndicator, verify with backend
      if (params.resultIndicator && params.sessionId) {
        const verificationResult = await ArcPaymentService.verifyPayment({
          resultIndicator: params.resultIndicator,
          sessionId: params.sessionId,
          quoteId: params.quoteId,
        });
        
        console.log('📥 Verification result:', verificationResult);
        
        // Navigate based on result
        if (verificationResult.success || verificationResult.payment?.payment_status === 'completed') {
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess(verificationResult);
          }
          
          navigation.replace(returnScreen, {
            paymentId: verificationResult.payment?.id,
            quoteId: params.quoteId,
            inquiryId,
            bookingType,
            paymentDetails: verificationResult.payment,
          });
        } else {
          // Call onFailed callback if provided
          if (onFailed) {
            onFailed(verificationResult.error || 'Payment verification failed');
          }
          
          navigation.replace(failedScreen, {
            reason: verificationResult.error || 'Payment verification failed',
            quoteId: params.quoteId,
            inquiryId,
            bookingType,
          });
        }
      } else if (params.paymentStatus === 'success') {
        // Direct success callback (fallback)
        if (onSuccess) {
          onSuccess({ success: true });
        }
        
        navigation.replace(returnScreen, {
          quoteId: params.quoteId,
          inquiryId,
          bookingType,
        });
      } else {
        // Payment failed or unknown status
        if (onFailed) {
          onFailed('Payment was not completed');
        }
        
        navigation.replace(failedScreen, {
          reason: 'Payment was not completed',
          quoteId: params.quoteId,
          inquiryId,
          bookingType,
        });
      }
    } catch (err) {
      console.error('❌ Callback handling error:', err);
      
      if (onFailed) {
        onFailed(err.message);
      }
      
      navigation.replace(failedScreen, {
        reason: err.message || 'Failed to verify payment',
        quoteId: params.quoteId,
        inquiryId,
        bookingType,
      });
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Control which URLs the WebView can navigate to
   */
  const handleShouldStartLoad = (request) => {
    const { url } = request;
    
    // Always allow the initial payment URL
    if (url === paymentUrl) {
      return true;
    }
    
    // Allow ARC Pay / Mastercard Gateway URLs and 3DS
    if (ArcPaymentService.isAllowedUrl(url)) {
      return true;
    }
    
    // Allow callback URLs (will be handled by navigation state change)
    if (ArcPaymentService.isCallbackUrl(url)) {
      return true;
    }
    
    // Log blocked URLs for debugging
    console.log('⚠️ WebView navigation to:', url);
    return true; // Allow all for now to avoid breaking 3DS
  };

  // Loading state - initializing payment
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Preparing secure payment...</Text>
          <Text style={styles.subText}>Please wait while we connect to ARC Pay</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Verifying state - after payment completion
  if (verifying) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Verifying payment...</Text>
          <Text style={styles.subText}>Please wait while we confirm your payment</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializePayment}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // WebView with payment page
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={showCancelConfirmation}
        >
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="lock-closed" size={16} color="#10b981" />
          <Text style={styles.headerTitle}>Secure Payment</Text>
        </View>
        <View style={styles.headerButton} />
      </View>
      
      {/* Payment Info Bar */}
      {amount && (
        <View style={styles.paymentInfoBar}>
          <Text style={styles.paymentInfoText}>
            {title} • {currency} {parseFloat(amount).toFixed(2)}
          </Text>
        </View>
      )}
      
      {/* WebView */}
      {paymentUrl && (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          
          // Required settings for payment page and 3DS
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          
          // Android specific
          setSupportMultipleWindows={false}
          
          // Loading indicator
          startInLoadingState={true}
          onLoadStart={() => setWebViewLoading(true)}
          onLoadEnd={() => setWebViewLoading(false)}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#1e40af" />
              <Text style={styles.loadingText}>Loading payment page...</Text>
            </View>
          )}
          
          // Error handling
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            if (!hasHandledCallback.current) {
              setError('Failed to load payment page. Please try again.');
            }
          }}
          
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error:', nativeEvent.statusCode);
            if (nativeEvent.statusCode >= 400 && !hasHandledCallback.current) {
              setError(`Payment page error (${nativeEvent.statusCode}). Please try again.`);
            }
          }}
        />
      )}
      
      {/* WebView loading overlay */}
      {webViewLoading && paymentUrl && (
        <View style={styles.webviewLoadingOverlay}>
          <ActivityIndicator size="small" color="#1e40af" />
        </View>
      )}
      
      {/* Security footer */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={16} color="#6b7280" />
        <Text style={styles.footerText}>Secured by ARC Pay & Mastercard</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  paymentInfoBar: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  webviewLoadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ArcPaymentScreen;
