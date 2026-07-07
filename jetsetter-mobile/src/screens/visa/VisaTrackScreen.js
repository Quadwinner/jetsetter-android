import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import visaService from '../../services/visaService';

const STATUS_COLORS = {
  submitted: '#3B82F6', processing: '#F59E0B', approved: '#10B981',
  rejected: '#EF4444', cancelled: '#6B7280', completed: '#10B981',
};

export default function VisaTrackScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [ref, setRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!ref.trim()) { setError('Please enter your application reference'); return; }
    setError('');
    setLoading(true);
    setApplication(null);
    try {
      const app = await visaService.trackApplication(ref.trim());
      setApplication(app);
    } catch (err) {
      setError(err.message || 'Application not found');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = STATUS_COLORS[application?.status] || '#6B7280';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Track Application</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        <Text style={s.label}>Application Reference</Text>
        <TextInput
          style={s.input}
          value={ref}
          onChangeText={setRef}
          placeholder="e.g., VISA-2026-00001"
          placeholderTextColor="#94A3B8"
          autoCapitalize="characters"
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity style={s.trackBtn} onPress={handleTrack} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="search" size={18} color="#fff" /><Text style={s.trackBtnText}>Track</Text></>}
        </TouchableOpacity>

        {application && (
          <View style={s.resultCard}>
            <View style={s.statusRow}>
              <Text style={s.resultRef}>{application.application_ref}</Text>
              <View style={[s.badge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[s.badgeText, { color: statusColor }]}>{(application.status || '').toUpperCase()}</Text>
              </View>
            </View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Destination</Text><Text style={s.detailValue}>{application.destination}</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Travel Date</Text><Text style={s.detailValue}>{application.travel_date || application.travelDate || '—'}</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Tier</Text><Text style={s.detailValue}>{application.service_tier || application.serviceTier || 'Standard'}</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Payment</Text><Text style={s.detailValue}>{application.payment_status || 'Pending'}</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Submitted</Text><Text style={s.detailValue}>{application.created_at ? new Date(application.created_at).toLocaleDateString() : '—'}</Text></View>

            {/* Timeline */}
            {application.timeline && application.timeline.length > 0 && (
              <View style={s.timeline}>
                <Text style={s.timelineTitle}>Timeline</Text>
                {application.timeline.map((event, i) => (
                  <View key={i} style={s.timelineItem}>
                    <View style={s.timelineDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.timelineEvent}>{event.title || event.event}</Text>
                      <Text style={s.timelineDate}>{event.date ? new Date(event.date).toLocaleDateString() : ''}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1E293B' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, height: 48, paddingHorizontal: 14, fontSize: 15, color: '#1E293B', backgroundColor: '#fff' },
  error: { color: '#EF4444', fontSize: 12, marginTop: 6 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#055B75', borderRadius: 10, height: 48, marginTop: 14, gap: 8 },
  trackBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultCard: { marginTop: 24, backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  resultRef: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  timeline: { marginTop: 18 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0890BC', marginTop: 4 },
  timelineEvent: { fontSize: 13, fontWeight: '600', color: '#374151' },
  timelineDate: { fontSize: 11, color: '#94A3B8' },
});
