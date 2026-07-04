import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import airportsData from '../../data/airports.json';
import flightService from '../../services/flightService';
import styles from './styles/FlightSearchScreen.styles';

const FlightSearchScreen = ({ navigation }) => {
  const [tripType, setTripType] = useState('one-way');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [classType, setClassType] = useState('ECONOMY');
  
  // Suggestion states
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFare, setSelectedFare] = useState(null);

  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  // Date picker states
  const [showDepartPicker, setShowDepartPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [departureDate, setDepartureDate] = useState(new Date());
  const [returnDateObj, setReturnDateObj] = useState(new Date(Date.now() + 86400000 * 3));

  // Debounce timers
  const fromTimer = useRef(null);
  const toTimer = useRef(null);

  // Search airports via API with local fallback
  const searchAirports = async (text) => {
    if (text.length < 2) return [];
    try {
      const results = await flightService.searchAirports(text);
      if (results && results.length > 0) {
        // Normalize API response to match local format
        return results.slice(0, 6).map(a => ({
          city: a.cityName || a.name || a.displayName || a.city || a.code,
          code: a.code || a.iataCode,
          country: a.country || a.countryCode || '',
          name: a.name || a.displayName || '',
        }));
      }
    } catch (err) {
      console.log('API airport search failed, using local data:', err.message);
    }
    // Fallback to local airports.json
    return airportsData.airports.filter(
      (airport) =>
        airport.city.toLowerCase().includes(text.toLowerCase()) ||
        airport.code.toLowerCase().includes(text.toLowerCase()) ||
        airport.country.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 6);
  };

  const handleFromChange = (text) => {
    setFromCity(text);
    clearTimeout(fromTimer.current);
    if (text.length < 2) {
      setShowFromSuggestions(false);
      return;
    }
    fromTimer.current = setTimeout(async () => {
      const results = await searchAirports(text);
      setFromSuggestions(results);
      setShowFromSuggestions(results.length > 0);
      setShowToSuggestions(false);
    }, 300);
  };

  const handleToChange = (text) => {
    setToCity(text);
    clearTimeout(toTimer.current);
    if (text.length < 2) {
      setShowToSuggestions(false);
      return;
    }
    toTimer.current = setTimeout(async () => {
      const results = await searchAirports(text);
      setToSuggestions(results);
      setShowToSuggestions(results.length > 0);
      setShowFromSuggestions(false);
    }, 300);
  };

  const selectFromAirport = (airport) => {
    setFromCity(`${airport.city} (${airport.code})`);
    setShowFromSuggestions(false);
    setFromFocused(false);
  };

  const selectToAirport = (airport) => {
    setToCity(`${airport.city} (${airport.code})`);
    setShowToSuggestions(false);
    setToFocused(false);
  };

  const handleTripTypeChange = (type) => {
    setTripType(type);
    if (type === 'round-trip' && !returnDate) {
      // Suggest return date 3 days after departure or today if no depart date
      const baseDate = departDate ? new Date(departDate) : new Date();
      const suggestedReturn = new Date(baseDate.getTime() + 86400000 * 3);
      setReturnDateObj(suggestedReturn);
      setReturnDate(suggestedReturn.toISOString().split('T')[0]);
    }
  };

  const handleDepartDateChange = (event, selectedDate) => {
    setShowDepartPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      setDepartureDate(selectedDate);
      setDepartDate(selectedDate.toISOString().split('T')[0]);
      if (tripType === 'round-trip' && (!returnDate || selectedDate >= returnDateObj)) {
        const newReturn = new Date(selectedDate.getTime() + 86400000);
        setReturnDateObj(newReturn);
        setReturnDate(newReturn.toISOString().split('T')[0]);
      }
    }
  };

  const handleReturnDateChange = (event, selectedDate) => {
    setShowReturnPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      setReturnDateObj(selectedDate);
      setReturnDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
  };

  const handleSearch = async () => {
    if (!fromCity || !toCity || !departDate) {
      Alert.alert('Missing Information', 'Please fill in From, To, and Departure Date');
      return;
    }

    if (fromCity === toCity) {
      Alert.alert('Invalid Route', 'Departure and destination cannot be the same');
      return;
    }

    if (tripType === 'round-trip' && !returnDate) {
      Alert.alert('Missing Return Date', 'Please select a return date for round-trip');
      return;
    }

    // Extract exactly as flight-search-form.jsx does
    const fromCode = flightService.extractIataCode(fromCity);
    const toCode = flightService.extractIataCode(toCity);

    // The results screen owns the search via useFlightSearch(apiParams) — it
    // shows loading/empty/error and caches results (instant back-navigation).
    navigation.navigate('FlightResults', {
      apiParams: {
        from: fromCode,
        to: toCode,
        departDate,
        returnDate: tripType === 'round-trip' ? returnDate : '',
        tripType,
        travelers: String(travelers), // JETSET13 sends as string
        travelClass: classType,
      },
      searchParams: {
        from: fromCity,
        to: toCity,
        departDate,
        returnDate,
        tripType,
        travelers,
        travelClass: classType,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Enhanced Bright Hero Section */}
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop' }}
            style={styles.heroContainer}
          >
            <View style={styles.heroOverlay} />
            
            <View style={styles.heroTextContainer}>
              <View style={styles.heroSuperTitleContainer}>
                <View style={styles.heroSuperTitleLine} />
                <Text style={styles.heroSuperTitle}>Explore the World</Text>
              </View>
              
              <Text style={styles.heroTitleDark}>
                Find Your <Text style={styles.heroTitleHighlight}>Perfect Flight</Text> Today
              </Text>
              
              <Text style={styles.heroSubtitle}>
                Discover amazing deals on flights to destinations worldwide. Book with confidence and travel with peace of mind.
              </Text>
            </View>
          </ImageBackground>

          {/* Trip Type Selector - Centered pill above card */}
          <View style={{ zIndex: 10 }}>
            <View style={styles.tripTypeContainer}>
              <TouchableOpacity
                style={[styles.tab, tripType === 'one-way' && styles.activeTab]}
                onPress={() => handleTripTypeChange('one-way')}
              >
                <Text style={[styles.tabText, tripType === 'one-way' && styles.activeTabText]}>
                  One Way
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tripType === 'round-trip' && styles.activeTab]}
                onPress={() => handleTripTypeChange('round-trip')}
              >
                <Text style={[styles.tabText, tripType === 'round-trip' && styles.activeTabText]}>
                  Round Trip
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Search Card */}
          <View style={styles.searchCard}>
            
            {/* From Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>From</Text>
              <View style={[styles.inputContainer, fromFocused && styles.inputContainerFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="Departure city"
                  placeholderTextColor="#9CA3AF"
                  value={fromCity}
                  onChangeText={handleFromChange}
                  onFocus={() => { setFromFocused(true); setToFocused(false); setShowToSuggestions(false); }}
                  onBlur={() => setTimeout(() => { setFromFocused(false); setShowFromSuggestions(false); }, 250)}
                />
                <Ionicons name="location-outline" size={20} color="#9CA3AF" style={styles.iconRight} />
              </View>
            </View>

            {/* From Suggestions - inline, only shown when From is active */}
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <View style={styles.suggestions}>
                {fromSuggestions.map((airport, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectFromAirport(airport)}
                  >
                    <Text style={styles.suggestionCity} numberOfLines={1}>{airport.city}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#65B3CF', fontSize: 12, fontWeight: '700' }}>{airport.code}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{airport.country}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* To Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>To</Text>
              <View style={[styles.inputContainer, toFocused && styles.inputContainerFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="Destination city"
                  placeholderTextColor="#9CA3AF"
                  value={toCity}
                  onChangeText={handleToChange}
                  onFocus={() => { setToFocused(true); setFromFocused(false); setShowFromSuggestions(false); }}
                  onBlur={() => setTimeout(() => { setToFocused(false); setShowToSuggestions(false); }, 250)}
                />
                <Ionicons name="location-outline" size={20} color="#9CA3AF" style={styles.iconRight} />
              </View>
            </View>

            {/* To Suggestions - inline, only shown when To is active */}
            {showToSuggestions && toSuggestions.length > 0 && (
              <View style={styles.suggestions}>
                {toSuggestions.map((airport, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectToAirport(airport)}
                  >
                    <Text style={styles.suggestionCity} numberOfLines={1}>{airport.city}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#65B3CF', fontSize: 12, fontWeight: '700' }}>{airport.code}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{airport.country}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date Row */}
            <View style={styles.rowGroup}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Depart Date</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.inputContainer}
                  onPress={() => {
                    setShowDepartPicker(true);
                    setShowReturnPicker(false);
                  }}
                >
                  <Text style={[styles.input, !departDate && styles.placeholderText]}>
                    {departDate ? formatDisplayDate(departDate) : 'Select date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#055B75" style={styles.iconRight} />
                </TouchableOpacity>
                {showDepartPicker && (
                  <DateTimePicker
                    value={departureDate}
                    mode="date"
                    display="default"
                    onChange={handleDepartDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              {tripType === 'round-trip' && (
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Return Date</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.inputContainer}
                    onPress={() => {
                      setShowReturnPicker(true);
                      setShowDepartPicker(false);
                    }}
                  >
                    <Text style={[styles.input, !returnDate && styles.placeholderText]}>
                      {returnDate ? formatDisplayDate(returnDate) : 'Select date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#055B75" style={styles.iconRight} />
                  </TouchableOpacity>
                  {showReturnPicker && (
                    <DateTimePicker
                      value={returnDateObj}
                      mode="date"
                      display="default"
                      onChange={handleReturnDateChange}
                      minimumDate={departureDate}
                    />
                  )}
                </View>
              )}
            </View>

            {/* Travelers & Class Row */}
            <View style={styles.rowGroup}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Travelers</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                    value={String(travelers)}
                    onChangeText={(text) => setTravelers(parseInt(text) || 1)}
                    keyboardType="numeric"
                  />
                  <Ionicons name="people-outline" size={20} color="#9CA3AF" style={styles.iconRight} />
                </View>
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.label}>Class</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => {
                    const classes = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];
                    const nextIndex = (classes.indexOf(classType) + 1) % classes.length;
                    setClassType(classes[nextIndex]);
                  }}
                >
                  <Text style={styles.input}>
                    {classType.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" style={styles.iconRight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Button */}
            <TouchableOpacity
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.searchButtonText}>Searching...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#fff" />
                  <Text style={styles.searchButtonText}>Search Flights</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Special Fares (Moved below search card to match web) */}
          <View style={styles.specialFaresContainer}>
            <Text style={styles.specialFaresLabel}>Special Fares:</Text>
            <View style={styles.faresTags}>
              {[
                { id: 'student', label: 'Student' }, 
                { id: 'senior', label: 'Senior Citizen' }, 
                { id: 'armed', label: 'Armed Forces' }
              ].map((fare) => (
                <TouchableOpacity
                  key={fare.id}
                  style={[
                    styles.fareTag,
                    selectedFare === fare.id && styles.fareTagActive,
                  ]}
                  onPress={() => setSelectedFare(selectedFare === fare.id ? null : fare.id)}
                >
                  <Text style={[
                    styles.fareTagText,
                    selectedFare === fare.id && styles.fareTagTextActive,
                  ]}>
                    {fare.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Why Choose JetSetters */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>Why Choose Us</Text>
              </View>
              <Text style={styles.sectionTitle}>Why Choose JetSetters</Text>
              <Text style={styles.sectionSubtitle}>
                We make your travel experience seamless and enjoyable from booking to arrival
              </Text>
            </View>

            <View style={styles.featuresGrid}>
              {[
                { 
                  icon: 'pricetag-outline', 
                  title: 'Best Price Guarantee', 
                  desc: "Find a lower price? We'll match it and give you an additional discount on your booking." 
                },
                { 
                  icon: 'shield-checkmark-outline', 
                  title: 'Secure Booking', 
                  desc: 'Your personal and payment information is always protected with the latest security protocols.' 
                },
                { 
                  icon: 'headset-outline', 
                  title: '24/7 Support', 
                  desc: 'Our customer service team is available around the clock to assist with any questions or issues.' 
                },
              ].map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={feature.icon} size={24} color="#055B75" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FlightSearchScreen;
