import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import cruiseService from '../../services/cruiseService';

export default function CruiseResultsScreen({ route, navigation }) {
  const { cruises: initialCruises, searchParams } = route.params;
  const [cruises, setCruises] = useState(initialCruises || []);
  const [loading, setLoading] = useState(!initialCruises?.length);

  useEffect(() => {
    if (!initialCruises?.length) {
      fetchCruises();
    }
  }, []);

  const fetchCruises = async () => {
    try {
      const response = await cruiseService.searchCruises(searchParams || {});
      if (response.success && response.cruises) {
        setCruises(response.cruises);
      }
    } catch (error) {
      console.error('Error fetching cruises:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCruiseCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('CruiseDetails', { cruise: item })}
    >
      <Image 
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800' }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      
      <View style={styles.cardBody}>
        <Text style={styles.cruiseLine}>
          {item.cruiseLine || item.cruise_line} • {item.ship}
        </Text>
        <Text style={styles.cruiseName}>
          {item.name || `${item.duration} Night ${item.destinations?.[0] || 'Cruise'}`}
        </Text>
        
        <View style={styles.detailsRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Departs: {item.departurePort || item.departure_port || 'Various Ports'}
          </Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.departureDate || item.departure_date || 'Select Dates'}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.priceText}>
              ${item.priceValue || item.price_per_person || 699}
            </Text>
          </View>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#055B75" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Results</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#055B75" />
          <Text style={styles.loadingText}>Searching best routes...</Text>
        </View>
      ) : cruises.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="boat-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No cruises found matching your criteria.</Text>
          <TouchableOpacity 
            style={styles.modifyButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.modifyButtonText}>Modify Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cruises}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderCruiseCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1F2937' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: { 
    marginTop: 16, 
    color: '#6B7280', 
    fontSize: 16 
  },
  emptyText: { 
    marginTop: 16, 
    color: '#6B7280', 
    fontSize: 16,
    textAlign: 'center',
  },
  modifyButton: {
    marginTop: 20,
    backgroundColor: '#65B3CF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modifyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: { 
    padding: 16,
    paddingBottom: 32,
  },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginBottom: 20, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 } 
  },
  cardImage: { 
    width: '100%', 
    height: 200 
  },
  cardBody: { 
    padding: 16 
  },
  cruiseLine: { 
    color: '#055B75', 
    fontSize: 12, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: 4 
  },
  cruiseName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1F2937', 
    marginBottom: 12 
  },
  detailsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  detailText: { 
    color: '#4B5563', 
    fontSize: 14, 
    marginLeft: 6 
  },
  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    marginTop: 16, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6' 
  },
  priceLabel: { 
    color: '#6B7280', 
    fontSize: 12 
  },
  priceText: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#055B75' 
  },
  viewButton: { 
    backgroundColor: '#65B3CF', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  viewButtonText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
});
