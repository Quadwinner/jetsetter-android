import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import cruiseService from '../../services/cruiseService';

const POPULAR_DESTINATIONS = [
  { name: 'Caribbean', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&auto=format&fit=crop' },
  { name: 'Mediterranean', image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73b8e?w=400&auto=format&fit=crop' },
  { name: 'Alaska', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&fit=crop' },
];

export default function CruiseHomeScreen({ navigation }) {
  const [destination, setDestination] = useState('');
  const [departurePort, setDeparturePort] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    // The results screen owns the search via useCruiseSearch(searchParams).
    const searchParams = {
      destination: destination || undefined,
      departurePort: departurePort || undefined,
      date: date || undefined,
    };
    navigation.navigate('CruiseResults', { searchParams });
  };

  const selectDestination = (dest) => {
    setDestination(dest);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          
          {/* HERO SECTION */}
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.heroContainer}
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Discover Your Perfect Cruise</Text>
              <Text style={styles.heroSubtitle}>Explore the world's most breathtaking destinations.</Text>
            </View>
          </ImageBackground>

          {/* SEARCH CARD - Overlaps Hero */}
          <View style={styles.searchCard}>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#055B75" />
              <TextInput 
                style={styles.input} 
                placeholder="Destination (e.g. Caribbean)" 
                placeholderTextColor="#9CA3AF"
                value={destination} 
                onChangeText={setDestination} 
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="boat-outline" size={20} color="#055B75" />
              <TextInput 
                style={styles.input} 
                placeholder="Departure Port (e.g. Miami)" 
                placeholderTextColor="#9CA3AF"
                value={departurePort} 
                onChangeText={setDeparturePort} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#055B75" />
              <TextInput 
                style={styles.input} 
                placeholder="When? (YYYY-MM)" 
                placeholderTextColor="#9CA3AF"
                value={date} 
                onChangeText={setDate} 
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.searchButtonText}>Search Cruises</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* POPULAR DESTINATIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Destinations</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.destScrollContainer}
            >
              {POPULAR_DESTINATIONS.map((dest, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.destCard} 
                  onPress={() => selectDestination(dest.name)}
                >
                  <Image 
                    source={{ uri: dest.image }} 
                    style={styles.destImage} 
                  />
                  <View style={styles.destOverlay}>
                    <Text style={styles.destText}>{dest.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* WHY CHOOSE US */}
          <View style={styles.perksSection}>
            <Text style={styles.sectionTitle}>Why Jetsetter Cruises?</Text>
            
            <View style={styles.perkRow}>
              <Ionicons name="pricetag-outline" size={28} color="#055B75" />
              <View style={styles.perkTextContainer}>
                <Text style={styles.perkTitle}>Best Price Guarantee</Text>
                <Text style={styles.perkSubtitle}>We match any lower price found online.</Text>
              </View>
            </View>
            
            <View style={styles.perkRow}>
              <Ionicons name="shield-checkmark-outline" size={28} color="#055B75" />
              <View style={styles.perkTextContainer}>
                <Text style={styles.perkTitle}>Secure Booking</Text>
                <Text style={styles.perkSubtitle}>Your payment is fully protected.</Text>
              </View>
            </View>
            
            <View style={styles.perkRow}>
              <Ionicons name="headset-outline" size={28} color="#055B75" />
              <View style={styles.perkTextContainer}>
                <Text style={styles.perkTitle}>24/7 Support</Text>
                <Text style={styles.perkSubtitle}>Round the clock customer service.</Text>
              </View>
            </View>
            
            <View style={styles.perkRow}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#055B75" />
              <View style={styles.perkTextContainer}>
                <Text style={styles.perkTitle}>Instant Confirmation</Text>
                <Text style={styles.perkSubtitle}>Get booking confirmation immediately.</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  heroContainer: { 
    width: '100%', 
    height: 320, 
    justifyContent: 'center' 
  },
  heroOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.45)' 
  },
  heroTextContainer: { 
    paddingHorizontal: 20, 
    marginTop: -40 
  },
  heroTitle: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#FFF', 
    textAlign: 'center', 
    textShadowColor: 'rgba(0,0,0,0.5)', 
    textShadowOffset: { width: 0, height: 2 }, 
    textShadowRadius: 4 
  },
  heroSubtitle: { 
    fontSize: 16, 
    color: '#E5E7EB', 
    textAlign: 'center', 
    marginTop: 8 
  },
  searchCard: { 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    marginTop: -60, 
    borderRadius: 16, 
    padding: 20, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 15, 
    shadowOffset: { width: 0, height: 5 } 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    marginBottom: 12, 
    height: 50 
  },
  input: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    color: '#1F2937' 
  },
  searchButton: { 
    backgroundColor: '#65B3CF', 
    borderRadius: 10, 
    height: 54, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8 
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  section: { 
    marginTop: 30 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1F2937', 
    marginHorizontal: 20, 
    marginBottom: 16 
  },
  destScrollContainer: { 
    paddingHorizontal: 16 
  },
  destCard: { 
    width: 150, 
    height: 200, 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginRight: 16 
  },
  destImage: { 
    width: '100%', 
    height: '100%' 
  },
  destOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 12, 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  destText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  perksSection: { 
    padding: 20, 
    marginTop: 10, 
    paddingBottom: 40 
  },
  perkRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5 
  },
  perkTextContainer: { 
    marginLeft: 16, 
    flex: 1 
  },
  perkTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1F2937' 
  },
  perkSubtitle: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginTop: 2 
  },
});
