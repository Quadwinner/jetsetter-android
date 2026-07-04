import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MyTripsService from '../../services/MyTripsService';
import BookingInfoService from '../../services/BookingInfoService';
import { COLORS } from '../../constants/config';
import { useInquiry } from '../../hooks/queries';

const InquiryDetailScreen = ({ route, navigation }) => {
  const { inquiryId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: inquiry, isLoading: loading, isError, error } = useInquiry(inquiryId);

  // Preserve the old behavior: on load failure, alert and go back.
  useEffect(() => {
    if (isError) {
      Alert.alert('Error', error?.message || 'Failed to load inquiry details');
      navigation.goBack();
    }
  }, [isError]);

  const handlePayQuote = async (quote) => {
    try {
      console.log('💳 Pay Now clicked for quote:', quote.id);
      console.log('📋 Inquiry type:', inquiry.inquiry_type);
      
      // Check if booking info exists and is complete
      let bookingInfo = null;
      try {
        bookingInfo = await BookingInfoService.getBookingInfo(quote.id);
        console.log('📦 Booking info result:', bookingInfo ? 'Found' : 'Not found');
      } catch (error) {
        console.log('⚠️ Error fetching booking info (will show form):', error.message);
        // If error fetching, assume no booking info exists
        bookingInfo = null;
      }
      
      const checkResult = BookingInfoService.checkBookingInfoComplete(
        bookingInfo,
        inquiry.inquiry_type
      );
      
      console.log('✅ Booking info check result:', {
        isComplete: checkResult.isComplete,
        missingFields: checkResult.missingFields,
        status: checkResult.status,
      });

      if (!checkResult.isComplete) {
        console.log('📝 Booking info incomplete, navigating directly to form...');
        // Navigate directly to booking info form (skip alert for better UX)
        navigation.navigate('BookingInfoForm', {
          quoteId: quote.id,
          inquiryType: inquiry.inquiry_type,
          onComplete: (savedBookingInfo) => {
            console.log('✅ Booking info saved, status:', savedBookingInfo.status);
            // After saving, proceed to payment if status is complete
            if (savedBookingInfo.status === 'completed' || savedBookingInfo.status === 'verified') {
              navigation.navigate('ArcPayment', {
                quoteId: quote.id,
                inquiryId: inquiry.id,
              });
            }
          },
        });
        return;
      }

      console.log('✅ Booking info complete, proceeding to payment...');
      // Booking info is complete, proceed to payment
      navigation.navigate('ArcPayment', {
        quoteId: quote.id,
        inquiryId: inquiry.id,
      });
    } catch (error) {
      console.error('❌ Error in handlePayQuote:', error);
      Alert.alert('Error', error.message || 'Failed to check booking information');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading inquiry...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!inquiry) {
    return null;
  }

  const hasUnpaidQuotes = inquiry.quotes?.some(
    (q) => q.status === 'sent' && q.payment_status === 'unpaid'
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inquiry Details</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                {inquiry.inquiry_type?.charAt(0).toUpperCase() + inquiry.inquiry_type?.slice(1) || 'Request'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {inquiry.flight_destination || inquiry.hotel_destination || inquiry.cruise_destination || inquiry.package_destination || 'Custom Request'}
              </Text>
            </View>
            <View style={[styles.statusBadge, styles[`status${inquiry.status}`]]}>
              <Text style={styles.statusText}>{inquiry.status || 'pending'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{inquiry.customer_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{inquiry.customer_email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{inquiry.customer_phone}</Text>
            </View>
          </View>

          {inquiry.special_requirements && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Requirements</Text>
              <Text style={styles.infoValue}>{inquiry.special_requirements}</Text>
            </View>
          )}

          {inquiry.budget_range && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Budget Range</Text>
              <Text style={styles.infoValue}>{inquiry.budget_range}</Text>
            </View>
          )}

          {inquiry.quotes && inquiry.quotes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quotes</Text>
              {inquiry.quotes.map((quote) => (
                <View key={quote.id} style={styles.quoteCard}>
                  <View style={styles.quoteHeader}>
                    <Text style={styles.quoteNumber}>
                      {quote.quote_number || quote.id.slice(-8)}
                    </Text>
                    <Text style={styles.quoteAmount}>
                      ${parseFloat(quote.total_amount || 0).toFixed(2)} {quote.currency || 'USD'}
                    </Text>
                  </View>
                  <View style={styles.quoteStatusRow}>
                    <View style={[styles.statusBadge, styles[`status${quote.status}`]]}>
                      <Text style={styles.statusText}>{quote.status}</Text>
                    </View>
                    {quote.payment_status === 'unpaid' && quote.status === 'sent' && (
                      <View style={styles.quoteActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.infoButton]}
                          onPress={() => {
                            console.log('📝 Opening booking info form directly');
                            navigation.navigate('BookingInfoForm', {
                              quoteId: quote.id,
                              inquiryType: inquiry.inquiry_type,
                              onComplete: (savedBookingInfo) => {
                                if (savedBookingInfo.status === 'completed' || savedBookingInfo.status === 'verified') {
                                  navigation.navigate('ArcPayment', {
                                    quoteId: quote.id,
                                    inquiryId: inquiry.id,
                                  });
                                }
                              },
                            });
                          }}
                        >
                          <Text style={styles.actionButtonText}>Booking Info</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.payButton}
                          onPress={() => handlePayQuote(quote)}
                        >
                          <Text style={styles.payButtonText}>Pay Now</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  {quote.description && (
                    <Text style={styles.quoteDescription}>{quote.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <Text style={styles.createdDate}>
            Created: {new Date(inquiry.created_at).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  statuspending: { backgroundColor: '#f59e0b' },
  statusquoted: { backgroundColor: '#3b82f6' },
  statusbooked: { backgroundColor: '#10b981' },
  statuscancelled: { backgroundColor: '#ef4444' },
  statussent: { backgroundColor: '#3b82f6' },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  quoteCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  quoteAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  quoteStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  infoButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quoteDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  createdDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
});

export default InquiryDetailScreen;

