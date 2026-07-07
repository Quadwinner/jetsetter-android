import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import visaService from '../../services/visaService';
import currencyService from '../../services/currencyService';

const STATUS_COLORS = {
  submitted: '#3B82F6', processing: '#F59E0B', approved: '#10B981',
  rejected: '#EF4444', cancelled: '#6B7280', completed: '#10B981',
};

export default function VisaMyApplicationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await visaService.getMyApplications();
      setApps(Array.isArray(data) ? data : []);
    } catch (_) {
      setApps([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }) => {
    const color = STATUS_COLORS[item.status] || '#6B7280';
    return (
      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('VisaTrack')} activeOpacity={0.8}>
        <View style={s.cardHeader}>
          <Text style={s.cardRef}>{item.application_ref}</Text>
          <View style={[s.badge, { backgroundColor: color + '20' }]}>
            <Text style={[s.badgeText, { color }]}>{(item.status || '').toUpperCase()}</Text>
          </View>
        </View>
        <View style={s.cardBody}>
          <View style={s.infoRow}><Ionicons name="location-outline" size={14} color="#6B7280" /><Text style={s.infoText}>{item.destination}</Text></View>
          <View style={s.infoRow}><Ionicons name="calendar-outline" size={14} color="#6B7280" /><Text style={s.infoText}>{item.travel_date ? new Date(item.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</Text></View>
          <View style={s.infoRow}><Ionicons name="flash-outline" size={14} color="#6B7280" /><Text style={s.infoText}>{(item.service_tier || 'standard').charAt(0).toUpperCase() + (item.service_tier || 'standard').slice(1)}</Text></View>
          {item.amount && <View style={s.infoRow}><Ionicons name="cash-outline" size={14} color="#6B7280" /><Text style={s.infoText}>{currencyService.format(item.amount)}</Text></View>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Visa Applications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#0890BC" /></View>
      ) : apps.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="document-outline" size={48} color="#CBD5E1" />
          <Text style={s.emptyText}>No applications yet</Text>
          <TouchableOpacity style={s.applyBtn} onPress={() => navigation.navigate('VisaApply', {})}>
            <Text style={s.applyBtnText}>Apply for Visa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={apps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item.application_ref}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0890BC" />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1E293B' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 12, marginBottom: 20 },
  applyBtn: { backgroundColor: '#055B75', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardRef: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardBody: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: '#475569' },
});
