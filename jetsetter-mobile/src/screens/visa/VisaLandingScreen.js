import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SERVICES = [
  { key: 'apply', label: 'Apply Now', icon: 'document-text', desc: 'Start your visa application', primary: true },
  { key: 'track', label: 'Track Application', icon: 'search', desc: 'Check your application status' },
  { key: 'myApps', label: 'My Applications', icon: 'list', desc: 'View all your applications' },
];

const TIERS = [
  { id: 'standard', label: 'Standard', time: '5–7 days', price: '$49' },
  { id: 'express', label: 'Express', time: '2–3 days', price: '$99' },
  { id: 'premium', label: 'Premium', time: '24 hours', price: '$199' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Fill Application', desc: 'Enter your travel & personal details' },
  { step: 2, title: 'Upload Documents', desc: 'Passport, photo & supporting docs' },
  { step: 3, title: 'Pay & Submit', desc: 'Secure payment via ARC Pay' },
  { step: 4, title: 'Get Your Visa', desc: 'Track status & receive your visa' },
];

export default function VisaLandingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');

  const handleCheckEligibility = () => {
    if (!nationality.trim() || !destination.trim()) return;
    navigation.navigate('VisaApply', { nationality, destination });
  };

  const handleService = (key) => {
    if (key === 'apply') navigation.navigate('VisaApply', {});
    else if (key === 'track') navigation.navigate('VisaTrack');
    else if (key === 'myApps') navigation.navigate('VisaMyApplications');
  };

  return (
    <ScrollView style={st.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={['#034457', '#055B75', '#0890BC']} style={[st.hero, { paddingTop: insets.top + 20 }]}>
        <Text style={st.heroTitle}>Fast & Secure{'\n'}Visa Processing</Text>
        <Text style={st.heroSub}>Expert assistance for 190+ countries. Apply online, track in real time.</Text>

        {/* Eligibility Checker */}
        <View style={st.eligibilityCard}>
          <Text style={st.eligibilityTitle}>Check Visa Requirements</Text>
          <TextInput style={st.input} placeholder="Your Nationality" placeholderTextColor="#94A3B8" value={nationality} onChangeText={setNationality} />
          <TextInput style={st.input} placeholder="Destination Country" placeholderTextColor="#94A3B8" value={destination} onChangeText={setDestination} />
          <TouchableOpacity style={st.checkBtn} onPress={handleCheckEligibility}>
            <Text style={st.checkBtnText}>Check & Apply</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Visa Services</Text>
        {SERVICES.map((s) => (
          <TouchableOpacity key={s.key} style={[st.serviceCard, s.primary && st.serviceCardPrimary]} onPress={() => handleService(s.key)}>
            <View style={[st.serviceIcon, s.primary && st.serviceIconPrimary]}>
              <Ionicons name={s.icon} size={22} color={s.primary ? '#fff' : '#055B75'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.serviceLabel, s.primary && { color: '#fff' }]}>{s.label}</Text>
              <Text style={[st.serviceDesc, s.primary && { color: 'rgba(255,255,255,0.8)' }]}>{s.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={s.primary ? '#fff' : '#94A3B8'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* How it Works */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>How It Works</Text>
        {HOW_IT_WORKS.map((item) => (
          <View key={item.step} style={st.stepRow}>
            <View style={st.stepCircle}><Text style={st.stepNum}>{item.step}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={st.stepTitle}>{item.title}</Text>
              <Text style={st.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Pricing Tiers */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Processing Tiers</Text>
        <View style={st.tiersRow}>
          {TIERS.map((t) => (
            <View key={t.id} style={st.tierCard}>
              <Text style={st.tierLabel}>{t.label}</Text>
              <Text style={st.tierPrice}>{t.price}</Text>
              <Text style={st.tierTime}>{t.time}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { padding: 24, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 36, marginBottom: 8 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  eligibilityCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  eligibilityTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 15, color: '#1E293B', marginBottom: 10, backgroundColor: '#F8FAFC' },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#055B75', borderRadius: 10, height: 46, marginTop: 4, gap: 8 },
  checkBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: { paddingHorizontal: 18, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 14 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 12 },
  serviceCardPrimary: { backgroundColor: '#055B75' },
  serviceIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  serviceIconPrimary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  serviceLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  serviceDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 14 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0890BC', alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  stepDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  tiersRow: { flexDirection: 'row', gap: 10 },
  tierCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  tierLabel: { fontSize: 13, fontWeight: '700', color: '#055B75', marginBottom: 4 },
  tierPrice: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  tierTime: { fontSize: 11, color: '#6B7280', marginTop: 4 },
});
