import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePackageDetails } from '../../hooks/queries';
import currencyService from '../../services/currencyService';

const PackageDetailsScreen = ({ route, navigation }) => {
  const { packageId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: pkg, isLoading, isError } = usePackageDetails(packageId);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#0890BC" />
      </View>
    );
  }

  if (isError || !pkg) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
        <Text style={{ color: '#94A3B8', marginTop: 12, fontSize: 15 }}>Package details unavailable.</Text>
        <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#0890BC', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const highlights = Array.isArray(pkg.highlights) ? pkg.highlights : [];
  const itinerary = Array.isArray(pkg.itinerary) ? pkg.itinerary : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ position: 'relative' }}>
          {pkg.image ? (
            <Image source={{ uri: pkg.image }} style={{ width: '100%', height: 300 }} />
          ) : (
            <View style={{ width: '100%', height: 300, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={48} color="#94A3B8" />
            </View>
          )}
          <TouchableOpacity
            style={{ position: 'absolute', top: 48, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 8 }}>{pkg.title || 'Package'}</Text>
          {!!pkg.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="location" size={18} color="#64748B" />
              <Text style={{ color: '#64748B', marginLeft: 6, fontSize: 16 }}>{pkg.location}</Text>
            </View>
          )}

          {highlights.length > 0 && (
            <>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>Highlights</Text>
              {highlights.map((h, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={{ marginLeft: 8, color: '#475569' }}>{h}</Text>
                </View>
              ))}
            </>
          )}

          {itinerary.length > 0 && (
            <>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 16, marginBottom: 12 }}>Itinerary</Text>
              {itinerary.map((day, idx) => (
                <View key={day.day ?? idx} style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 8 }}>
                    {day.day ? `Day ${day.day}: ` : ''}{day.title || ''}
                  </Text>
                  {Array.isArray(day.activities) && day.activities.map((a, i) => (
                    <Text key={i} style={{ color: '#64748B', marginBottom: 4 }}>• {a}</Text>
                  ))}
                  {Array.isArray(day.meals) && day.meals.length > 0 && (
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
                      {day.meals.map((m, i) => (
                        <View key={i} style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ fontSize: 12, color: '#16A34A' }}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <View style={{ backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 12, color: '#64748B' }}>Total Price</Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#0890BC' }}>
              {currencyService.format(pkg.price || 0)}
            </Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#0890BC', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 }}
            onPress={() => navigation.navigate('PackageBooking', { package: pkg })}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PackageDetailsScreen;
