import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import flightService from '../../services/flightService';
import styles from './styles/FlightResultsScreen.styles';

const priceOf = (f) => parseFloat(f?.price?.total || f?.price?.amount || 0) || 0;

// Departure-time bucket from "HH:MM".
const departBucket = (f) => {
  const h = parseInt(String(f?.departure?.time || '').slice(0, 2), 10);
  if (isNaN(h)) return 'any';
  if (h < 6) return 'early';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

const DEPART_BUCKETS = [
  { key: 'early', label: 'Before 6 AM' },
  { key: 'morning', label: '6 AM – 12 PM' },
  { key: 'afternoon', label: '12 PM – 6 PM' },
  { key: 'evening', label: 'After 6 PM' },
];

const STOP_OPTIONS = [
  { key: 'any', label: 'Any' },
  { key: '0', label: 'Non-stop' },
  { key: '1', label: '1 Stop' },
  { key: '2', label: '2+ Stops' },
];

const FlightResultsScreen = ({ route, navigation }) => {
  const { flights, searchParams } = route.params;
  const [sortBy, setSortBy] = useState('price'); // price, duration, departure
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    stops: 'any',
    departTime: 'any',
    airlines: [],
    maxPrice: null,
    refundableOnly: false,
    baggageIncluded: false,
  });

  // Duration string like "2h 15m" → total minutes (for sorting).
  const durationToMinutes = (d) => {
    const m = String(d || '').match(/(\d+)\s*h\s*(\d+)?\s*m?/i);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2] || '0', 10) : 0;
  };

  // ── Filters (client-side on the fetched results) ──────────────
  const prices = flights.map(priceOf).filter((p) => p > 0);
  const minPriceAvail = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const maxPriceAvail = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const currency = flights[0]?.price?.currency || 'USD';

  const airlineOptions = Array.from(new Set(flights.map((f) => f.airlineCode).filter(Boolean)))
    .map((code) => ({ code, name: flights.find((f) => f.airlineCode === code)?.airline || code }));

  const priceSteps = (() => {
    if (!maxPriceAvail || maxPriceAvail <= minPriceAvail) return [];
    const span = maxPriceAvail - minPriceAvail;
    return [0.25, 0.5, 0.75, 1].map((r) => Math.round(minPriceAvail + span * r));
  })();

  const toggleAirline = (code) =>
    setFilters((p) => ({
      ...p,
      airlines: p.airlines.includes(code) ? p.airlines.filter((x) => x !== code) : [...p.airlines, code],
    }));

  const passesFilters = (f) => {
    if (filters.stops !== 'any') {
      const s = f.stops || 0;
      if (filters.stops === '2' ? s < 2 : s !== parseInt(filters.stops, 10)) return false;
    }
    if (filters.departTime !== 'any' && departBucket(f) !== filters.departTime) return false;
    if (filters.airlines.length && !filters.airlines.includes(f.airlineCode)) return false;
    if (filters.maxPrice != null && priceOf(f) > filters.maxPrice) return false;
    if (filters.refundableOnly && !f.refundable) return false;
    if (filters.baggageIncluded && !(f.baggageDetails?.checked?.weight > 0)) return false;
    return true;
  };

  const filteredFlights = flights.filter(passesFilters);

  const activeFilterCount =
    (filters.stops !== 'any' ? 1 : 0) +
    (filters.departTime !== 'any' ? 1 : 0) +
    (filters.airlines.length ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.refundableOnly ? 1 : 0) +
    (filters.baggageIncluded ? 1 : 0);

  const resetFilters = () =>
    setFilters({ stops: 'any', departTime: 'any', airlines: [], maxPrice: null, refundableOnly: false, baggageIncluded: false });

  // Sort flights based on selected criteria (backend returns a flattened shape).
  const sortedFlights = [...filteredFlights].sort((a, b) => {
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
    navigation.navigate('FlightDetails', {
      flight,
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
            <Text style={styles.selectButtonText}>View Details</Text>
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
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          {activeFilterCount > 0 && (
            <View style={fs.filterBadge}>
              <Text style={fs.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
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
            {activeFilterCount > 0
              ? 'No flights match your filters. Try clearing some.'
              : "We couldn't find flights for this route. Try adjusting your search criteria."}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity style={fs.clearButton} onPress={resetFilters}>
              <Text style={fs.clearButtonText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {sortedFlights.map((flight, index) => renderFlightCard(flight, index))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Filters bottom sheet */}
      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={fs.modalOverlay}>
          <View style={fs.sheet}>
            <View style={fs.sheetHeader}>
              <Text style={fs.sheetTitle}>Filters</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={fs.resetText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterVisible(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={fs.groupTitle}>Stops</Text>
              <View style={fs.chipRow}>
                {STOP_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.key}
                    style={[fs.chip, filters.stops === o.key && fs.chipActive]}
                    onPress={() => setFilters((p) => ({ ...p, stops: o.key }))}
                  >
                    <Text style={[fs.chipText, filters.stops === o.key && fs.chipTextActive]}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={fs.groupTitle}>Departure time</Text>
              <View style={fs.chipRow}>
                <TouchableOpacity
                  style={[fs.chip, filters.departTime === 'any' && fs.chipActive]}
                  onPress={() => setFilters((p) => ({ ...p, departTime: 'any' }))}
                >
                  <Text style={[fs.chipText, filters.departTime === 'any' && fs.chipTextActive]}>Any</Text>
                </TouchableOpacity>
                {DEPART_BUCKETS.map((b) => (
                  <TouchableOpacity
                    key={b.key}
                    style={[fs.chip, filters.departTime === b.key && fs.chipActive]}
                    onPress={() => setFilters((p) => ({ ...p, departTime: b.key }))}
                  >
                    <Text style={[fs.chipText, filters.departTime === b.key && fs.chipTextActive]}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {priceSteps.length > 0 && (
                <>
                  <Text style={fs.groupTitle}>Max price</Text>
                  <View style={fs.chipRow}>
                    <TouchableOpacity
                      style={[fs.chip, filters.maxPrice == null && fs.chipActive]}
                      onPress={() => setFilters((p) => ({ ...p, maxPrice: null }))}
                    >
                      <Text style={[fs.chipText, filters.maxPrice == null && fs.chipTextActive]}>Any</Text>
                    </TouchableOpacity>
                    {priceSteps.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[fs.chip, filters.maxPrice === p && fs.chipActive]}
                        onPress={() => setFilters((prev) => ({ ...prev, maxPrice: p }))}
                      >
                        <Text style={[fs.chipText, filters.maxPrice === p && fs.chipTextActive]}>
                          ≤ {flightService.formatPrice(p, currency)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {airlineOptions.length > 1 && (
                <>
                  <Text style={fs.groupTitle}>Airlines</Text>
                  <View style={fs.chipRow}>
                    {airlineOptions.map((a) => (
                      <TouchableOpacity
                        key={a.code}
                        style={[fs.chip, filters.airlines.includes(a.code) && fs.chipActive]}
                        onPress={() => toggleAirline(a.code)}
                      >
                        <Text
                          style={[fs.chipText, filters.airlines.includes(a.code) && fs.chipTextActive]}
                          numberOfLines={1}
                        >
                          {a.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={fs.toggleRow}
                onPress={() => setFilters((p) => ({ ...p, refundableOnly: !p.refundableOnly }))}
              >
                <Text style={fs.toggleLabel}>Refundable only</Text>
                <Ionicons
                  name={filters.refundableOnly ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={filters.refundableOnly ? '#055B75' : '#9CA3AF'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={fs.toggleRow}
                onPress={() => setFilters((p) => ({ ...p, baggageIncluded: !p.baggageIncluded }))}
              >
                <Text style={fs.toggleLabel}>Checked baggage included</Text>
                <Ionicons
                  name={filters.baggageIncluded ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={filters.baggageIncluded ? '#055B75' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={fs.applyButton} onPress={() => setFilterVisible(false)}>
              <Text style={fs.applyButtonText}>
                Show {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const fs = StyleSheet.create({
  filterBadge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444',
    minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  clearButton: { marginTop: 16, backgroundColor: '#055B75', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  clearButtonText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  resetText: { color: '#055B75', fontWeight: '700', fontSize: 15 },
  groupTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  chipActive: { backgroundColor: '#055B75', borderColor: '#055B75' },
  chipText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, marginTop: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  toggleLabel: { fontSize: 15, color: '#374151', fontWeight: '600' },
  applyButton: { backgroundColor: '#055B75', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FlightResultsScreen;
