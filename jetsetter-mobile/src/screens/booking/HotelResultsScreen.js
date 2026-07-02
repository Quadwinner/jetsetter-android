import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import hotelService from '../../services/hotelService';
import styles from './styles/HotelResultsScreen.styles';

const HotelResultsScreen = ({ route, navigation }) => {
  const { hotels, searchParams } = route.params;
  
  console.log('🏨 HotelResultsScreen loaded with:', {
    hotelsCount: hotels?.length,
    hotels: hotels?.map(h => ({ name: h.name, id: h.hotelId })),
    searchParams
  });
  const [sortBy, setSortBy] = useState('price');

  // Backend returns a flat hotel (price/currency/location), not an offers array.
  const hotelPrice = (h) =>
    parseFloat(h.price ?? (h.offers && h.offers[0] && h.offers[0].price) ?? 0) || 0;

  const sortedHotels = [...hotels].sort((a, b) => {
    if (sortBy === 'price') {
      return hotelPrice(a) - hotelPrice(b);
    } else if (sortBy === 'rating') {
      return (b.rating || b.stars || 0) - (a.rating || a.stars || 0);
    }
    return 0;
  });

  const renderAmenityIcon = (amenity) => {
    const iconMap = {
      wifi: 'wifi',
      pool: 'water',
      gym: 'barbell',
      restaurant: 'restaurant',
      spa: 'flower',
      breakfast: 'cafe',
      parking: 'car',
      bar: 'beer',
      beach_access: 'beach',
      concierge: 'people',
    };
    return iconMap[amenity] || 'checkmark-circle';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{searchParams.destination}</Text>
          <Text style={styles.headerSubtitle}>
            {hotelService.formatDate(searchParams.checkInDate)} - {hotelService.formatDate(searchParams.checkOutDate)}
          </Text>
        </View>
      </View>

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
          onPress={() => setSortBy('price')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonTextActive]}>
            Best Price
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
          onPress={() => setSortBy('rating')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
            Top Rated
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.resultsCount}>{sortedHotels.length} hotels found</Text>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sortedHotels.map((hotel, index) => (
          <View
            key={index}
            style={styles.hotelCard}
          >
            <Image source={{ uri: hotel.image || (hotel.images && hotel.images[0]) }} style={styles.hotelImage} />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFC107" />
              <Text style={styles.ratingText}>{hotel.rating || hotel.stars || 'N/A'}</Text>
            </View>
            <View style={styles.hotelContent}>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#64748B" />
                <Text style={styles.addressText}>{hotel.location || hotel.address?.cityName || ''}</Text>
              </View>
              <View style={styles.amenitiesRow}>
                {(hotel.amenities || []).slice(0, 4).map((amenity, i) => (
                  <Ionicons key={i} name={renderAmenityIcon(amenity)} size={16} color="#0890BC" style={styles.amenityIcon} />
                ))}
              </View>
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>From</Text>
                  <Text style={styles.priceAmount}>
                    {hotelService.formatPrice(hotelPrice(hotel), hotel.currency || 'USD')}
                  </Text>
                  <Text style={styles.perNightText}>per night</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => {
                    try {
                      console.log('🔍 View button pressed for hotel:', hotel.name);
                      console.log('🔍 Navigation params:', { hotel, searchParams });
                      console.log('🔍 Navigation object:', navigation);
                      navigation.navigate('HotelDetails', { hotel, searchParams });
                    } catch (error) {
                      console.error('❌ Navigation error:', error);
                      Alert.alert('Navigation Error', 'Unable to navigate to hotel details. Please try again.');
                    }
                  }}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

export default HotelResultsScreen;
