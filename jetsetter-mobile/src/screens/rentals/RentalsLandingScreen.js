import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURED = [
  { name: 'Bali Villas', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600', price: 'From $89/night' },
  { name: 'Paris Apartments', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600', price: 'From $129/night' },
  { name: 'Dubai Luxury', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600', price: 'From $199/night' },
];

const BENEFITS = [
  { icon: 'shield-checkmark', title: 'Verified Properties', desc: 'All rentals are vetted for quality' },
  { icon: 'pricetag', title: 'Best Price Guarantee', desc: 'Competitive rates across platforms' },
  { icon: 'headset', title: '24/7 Support', desc: 'Help available anytime you need it' },
  { icon: 'key', title: 'Instant Confirmation', desc: 'Book now, keys at check-in' },
];

export default function RentalsLandingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={st.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#034457', '#055B75', '#0890BC']} style={[st.hero, { paddingTop: insets.top + 20 }]}>
        <Text style={st.heroTitle}>Vacation Rentals</Text>
        <Text style={st.heroSub}>Find the perfect stay — villas, apartments, and luxury homes worldwide.</Text>
        <TouchableOpacity style={st.searchBtn} onPress={() => navigation.navigate('Hotels')}>
          <Ionicons name="search" size={18} color="#055B75" />
          <Text style={st.searchBtnText}>Search Rentals</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Featured */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Featured Stays</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {FEATURED.map((item, i) => (
            <TouchableOpacity key={i} style={st.featCard} onPress={() => navigation.navigate('Hotels')} activeOpacity={0.85}>
              <Image source={{ uri: item.image }} style={st.featImage} />
              <View style={st.featBody}>
                <Text style={st.featName}>{item.name}</Text>
                <Text style={st.featPrice}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Benefits */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Why Book With Us</Text>
        {BENEFITS.map((b, i) => (
          <View key={i} style={st.benefitRow}>
            <View style={st.benefitIcon}><Ionicons name={b.icon} size={20} color="#0890BC" /></View>
            <View style={{ flex: 1 }}>
              <Text style={st.benefitTitle}>{b.title}</Text>
              <Text style={st.benefitDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={[st.section, { alignItems: 'center', paddingBottom: 40 }]}>
        <TouchableOpacity style={st.ctaBtn} onPress={() => navigation.navigate('Hotels')}>
          <Text style={st.ctaBtnText}>Browse All Rentals</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { padding: 24, paddingBottom: 28, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  searchBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, gap: 8 },
  searchBtnText: { color: '#055B75', fontWeight: '700', fontSize: 15 },
  section: { paddingHorizontal: 18, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 14 },
  featCard: { width: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  featImage: { width: '100%', height: 130 },
  featBody: { padding: 12 },
  featName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  featPrice: { fontSize: 12, color: '#0890BC', fontWeight: '600', marginTop: 3 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  benefitIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E0F7FA', alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  benefitDesc: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#055B75', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, gap: 8 },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
