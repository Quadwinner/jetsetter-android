import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import flightService from '../../services/flightService';
import styles from './styles/FlightResultsScreen.styles';

const FlightResultsScreen = ({ route, navigation }) => {
  const { flights, searchParams } = route.params;
  const [sortBy, setSortBy] = useState('price'); // price, duration, departure

  // Duration string like "2h 15m" → total minutes (for sorting).
  const durationToMinutes = (d) => {
    const m = String(d || '').match(/(\d+)\s*h\s*(\d+)?\s*m?/i);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2] || '0', 10) : 0;
  };

  // Sort flights based on selected criteria (backend returns a flattened shape).
  const sortedFlights = [...flights].sort((a, b) => {
    if (sortBy === 'price') {
      const priceA = parseFloat(a.price?.total || a.price?.amount || 0);
      const priceB = parseFloat(b.price?.total || b.price?.amount || 0);
      return priceA - priceB;
    } else if (sortBy === 'duration') {
      return durationToMinutes(a.duration) - durationToMinutes(b.duration);
    } else if (sortBy === 'departure') {
      return String(a.departure?.time || '').localeCompare(String(b.departure?.time || ''));
    }
    return 0;
  });

  const handleSelectFlight = (flight) => {
    navigation.navigate('FlightBooking', {
      selectedFlight: flight,
      searchParams,
    });
  };

  // Get airline logo URL from avs.io (same as JETSET13 web)
  const getAirlineLogo = (carrierCode) => {
    return `https://pics.avs.io/200/200/${(carrierCode || 'XX').toUpperCase()}.png`;
  };

  // Format time from ISO date
  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Format date from ISO date
  const formatDate = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderFlightCard = (flight, index) => {
    // Backend returns a FLATTENED shape (not raw Amadeus itineraries/segments).
    const dep = flight.departure || {};
    const arr = flight.arrival || {};
    const price = flight.price?.total || flight.price?.amount || '0';
    const currency = flight.price?.currency || 'USD';
    const duration = flight.duration || '';
    const stops = flight.stops || 0;
    const carrierCode = flight.airlineCode || 'XX';
    const airlineName = flight.airline || `${carrierCode} Airlines`;
    const flightNumber = flight.flightNumber || carrierCode;
    const viaText = (flight.stopDetails || [])
      .map((s) => s.airport || s.iataCode || s)
      .filter(Boolean)
      .join(', ');

    if (!dep.airport || !arr.airport) return null;

    return (
      <View key={flight.id || index} style={styles.flightCard}>
        {/* Card Top - Airline Info */}
        <View style={styles.cardTop}>
          <Image
            source={{ uri: getAirlineLogo(carrierCode) }}
            style={styles.airlineLogo}
            defaultSource={require('../../../assets/icon.png')}
          />
          <View style={styles.airlineInfo}>
            <Text style={styles.airlineName} numberOfLines={1}>
              {airlineName}
            </Text>
            <Text style={styles.flightNumber}>{flightNumber}</Text>
          </View>
          {stops === 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Non-stop</Text>
            </View>
          ) : (
            <Text style={styles.stopsText}>
              {stops} stop{stops > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Route Section */}
        <View style={styles.routeSection}>
          <View style={styles.routeContainer}>
            {/* Departure */}
            <View style={styles.routePoint}>
              <Text style={styles.airportCode}>{dep.airport}</Text>
              <Text style={styles.timeText}>{dep.time || ''}</Text>
              <Text style={styles.cityName}>{formatDate(dep.date)}</Text>
            </View>

            {/* Flight Path Visualization */}
            <View style={styles.flightPath}>
              <Text style={styles.pathDuration}>{duration}</Text>
              <View style={styles.pathLineContainer}>
                <View style={styles.pathLineTeal} />
                <Ionicons
                  name="airplane"
                  size={18}
                  color="#055B75"
                  style={styles.planeIcon}
                />
                <View style={styles.pathLine} />
              </View>
              {stops === 0 ? (
                <Text style={styles.pathNonStop}>Non-stop</Text>
              ) : (
                <Text style={styles.pathStops}>
                  {stops} stop{stops > 1 ? 's' : ''}{viaText ? ` via ${viaText}` : ''}
                </Text>
              )}
            </View>

            {/* Arrival */}
            <View style={styles.routePointRight}>
              <Text style={styles.airportCode}>{arr.airport}</Text>
              <Text style={styles.timeText}>{arr.time || ''}</Text>
              <Text style={styles.cityName}>{formatDate(arr.date)}</Text>
            </View>
          </View>
        </View>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="briefcase-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {(flight.cabin || searchParams.travelClass || 'ECONOMY').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="bag-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{flight.baggage ? `Baggage ${flight.baggage}` : 'Baggage included'}</Text>
          </View>
        </View>

        {/* Price and Select Button */}
        <View style={styles.priceRow}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.priceAmount}>
              {flightService.formatPrice(parseFloat(price), currency)}
            </Text>
            <Text style={styles.perPersonText}>
              for {searchParams.travelers} traveler{searchParams.travelers > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handleSelectFlight(flight)}
          >
            <Text style={styles.selectButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - Teal gradient matching JETSET13 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {searchParams.from} → {searchParams.to}
          </Text>
          <Text style={styles.headerSubtitle}>
            {searchParams.departDate} • {searchParams.travelers} traveler{searchParams.travelers > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.modifyButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {[
          { key: 'price', label: 'Cheapest', icon: 'cash-outline' },
          { key: 'duration', label: 'Fastest', icon: 'flash-outline' },
          { key: 'departure', label: 'Earliest', icon: 'sunny-outline' },
        ].map((sort) => (
          <TouchableOpacity
            key={sort.key}
            style={[styles.sortButton, sortBy === sort.key && styles.sortButtonActive]}
            onPress={() => setSortBy(sort.key)}
          >
            <Text style={[styles.sortButtonText, sortBy === sort.key && styles.sortButtonTextActive]}>
              {sort.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        <Text style={styles.resultsCountBold}>{sortedFlights.length}</Text>
        {' '}flight{sortedFlights.length !== 1 ? 's' : ''} found
      </Text>

      {/* Flight List */}
      {sortedFlights.length === 0 ? (
        <View style={styles.noResults}>
          <View style={styles.noResultsIcon}>
            <Ionicons name="airplane" size={36} color="#055B75" />
          </View>
          <Text style={styles.noResultsTitle}>No flights found</Text>
          <Text style={styles.noResultsText}>
            We couldn't find flights for this route. Try adjusting your search criteria.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {sortedFlights.map((flight, index) => renderFlightCard(flight, index))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
};

export default FlightResultsScreen;
