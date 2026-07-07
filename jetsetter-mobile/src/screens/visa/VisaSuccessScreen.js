import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function VisaSuccessScreen({ route, navigation }) {
  const { applicationRef = '', destination = '', tier = 'standard' } = route.params || {};
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top + 20 }]}>
      <LinearGradient colors={['#055B75', '#0890BC']} style={s.iconWrap}>
        <Ionicons name="checkmark-circle" size={64} color="#fff" />
      </LinearGradient>

      <Text style={s.title}>Application Submitted!</Text>
      <Text style={s.subtitle}>Your visa application has been received and is being processed.</Text>

      <View style={s.card}>
        <View style={s.row}><Text style={s.label}>Reference</Text><Text style={s.value}>{applicationRef}</Text></View>
        <View style={s.row}><Text style={s.label}>Destination</Text><Text style={s.value}>{destination}</Text></View>
        <View style={s.row}><Text style={s.label}>Processing</Text><Text style={s.value}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text></View>
      </View>

      <Text style={s.note}>Save your reference number to track your application status. You'll also receive updates via email.</Text>

      <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('VisaTrack')}>
        <Ionicons name="search" size={18} color="#fff" />
        <Text style={s.primaryBtnText}>Track My Application</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Visa')}>
        <Text style={s.secondaryBtnText}>Back to Visa Services</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', paddingHorizontal: 24 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  note: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginBottom: 28, paddingHorizontal: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#055B75', borderRadius: 12, height: 50, gap: 8, marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { width: '100%', alignItems: 'center', paddingVertical: 14 },
  secondaryBtnText: { color: '#055B75', fontSize: 14, fontWeight: '600' },
});
