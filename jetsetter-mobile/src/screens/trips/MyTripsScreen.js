import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import MyTripsService from '../../services/MyTripsService';
import currencyService from '../../services/currencyService';
import BookingInfoService from '../../services/BookingInfoService';
import styles from './styles/MyTripsScreen.styles';

const MyTripsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load trips from backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading trips from backend...');
      const [inquiriesData, bookingsData] = await Promise.all([
        MyTripsService.getMyInquiries().catch((err) => {
          console.error('Error fetching inquiries:', err);
          return { success: false, data: [] };
        }),
        MyTripsService.getMyBookings().catch((err) => {
          console.error('Error fetching bookings:', err);
          return { success: false, data: [] };
        }),
      ]);

      // Handle inquiries - check multiple response structures
      let inquiriesList = [];
      if (inquiriesData.success) {
        inquiriesList = inquiriesData.data || inquiriesData.inquiries || [];
        setInquiries(Array.isArray(inquiriesList) ? inquiriesList : []);
        console.log('✅ Loaded inquiries:', inquiriesList.length);
      } else {
        console.log('⚠️ No inquiries loaded');
        setInquiries([]);
      }
      
      // Handle bookings
      let bookingsList = [];
      if (bookingsData.success) {
        bookingsList = bookingsData.data || bookingsData.bookings || [];
        setBookings(Array.isArray(bookingsList) ? bookingsList : []);
        console.log('✅ Loaded bookings:', bookingsList.length);
      } else {
        console.log('⚠️ No bookings loaded');
        setBookings([]);
      }
      
      console.log('📋 Final count - Inquiries:', inquiriesList.length, 'Bookings:', bookingsList.length);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Filter items
  const filterItems = (items, type) => {
    const now = new Date();
    return items.filter((item) => {
      if (type === 'Upcoming') {
        const date = item.departure_date || item.start_date || item.flight_departure_date;
        return date && new Date(date) >= now;
      } else {
        const date = item.departure_date || item.start_date || item.flight_departure_date;
        return !date || new Date(date) < now;
      }
    });
  };

  const getDisplayItems = () => {
    if (activeTab === 'Requests') {
      return inquiries;
    }
    const allBookings = bookings;
    return filterItems(allBookings, activeTab);
  };

  const displayItems = getDisplayItems();

  // Get booking type info
  const getBookingTypeInfo = (type) => {
    const typeInfo = {
      flight: {
        icon: 'airplane',
        label: 'Flight',
        color: '#0890BC',
        bgColor: '#E0F2FE',
        gradient: ['#0890BC', '#055B75'],
      },
      cruise: {
        icon: 'boat',
        label: 'Cruise',
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        gradient: ['#8B5CF6', '#7C3AED'],
      },
      hotel: {
        icon: 'bed',
        label: 'Hotel',
        color: '#EC4899',
        bgColor: '#FCE7F3',
        gradient: ['#EC4899', '#DB2777'],
      },
      package: {
        icon: 'gift',
        label: 'Package',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        gradient: ['#F59E0B', '#D97706'],
      },
    };
    return typeInfo[type] || typeInfo.flight;
  };

  // Handle Pay Now with booking info check
  const handlePayQuote = async (quote, inquiry) => {
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
        bookingInfo = null;
      }
      
      const checkResult = BookingInfoService.checkBookingInfoComplete(
        bookingInfo,
        inquiry.inquiry_type
      );
      
      console.log('✅ Booking info check result:', {
        isComplete: checkResult.isComplete,
        missingFields: checkResult.missingFields,
      });

      if (!checkResult.isComplete) {
        console.log('📝 Booking info incomplete, navigating directly to form...');
        // Navigate directly to booking info form (skip alert for better UX)
        navigation.navigate('BookingInfoForm', {
          quoteId: quote.id,
          inquiryType: inquiry.inquiry_type,
          onComplete: (savedBookingInfo) => {
            console.log('✅ Booking info saved, status:', savedBookingInfo.status);
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

  // Render inquiry card
  const renderInquiryCard = (inquiry) => {
    const hasUnpaidQuote = inquiry.quotes?.some(
      (q) => q.status === 'sent' && q.payment_status === 'unpaid'
    );

    return (
      <TouchableOpacity
        key={inquiry.id}
        style={styles.bookingCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('InquiryDetail', { inquiryId: inquiry.id })}
      >
        <LinearGradient
          colors={['#3b82f6', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardTopBar}
        />
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="document-text" size={24} color="#3b82f6" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.bookingTitle}>
                {inquiry.inquiry_type?.charAt(0).toUpperCase() + inquiry.inquiry_type?.slice(1) || 'Request'}
              </Text>
              <Text style={styles.bookingId}>
                {inquiry.flight_destination || inquiry.hotel_destination || inquiry.cruise_destination || inquiry.package_destination || 'Custom Request'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, styles[`status${inquiry.status}`]]}>
            <Text style={styles.statusText}>{inquiry.status || 'pending'}</Text>
          </View>
        </View>

        {inquiry.quotes && inquiry.quotes.length > 0 && (
          <View style={styles.quotesSection}>
            {inquiry.quotes.map((quote) => (
              <View key={quote.id} style={styles.quoteRow}>
                <Text style={styles.quoteText}>
                  {quote.quote_number || quote.id.slice(-8)} - ${parseFloat(quote.total_amount || 0).toFixed(2)}
                </Text>
                {quote.payment_status === 'unpaid' && quote.status === 'sent' && (
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePayQuote(quote, inquiry);
                    }}
                  >
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.cardDate}>
          Created: {new Date(inquiry.created_at).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render booking card
  const renderBookingCard = (booking) => {
    const typeInfo = getBookingTypeInfo(booking.type);
    const bookingDate = new Date(booking.bookingDate || booking.orderCreatedAt);
    const isCancelled = booking.status === 'CANCELLED';
    const canModify = !isCancelled && booking.status === 'CONFIRMED';

    return (
      <TouchableOpacity
        key={booking.orderId || booking.bookingReference || booking.bookingId}
        style={styles.bookingCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('BookingDetail', { booking })}
      >
        {/* Colored Top Bar */}
        <LinearGradient
          colors={typeInfo.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardTopBar}
        />

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: typeInfo.bgColor }]}>
              <Ionicons name={typeInfo.icon} size={24} color={typeInfo.color} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.bookingTitle}>{typeInfo.label} Booking</Text>
              <Text style={styles.bookingId}>
                {booking.pnr || booking.orderId || booking.bookingReference || booking.bookingId}
              </Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            isCancelled ? styles.statusCancelled : styles.statusConfirmed
          ]}>
            <Text style={styles.statusText}>
              {booking.status || 'Confirmed'}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Booking Date</Text>
            <Text style={styles.infoValue}>
              {bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          {booking.amount && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={styles.infoValue}>{currencyService.format(booking.amount || booking.totalAmount || 0)}</Text>
            </View>
          )}

          {booking.payment?.transactionId && (
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Transaction</Text>
              <Text style={styles.infoValue}>{booking.payment.transactionId}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('BookingDetail', { booking })}
          >
            <Ionicons name="document-text-outline" size={20} color="#0890BC" />
            <Text style={styles.actionText}>Details</Text>
          </TouchableOpacity>
          {canModify && (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('BookingDetail', { booking })}
              >
                <Ionicons name="create-outline" size={20} color="#0890BC" />
                <Text style={styles.actionText}>Modify</Text>
              </TouchableOpacity>
            </>
          )}
          {!isCancelled && (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('BookingDetail', { booking })}
              >
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="airplane-outline" size={100} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No {activeTab} Bookings</Text>
      <Text style={styles.emptyStateText}>
        {isGuest
          ? 'Sign in to view your trips and bookings.'
          : `You don't have any ${activeTab.toLowerCase()} trips.\nWhen you book a trip, it will appear here.`}
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => isGuest ? navigation.navigate('Profile') : navigation.navigate('Home')}
      >
        <Text style={styles.emptyStateButtonText}>
          {isGuest ? 'Sign In' : 'Book a Trip'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#0890BC', '#055B75']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="briefcase" size={28} color="#FFF" />
            <Text style={styles.headerTitle}>My Trips</Text>
          </View>
          <TouchableOpacity
            style={styles.newRequestButton}
            onPress={() => navigation.navigate('NewRequest')}
          >
            <Text style={styles.newRequestButtonText}>+ New Request</Text>
          </TouchableOpacity>
        </View>
        {isGuest && (
          <View style={styles.guestBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#FFF" />
            <Text style={styles.guestText}>Viewing as guest</Text>
          </View>
        )}
      </LinearGradient>

      {/* Segmented Control for Status */}
      <View style={styles.segmentedControl}>
        {['Upcoming', 'Past', 'Requests'].map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segment,
              activeTab === tab && styles.segmentActive,
              index === 0 && styles.segmentFirst,
              index === 2 && styles.segmentLast,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.segmentText,
              activeTab === tab && styles.segmentTextActive
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterChipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {['All', 'Flights', 'Hotels', 'Cruise', 'Packages'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Ionicons
                name={
                  filter === 'All' ? 'list' :
                  filter === 'Flights' ? 'airplane' :
                  filter === 'Hotels' ? 'bed' :
                  filter === 'Cruise' ? 'boat' :
                  'gift'
                }
                size={18}
                color={activeFilter === filter ? '#FFF' : '#6B7280'}
              />
              <Text style={[
                styles.filterChipText,
                activeFilter === filter && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.mainContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0890BC']}
            tintColor="#0890BC"
          />
        }
      >
        {displayItems.length > 0 ? (
          <>
            <View style={styles.resultSummary}>
              <Text style={styles.resultText}>
                {displayItems.length} {activeTab.toLowerCase()} {displayItems.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
            {activeTab === 'Requests'
              ? inquiries.map(renderInquiryCard)
              : bookings.map(renderBookingCard)}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Login Popup Modal */}
      <Modal
        visible={showLoginPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLoginPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLoginPopup(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            <Ionicons name="lock-closed-outline" size={64} color="#0ea5e9" style={styles.modalIcon} />

            <Text style={styles.modalTitle}>Please Login</Text>
            <Text style={styles.modalText}>
              You need to be logged in to view your trips and manage your bookings.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setShowLoginPopup(false);
                  navigation.navigate('Profile');
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>Login Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowLoginPopup(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MyTripsScreen;
