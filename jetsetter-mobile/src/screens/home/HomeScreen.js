import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Linking,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import destinationsData from '../../data/destinations.json';
import cruiseLinesData from '../../data/cruiselines.json';
import homeService from '../../services/homeService';
import currencyService from '../../services/currencyService';
import styles from './styles/HomeScreen.styles';

const { width } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#055B75',
  primaryDark: '#034457',
  lightBlue: '#65B3CF',
  pageBg: '#F0FAFC',
  textPrimary: '#1a202c',
  textBody: '#4b5563',
  textMuted: '#6b7280',
  success: '#10b981',
  starYellow: '#FFD700',
  ctaBlue: '#0890BC',
};

// ─── IATA fallback map ────────────────────────────────────────────────────────
const CITY_TO_IATA = {
  'New York': 'JFK',
  'Los Angeles': 'LAX',
  'Chicago': 'ORD',
  'Miami': 'MIA',
  'Dallas': 'DFW',
  'San Francisco': 'SFO',
  'Seattle': 'SEA',
  'Boston': 'BOS',
  'Atlanta': 'ATL',
  'Denver': 'DEN',
  'Las Vegas': 'LAS',
  'Orlando': 'MCO',
};

const CABIN_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First'];

// ─── Special Offer Banner ─────────────────────────────────────────────────────
const SpecialOfferBanner = ({ insets }) => (
  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={[localStyles.banner, { paddingTop: (insets?.top ?? 0) + 9 }]}>
    <Ionicons name="sparkles" size={14} color={COLORS.starYellow} />
    <Text style={localStyles.bannerText} numberOfLines={1}>
      {' '}Self-Service Portal Coming Soon! Call{' '}
      <Text style={{ color: COLORS.starYellow, fontWeight: '700' }}>(877) 538-7380</Text>
    </Text>
    <View style={localStyles.bannerBadge}>
      <Ionicons name="ticket-outline" size={11} color="#fff" />
      <Text style={localStyles.bannerBadgeText}> $50 OFF</Text>
    </View>
  </LinearGradient>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ insets, navigation }) => (
  <View style={[localStyles.navbar, { paddingTop: 8 }]}>
    <Image
      source={require('../../../assets/WhatsApp_Image_2026-01-22_at_12.05.24_AM-removebg-preview.png')}
      style={localStyles.navLogo}
      resizeMode="contain"
    />
    <View style={localStyles.navRight}>
      <TouchableOpacity
        style={localStyles.navRequestBtn}
        onPress={() => Linking.openURL('tel:8775387380')}
      >
        <Ionicons name="call-outline" size={14} color="#fff" />
        <Text style={localStyles.navRequestText}> Request</Text>
      </TouchableOpacity>
      <TouchableOpacity style={localStyles.navProfile} onPress={() => navigation.navigate('Profile')}>
        <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Cruise Booking Popup ─────────────────────────────────────────────────────
const CruiseBookingPopup = ({ visible, onClose }) => {
  const [view, setView] = useState('announcement');
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', callTime: '' });

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setView('announcement');
      setFormData({ fullName: '', email: '', phone: '', callTime: '' });
    }, 400);
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setFormLoading(true);
    try {
      await homeService.sendCallbackRequest({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        callTime: formData.callTime,
      });
    } catch (_) {
      // best-effort
    } finally {
      setFormLoading(false);
      setView('success');
      setTimeout(resetAndClose, 3000);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
      <View style={styles.popupOverlay}>
        <View style={styles.popupContainer}>
          <TouchableOpacity style={styles.popupClose} onPress={resetAndClose}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.popupIcon}>
            <Ionicons name="boat" size={28} color={COLORS.ctaBlue} />
          </View>

          {/* ── Announcement view ── */}
          {view === 'announcement' && (
            <View style={styles.popupContent}>
              <Text style={styles.popupTitle}>Cruise Bookings Are</Text>
              <Text style={styles.popupTitleHighlight}>Now Open!</Text>

              <View style={styles.popupBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.popupBadgeText}>Authorized Worldwide Sellers for all Major Cruiselines</Text>
              </View>

              <Text style={styles.popupDesc}>
                Hi! We are excited to announce that bookings are open.{'\n'}
                Contact us directly to avail the best prices and get a
              </Text>

              <View style={styles.voucherCard}>
                <Ionicons name="ticket" size={20} color="#FFF" />
                <Text style={styles.voucherCardText}>$50 OFF VOUCHER</Text>
              </View>

              <TouchableOpacity
                style={styles.popupPhoneButton}
                onPress={() => Linking.openURL('tel:8775387380')}
              >
                <Ionicons name="call" size={20} color={COLORS.ctaBlue} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.popupPhoneLabel}>Direct Line</Text>
                  <Text style={styles.popupPhoneText}>(877) 538-7380</Text>
                </View>
                <Ionicons name="open-outline" size={18} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.popupEmailButton}
                onPress={() => Linking.openURL('mailto:bookings@jetsetterss.com')}
              >
                <Ionicons name="mail" size={20} color="#FFF" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.popupEmailLabel}>Send us an inquiry</Text>
                  <Text style={styles.popupEmailText}>EMAIL FOR QUOTE</Text>
                </View>
                <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.popupCallbackButton} onPress={() => setView('form')}>
                <Ionicons name="time" size={20} color="#FFF" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.popupCallbackLabel}>Fastest Response</Text>
                  <Text style={styles.popupCallbackText}>REQUEST CALL BACK</Text>
                </View>
                <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <Text style={styles.popupFooter}>Available 24/7 for you</Text>
            </View>
          )}

          {/* ── Form view ── */}
          {view === 'form' && (
            <View style={styles.popupContent}>
              <TouchableOpacity
                style={{ position: 'absolute', top: 0, left: 0, padding: 8 }}
                onPress={() => setView('announcement')}
              >
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
              </TouchableOpacity>

              <Text style={styles.formTitle}>Request a Call Back</Text>
              <Text style={styles.formSubtitle}>Our cruise expert will contact you to discuss options</Text>

              {[
                { label: 'Full Name*', icon: 'person-outline', key: 'fullName', placeholder: 'John Doe', kb: 'default' },
                { label: 'Email Address*', icon: 'mail-outline', key: 'email', placeholder: 'john@example.com', kb: 'email-address' },
                { label: 'Phone Number*', icon: 'call-outline', key: 'phone', placeholder: '+1 (123) 456-7890', kb: 'phone-pad' },
                { label: 'Preferred Call Time', icon: 'calendar-outline', key: 'callTime', placeholder: 'e.g. Weekdays after 2 PM', kb: 'default' },
              ].map(({ label, icon, key, placeholder, kb }) => (
                <View key={key} style={[styles.formGroup, { marginBottom: 12 }]}>
                  <Text style={[styles.formLabel, { marginBottom: 6 }]}>{label}</Text>
                  <View style={styles.formInputRow}>
                    <Ionicons name={icon} size={18} color="#9CA3AF" style={styles.formInputIcon} />
                    <TextInput
                      style={[styles.formInput, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 }]}
                      placeholder={placeholder}
                      keyboardType={kb}
                      value={formData[key]}
                      onChangeText={(t) => setFormData({ ...formData, [key]: t })}
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.formSubmitButton, formLoading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="call" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.formSubmitText}>Request Call Back</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Success view ── */}
          {view === 'success' && (
            <View style={[styles.popupContent, { alignItems: 'center', paddingVertical: 40 }]}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Request Received!</Text>
              <Text style={styles.successText}>
                Our cruise expert will contact you shortly.{'\n'}Get ready for your next adventure!
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // ── Cruise search state ──
  const [cruiseDestination, setCruiseDestination] = useState('');
  const [cruiseDeparturePort, setCruiseDeparturePort] = useState('');
  const [cruiseDate, setCruiseDate] = useState('');
  const [cruiseSearchLoading, setCruiseSearchLoading] = useState(false);

  // ── Flight search state (kept for FlightResults navigation) ──
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSugg, setShowFromSugg] = useState(false);
  const [showToSugg, setShowToSugg] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [departDate, setDepartDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [showDepartPicker, setShowDepartPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [travelers, setTravelers] = useState(1);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Destinations state ──
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [destLoading, setDestLoading] = useState(true);

  // ── Cheapest flights state ──
  const [cheapestFlights, setCheapestFlights] = useState([]);
  const [cheapLoading, setCheapLoading] = useState(true);

  // ── Subscribe state ──
  const [subscribeEmail, setSubscribeEmail] = useState('');

  // ── Popup state ──
  const [showPopup, setShowPopup] = useState(false);

  // ── Airport search debounce refs ──
  const fromTimer = useRef(null);
  const toTimer = useRef(null);

  // Show popup after 1.5s
  useEffect(() => {
    const t = setTimeout(() => setShowPopup(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Load popular destinations
  useEffect(() => {
    (async () => {
      try {
        const data = await homeService.getMostBookedDestinations('JFK');
        const list = Array.isArray(data) ? data : data?.destinations || data?.data || [];
        if (list.length > 0) {
          setPopularDestinations(list.slice(0, 6));
        } else {
          setPopularDestinations(destinationsData.destinations.slice(0, 6));
        }
      } catch {
        setPopularDestinations(destinationsData.destinations.slice(0, 6));
      } finally {
        setDestLoading(false);
      }
    })();
  }, []);

  // Load cheapest flights for top 3 destinations
  useEffect(() => {
    (async () => {
      const targets = ['MIA', 'LAX', 'ORD'];
      const results = [];
      for (const dest of targets) {
        try {
          const data = await homeService.getCheapestDates('JFK', dest);
          const price =
            data?.data?.[0]?.price?.total ||
            data?.cheapestPrice ||
            data?.price ||
            null;
          const destInfo = destinationsData.destinations.find(
            (d) => CITY_TO_IATA[d.name] === dest || d.name.toUpperCase().includes(dest)
          );
          results.push({
            iata: dest,
            name: destInfo?.name || dest,
            image: destInfo?.image || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800`,
            price: price ? `$${Math.round(Number(price))}` : `$${destInfo?.price || '---'}`,
          });
        } catch {
          const destInfo = destinationsData.destinations[results.length] || {};
          results.push({
            iata: dest,
            name: destInfo.name || dest,
            image: destInfo.image || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800`,
            price: `$${destInfo.price || '---'}`,
          });
        }
      }
      setCheapestFlights(results);
      setCheapLoading(false);
    })();
  }, []);

  // ── Airport autocomplete ──
  const searchAirports = async (query, setSuggestions, setShow) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShow(false);
      return;
    }
    try {
      const data = await homeService.searchAirports(query);
      const list = Array.isArray(data) ? data : data?.airports || data?.data || [];
      setSuggestions(list.slice(0, 6));
      setShow(list.length > 0);
    } catch {
      // local fallback
      const matches = Object.entries(CITY_TO_IATA)
        .filter(([city]) => city.toLowerCase().includes(query.toLowerCase()))
        .map(([city, iata]) => ({ name: city, iata_code: iata, country: 'United States' }));
      setSuggestions(matches.slice(0, 6));
      setShow(matches.length > 0);
    }
  };

  const handleFromChange = (text) => {
    setFromQuery(text);
    setSelectedFrom(null);
    clearTimeout(fromTimer.current);
    fromTimer.current = setTimeout(() => searchAirports(text, setFromSuggestions, setShowFromSugg), 350);
  };

  const handleToChange = (text) => {
    setToQuery(text);
    setSelectedTo(null);
    clearTimeout(toTimer.current);
    toTimer.current = setTimeout(() => searchAirports(text, setToSuggestions, setShowToSugg), 350);
  };

  const selectFrom = (airport) => {
    setSelectedFrom(airport);
    setFromQuery(`${airport.name} (${airport.iata_code})`);
    setShowFromSugg(false);
  };

  const selectTo = (airport) => {
    setSelectedTo(airport);
    setToQuery(`${airport.name} (${airport.iata_code})`);
    setShowToSugg(false);
  };

  const formatDate = (d) => (d ? d.toISOString().split('T')[0] : '');

  const handleCruiseSearch = async () => {
    setCruiseSearchLoading(true);
    try {
      const cruiseService = require('../../services/cruiseService').default;
      const result = await cruiseService.searchCruises({
        destination: cruiseDestination || undefined,
        departurePort: cruiseDeparturePort || undefined,
        date: cruiseDate || undefined,
      });
      if (result.success && result.cruises?.length > 0) {
        navigation.navigate('CruiseResults', {
          cruises: result.cruises,
          searchParams: { destination: cruiseDestination, departurePort: cruiseDeparturePort },
        });
      } else {
        Alert.alert('No Cruises Found', 'Try different search criteria.');
      }
    } catch {
      Alert.alert('Error', 'Unable to search cruises. Please try again.');
    } finally {
      setCruiseSearchLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedFrom || !selectedTo) {
      Alert.alert('Missing Info', 'Please select origin and destination airports.');
      return;
    }
    if (!departDate) {
      Alert.alert('Missing Info', 'Please select a departure date.');
      return;
    }
    setSearchLoading(true);
    const searchData = {
      origin: selectedFrom.iata_code,
      destination: selectedTo.iata_code,
      departureDate: formatDate(departDate),
      returnDate: returnDate ? formatDate(returnDate) : null,
      adults: travelers,
      travelClass: cabinClass.toUpperCase().replace(' ', '_'),
    };
    try {
      const result = await homeService.searchFlights(searchData);
      const flights = Array.isArray(result) ? result : result?.data || result?.flights || [];
      navigation.navigate('FlightResults', { searchData, flights });
    } catch (err) {
      Alert.alert('Search Failed', 'Unable to fetch flights. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (!subscribeEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    Alert.alert('Subscribed!', 'Thank you for subscribing to our newsletter.');
    setSubscribeEmail('');
  };

  // ── Render airport suggestion item ──
  const renderSuggestion = (item, onSelect) => (
    <TouchableOpacity key={item.iata_code} style={localStyles.suggItem} onPress={() => onSelect(item)}>
      <Ionicons name="airplane-outline" size={16} color={COLORS.primary} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={localStyles.suggName}>{item.name}</Text>
        <Text style={localStyles.suggSub}>{item.iata_code}{item.country ? ` · ${item.country}` : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.pageBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Special Offer Banner */}
        <SpecialOfferBanner insets={insets} />

        {/* 2. Navbar */}
        <Navbar insets={insets} navigation={navigation} />

        {/* 3 & 4. Hero + Cruise Search Form */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?q=80&w=1200&auto=format&fit=crop' }}
          style={localStyles.hero}
          imageStyle={{ resizeMode: 'cover' }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(3,68,87,0.70)', 'rgba(5,91,117,0.50)']}
            style={localStyles.heroOverlay}
          >
            <Text style={localStyles.heroTitle}>Discover Your Perfect Cruise</Text>
            <Text style={localStyles.heroSubtitle}>
              Explore breathtaking destinations with luxury cruise experiences
            </Text>
          </LinearGradient>
        </ImageBackground>

        {/* Cruise Search Card (overlaps hero via negative margin) */}
        <View style={localStyles.searchCard}>
          {/* Destination */}
          <View style={localStyles.inputRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} style={localStyles.inputIcon} />
            <TextInput
              style={localStyles.input}
              placeholder="Destination (e.g. Caribbean)"
              placeholderTextColor={COLORS.textMuted}
              value={cruiseDestination}
              onChangeText={setCruiseDestination}
            />
          </View>

          {/* Departure Port */}
          <View style={localStyles.inputRow}>
            <Ionicons name="boat-outline" size={18} color={COLORS.primary} style={localStyles.inputIcon} />
            <TextInput
              style={localStyles.input}
              placeholder="Departure Port (e.g. Miami)"
              placeholderTextColor={COLORS.textMuted}
              value={cruiseDeparturePort}
              onChangeText={setCruiseDeparturePort}
            />
          </View>

          {/* Date */}
          <View style={localStyles.inputRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={localStyles.inputIcon} />
            <TextInput
              style={localStyles.input}
              placeholder="When? (YYYY-MM)"
              placeholderTextColor={COLORS.textMuted}
              value={cruiseDate}
              onChangeText={setCruiseDate}
            />
          </View>

          {/* Search button */}
          <TouchableOpacity
            style={[localStyles.searchBtn, cruiseSearchLoading && { opacity: 0.7 }]}
            onPress={handleCruiseSearch}
            disabled={cruiseSearchLoading}
          >
            {cruiseSearchLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={localStyles.searchBtnText}> Search Cruises</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {/* 5. Popular Destinations */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>Popular Destinations</Text>
          <Text style={localStyles.sectionSub}>Trending routes loved by travelers</Text>
          {destLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={localStyles.grid}>
              {popularDestinations.map((dest, idx) => {
                const name = dest.name || dest.destination || dest.cityName || 'Destination';
                const country = dest.country || dest.countryName || '';
                const image = dest.image || dest.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800`;
                const rating = dest.rating || 4.5;
                const price = dest.price || dest.lowestPrice || '---';
                return (
                  <TouchableOpacity
                    key={dest.id || idx}
                    style={localStyles.destCard}
                    onPress={() => navigation.navigate('CruiseResults', {
                      cruises: [],
                      searchParams: { destination: name },
                    })}
                  >
                    <Image source={{ uri: image }} style={localStyles.destImage} />
                    <View style={localStyles.ratingBadge}>
                      <Ionicons name="star" size={11} color={COLORS.starYellow} />
                      <Text style={localStyles.ratingText}> {rating}</Text>
                    </View>
                    <View style={localStyles.destInfo}>
                      <Text style={localStyles.destName} numberOfLines={1}>{name}</Text>
                      {!!country && <Text style={localStyles.destCountry} numberOfLines={1}>{country}</Text>}
                      <Text style={localStyles.destPrice}>
                        {Number.isFinite(parseFloat(String(price).replace(/[^0-9.]/g, '')))
                          ? `From ${currencyService.format(String(price).replace(/[^0-9.]/g, ''))}`
                          : 'Price on request'}
                      </Text>
                      <TouchableOpacity
                        style={localStyles.bookBtn}
                        onPress={() => navigation.navigate('CruiseResults', {
                          cruises: [],
                          searchParams: { destination: name },
                        })}
                      >
                        <Text style={localStyles.bookBtnText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 7. Why Choose JetSetters */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>Why Choose JetSetters</Text>
          <Text style={localStyles.sectionSub}>We make travel simple, affordable, and secure</Text>
          <View style={localStyles.featureRow}>
            {[
              { icon: 'pricetag-outline', title: 'Best Prices', desc: 'We compare hundreds of airlines to get you the lowest fares guaranteed.' },
              { icon: 'shield-checkmark-outline', title: 'Secure Booking', desc: 'Your payment and personal data are protected with bank-level encryption.' },
              { icon: 'headset-outline', title: '24/7 Support', desc: 'Our travel experts are available around the clock to assist you.' },
            ].map(({ icon, title, desc }) => (
              <View key={title} style={localStyles.featureCard}>
                <View style={localStyles.featureIconWrap}>
                  <Ionicons name={icon} size={26} color={COLORS.primary} />
                </View>
                <Text style={localStyles.featureTitle}>{title}</Text>
                <Text style={localStyles.featureDesc}>{desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 8. Subscribe Section */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={localStyles.subscribeSection}>
          <Ionicons name="mail-outline" size={32} color="#fff" />
          <Text style={localStyles.subscribeTitle}>Stay in the Loop</Text>
          <Text style={localStyles.subscribeSub}>Get exclusive deals and travel tips delivered to your inbox</Text>
          <View style={localStyles.subscribeRow}>
            <TextInput
              style={localStyles.subscribeInput}
              placeholder="Enter your email"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={subscribeEmail}
              onChangeText={setSubscribeEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={localStyles.subscribeBtn} onPress={handleSubscribe}>
              <Text style={localStyles.subscribeBtnText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* 9. Cruise Booking Popup */}
      <CruiseBookingPopup visible={showPopup} onClose={() => setShowPopup(false)} />
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;

// ─── Local Styles ─────────────────────────────────────────────────────────────
const localStyles = StyleSheet.create({
  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 9,
    paddingHorizontal: 14,
  },
  bannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 11,
    marginHorizontal: 6,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ctaBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bannerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  navLogo: {
    width: 130,
    height: 40,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  navRequestText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  navProfile: {
    padding: 2,
  },

  // Hero
  hero: {
    height: 220,
    width: '100%',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Search Card
  searchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  rowHalf: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  suggBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: -6,
    marginBottom: 10,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  suggItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  suggSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  classDropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    overflow: 'hidden',
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  classOptionText: {
    fontSize: 14,
    color: COLORS.textBody,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
  },

  // Destinations grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  destCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  destImage: {
    width: '100%',
    height: 120,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  destInfo: {
    padding: 10,
  },
  destName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  destCountry: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  destPrice: {
    fontSize: 12,
    color: COLORS.textBody,
    marginBottom: 8,
    fontWeight: '500',
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Cheapest flights
  cheapSection: {
    backgroundColor: '#B9D0DC',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  cheapCard: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cheapImage: {
    width: '100%',
    height: 110,
  },
  cheapInfo: {
    padding: 12,
  },
  cheapName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cheapIata: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  cheapPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 10,
  },
  cheapBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cheapBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Why Choose
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    flex: 1,
    minWidth: (width - 60) / 3,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Subscribe
  subscribeSection: {
    marginTop: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  subscribeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 10,
    marginBottom: 6,
  },
  subscribeSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  subscribeRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    alignItems: 'center',
  },
  subscribeInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 10,
  },
  subscribeBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
  },
  subscribeBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
