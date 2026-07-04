import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import bookingService from '../../services/bookingService';
import flightService from '../../services/flightService';
import hotelService from '../../services/hotelService';
import cruiseService from '../../services/cruiseService';
import packageService from '../../services/packageService';
import styles from './styles/BookingDetailScreen.styles';

const BookingDetailScreen = ({ route, navigation }) => {
  const { booking } = route.params;
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const getBookingTypeInfo = (type) => {
    const typeInfo = {
      flight: {
        icon: 'airplane',
        label: 'Flight',
        color: '#0890BC',
        bgColor: '#E0F2FE',
        gradient: ['#0890BC', '#055B75'],
        service: flightService,
      },
      cruise: {
        icon: 'boat',
        label: 'Cruise',
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        gradient: ['#8B5CF6', '#7C3AED'],
        service: cruiseService,
      },
      hotel: {
        icon: 'bed',
        label: 'Hotel',
        color: '#EC4899',
        bgColor: '#FCE7F3',
        gradient: ['#EC4899', '#DB2777'],
        service: hotelService,
      },
      package: {
        icon: 'gift',
        label: 'Package',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        gradient: ['#F59E0B', '#D97706'],
        service: packageService,
      },
    };
    return typeInfo[type] || typeInfo.flight;
  };

  const typeInfo = getBookingTypeInfo(booking.type);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    try {
      const result = await bookingService.cancelBooking(
        booking.orderId || booking.bookingReference || booking.bookingId,
        booking.type,
        cancelReason
      );

      setLoading(false);
      setShowCancelModal(false);

      if (result.success) {
        Alert.alert(
          'Booking Cancelled',
          result.message || 'Your booking has been cancelled successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                navigation.navigate('MyTrips');
              },
            },
          ]
        );
      } else {
        Alert.alert('Cancellation Failed', result.error || 'Failed to cancel booking. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Cancel booking error:', error);
    }
  };

  const handleModify = () => {
    Alert.alert(
      'Modify Booking',
      'Modification options will be available based on your booking type. This feature is coming soon.',
      [{ text: 'OK' }]
    );
  };

  const formatPrice = (amount, currency = 'USD') => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount?.toFixed(2) || '0.00'}`;
  };

  const renderFlightDetails = () => {
    const flight = booking.flight;
    const itinerary = flight?.itineraries?.[0];
    const firstSegment = itinerary?.segments?.[0];
    const lastSegment = itinerary?.segments?.[itinerary?.segments?.length - 1];

    return (
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Flight Details</Text>
        <View style={styles.detailCard}>
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <Text style={styles.airportCode}>{firstSegment?.departure?.iataCode}</Text>
              <Text style={styles.cityName}>{firstSegment?.departure?.iataCode}</Text>
            </View>
            <Ionicons name="airplane" size={24} color={typeInfo.color} />
            <View style={styles.routePoint}>
              <Text style={styles.airportCode}>{lastSegment?.arrival?.iataCode}</Text>
              <Text style={styles.cityName}>{lastSegment?.arrival?.iataCode}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>
              {flightService.formatDateTime(firstSegment?.departure?.at)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {flightService.formatDuration(itinerary?.duration)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHotelDetails = () => {
    const hotel = booking.hotel || {};
    const name = booking.hotelName || hotel.name || 'Hotel';
    const location = booking.location || booking.hotelDestination || hotel.address || '';
    const checkIn = booking.checkinDate || booking.checkInDate || hotel.checkInDate;
    const checkOut = booking.checkoutDate || booking.checkOutDate || hotel.checkOutDate;
    const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; } };
    return (
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Hotel Details</Text>
        <View style={styles.detailCard}>
          <Text style={styles.hotelName}>{name}</Text>
          {!!location && <Text style={styles.address}>{location}</Text>}
          {!!booking.roomType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Room</Text>
              <Text style={styles.detailValue}>{booking.roomType}</Text>
            </View>
          )}
          {!!checkIn && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-in</Text>
              <Text style={styles.detailValue}>{fmt(checkIn)}</Text>
            </View>
          )}
          {!!checkOut && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-out</Text>
              <Text style={styles.detailValue}>{fmt(checkOut)}</Text>
            </View>
          )}
          {!!(booking.nights) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nights</Text>
              <Text style={styles.detailValue}>{booking.nights}</Text>
            </View>
          )}
          {!!(booking.guests || booking.hotelGuests) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Guests</Text>
              <Text style={styles.detailValue}>{booking.guests || booking.hotelGuests}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCruiseDetails = () => {
    const cruise = booking.cruise;
    return (
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Cruise Details</Text>
        <View style={styles.detailCard}>
          <Text style={styles.cruiseName}>{cruise?.name || 'Cruise'}</Text>
          {cruise?.cruiseLine && (
            <Text style={styles.cruiseLine}>{cruise.cruiseLine}</Text>
          )}
          {cruise?.departureDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Departure</Text>
              <Text style={styles.detailValue}>{cruise.departureDate}</Text>
            </View>
          )}
          {cruise?.duration && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{cruise.duration}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPackageDetails = () => {
    const pkg = booking.package;
    return (
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Package Details</Text>
        <View style={styles.detailCard}>
          <Text style={styles.packageName}>{pkg?.title || booking.packageId || 'Package'}</Text>
          {pkg?.location && (
            <Text style={styles.location}>{pkg.location}</Text>
          )}
          {booking.travelDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Travel Date</Text>
              <Text style={styles.detailValue}>{booking.travelDate}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderBookingDetails = () => {
    switch (booking.type) {
      case 'flight':
        return renderFlightDetails();
      case 'hotel':
        return renderHotelDetails();
      case 'cruise':
        return renderCruiseDetails();
      case 'package':
        return renderPackageDetails();
      default:
        return null;
    }
  };

  const isCancelled = booking.status === 'CANCELLED';
  const canModify = !isCancelled && booking.status === 'CONFIRMED';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={typeInfo.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Booking Reference */}
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Booking Reference</Text>
          <Text style={styles.referenceCode}>
            {booking.pnr || booking.orderId || booking.bookingReference || booking.bookingId}
          </Text>
          <View style={[
            styles.statusBadge,
            isCancelled ? styles.statusCancelled : styles.statusConfirmed
          ]}>
            <Text style={styles.statusText}>
              {booking.status || 'CONFIRMED'}
            </Text>
          </View>
        </View>

        {/* Booking Details */}
        {renderBookingDetails()}

        {/* Travelers/Guests */}
        {booking.travelers && booking.travelers.length > 0 && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Travelers</Text>
            <View style={styles.detailCard}>
              {booking.travelers.map((traveler, index) => (
                <View key={index} style={styles.travelerRow}>
                  <Ionicons name="person" size={20} color={typeInfo.color} />
                  <Text style={styles.travelerName}>
                    {traveler.name?.firstName || traveler.firstName} {traveler.name?.lastName || traveler.lastName}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.priceValue}>
                {formatPrice(booking.amount || booking.totalAmount, booking.currency || 'USD')}
              </Text>
            </View>
            {booking.payment?.transactionId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction ID</Text>
                <Text style={styles.detailValue}>{booking.payment.transactionId}</Text>
              </View>
            )}
            {booking.payment?.status && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <Text style={styles.detailValue}>{booking.payment.status}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Booking Date */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking Date</Text>
              <Text style={styles.detailValue}>
                {new Date(booking.bookingDate || booking.orderCreatedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {!isCancelled && (
        <View style={styles.footer}>
          {canModify && (
            <TouchableOpacity
              style={[styles.actionButton, styles.modifyButton]}
              onPress={handleModify}
            >
              <Ionicons name="create-outline" size={20} color="#0890BC" />
              <Text style={styles.modifyButtonText}>Modify</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setShowCancelModal(true)}
          >
            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCancel}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Cancel Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BookingDetailScreen;















