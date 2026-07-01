import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CruiseDetailsScreen({ route, navigation }) {
  const { cruise } = route.params;
  const insets = useSafeAreaInsets();
  
  // Default cabin types if not provided
  const cabinTypes = cruise.cabin_types || cruise.cabinTypes || [
    { type: "Interior", price: cruise.priceValue || cruise.price_per_person || 499 },
    { type: "Ocean View", price: (cruise.priceValue || cruise.price_per_person || 499) + 200 },
    { type: "Balcony", price: (cruise.priceValue || cruise.price_per_person || 499) + 400 },
    { type: "Suite", price: (cruise.priceValue || cruise.price_per_person || 499) + 800 },
  ];
  
  const [selectedCabin, setSelectedCabin] = useState(cabinTypes[0]);

  const handleBookNow = () => {
    navigation.navigate('CruiseBooking', { cruise, cabin: selectedCabin });
  };

  // Get itinerary from cruise data
  const itinerary = cruise.itinerary || [
    { day: 1, port: cruise.departurePort || cruise.departure_port || "Departure Port", arrival: "Embarkation", departure: "4:00 PM" },
    { day: 2, port: "At Sea", arrival: "All Day", departure: "All Day" },
    { day: 3, port: cruise.destinations?.[0] || "Destination", arrival: "8:00 AM", departure: "6:00 PM" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Image */}
        <Image 
          source={{ uri: cruise.image || 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800' }} 
          style={styles.heroImage} 
          resizeMode="cover"
        />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#055B75" />
        </TouchableOpacity>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.cruiseLine}>
            {cruise.cruiseLine || cruise.cruise_line} • {cruise.ship}
          </Text>
          <Text style={styles.title}>
            {cruise.name || `${cruise.duration} Night Cruise`}
          </Text>
          <Text style={styles.description}>
            {cruise.description || `Experience an unforgettable ${cruise.duration || '7 Night'} journey aboard ${cruise.ship || 'our luxury vessel'}. Visit stunning destinations including ${(cruise.destinations || []).join(', ')}.`}
          </Text>
        </View>

        {/* ITINERARY TIMELINE */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Daily Itinerary</Text>
          {itinerary.map((day, i) => (
            <View key={i} style={styles.itineraryRow}>
              <View style={styles.dayBubble}>
                <Text style={styles.dayNumber}>{day.day}</Text>
              </View>
              <View style={styles.dayContent}>
                <Text style={styles.portName}>{day.port}</Text>
                <Text style={styles.portTime}>
                  {day.arrival} {day.departure ? `• ${day.departure}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* CABIN SELECTION */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Select Cabin Type</Text>
          {cabinTypes.map((cabin, i) => {
            const isSelected = selectedCabin.type === cabin.type;
            return (
              <TouchableOpacity 
                key={i} 
                style={[styles.cabinCard, isSelected && styles.cabinCardActive]}
                onPress={() => setSelectedCabin(cabin)}
              >
                <Text style={[styles.cabinType, isSelected && styles.textWhite]}>
                  {cabin.type}
                </Text>
                <Text style={[styles.cabinPrice, isSelected && styles.textWhite]}>
                  ${cabin.price}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AMENITIES */}
        {(cruise.amenities || []).length > 0 && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {(cruise.amenities || []).slice(0, 6).map((amenity, i) => (
                <View key={i} style={styles.amenityItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* STICKY FOOTER */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View>
          <Text style={styles.totalLabel}>Total for 1 Guest</Text>
          <Text style={styles.totalPrice}>${selectedCabin.price}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  heroImage: { 
    width: '100%', 
    height: 250 
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  contentSection: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    marginBottom: 8 
  },
  cruiseLine: { 
    color: '#055B75', 
    fontSize: 12, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#1F2937', 
    marginVertical: 8 
  },
  description: { 
    color: '#4B5563', 
    lineHeight: 22,
    fontSize: 14,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1F2937', 
    marginBottom: 16 
  },
  itineraryRow: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },
  dayBubble: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#E0F7FA', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  dayNumber: { 
    color: '#055B75', 
    fontWeight: 'bold' 
  },
  dayContent: { 
    flex: 1, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6', 
    paddingBottom: 12 
  },
  portName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1F2937' 
  },
  portTime: { 
    color: '#6B7280', 
    fontSize: 14, 
    marginTop: 4 
  },
  cabinCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    marginBottom: 12 
  },
  cabinCardActive: { 
    backgroundColor: '#055B75', 
    borderColor: '#055B75' 
  },
  cabinType: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1F2937' 
  },
  cabinPrice: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#055B75' 
  },
  textWhite: { 
    color: '#FFF' 
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  amenityText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 14,
  },
  stickyFooter: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#FFF', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
  },
  totalLabel: { 
    color: '#6B7280', 
    fontSize: 14 
  },
  totalPrice: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#055B75' 
  },
  bookButton: { 
    backgroundColor: '#65B3CF', 
    paddingHorizontal: 30, 
    paddingVertical: 14, 
    borderRadius: 10 
  },
  bookButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});
