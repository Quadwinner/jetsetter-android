import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import flightService from '../../services/flightService';
import { THEME, CANCELLATION_REASONS } from '../../constants/flightConstants';
import { formatTime, parseDuration } from '../../utils/flightUtils';

export default function ManageBookingScreen({ route, navigation }) {
  const { bookingRef } = route.params || {};
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('details');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, []);

  const loadBooking = async () => {
    try {
      const result = await flightService.getBookingByRef(bookingRef);
      if (result.success) setBooking(result.data || result);
    } catch (err) {
      console.error('Load booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      Alert.alert('Select Reason', 'Please select a cancellation reason.');
      return;
    }
    setCancelling(true);
    try {
      const result = await flightService.cancelBooking(bookingRef, cancelReason);
      setShowCancelModal(false);
      if (result.success) {
        Alert.alert(
          'Booking Cancelled',
          `Refund of $${result.refundAmount?.toFixed(2) || '0.00'} will be processed within 5-7 business days.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Cruise') }]
        );
      } else {
        Alert.alert('Error', result.message || 'Cancellation failed');
      }
    } catch {
      Alert.alert('Error', 'Could not cancel booking. Please contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const TABS = ['details', 'passengers', 'payment'];

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={s.loadingText}>Loading booking…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: THEME.pageBg }}>
      {/* Header */}
      <LinearGradient colors={[THEME.primary, THEME.primaryDark]} style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Booking</Text>
        <View style={{ width: 22 }} />
      </LinearGradient>

      {/* Booking Ref */}
      <View style={s.refCard}>
        <Text style={s.refLabel}>Booking Reference</Text>
        <Text style={s.refValue}>{bookingRef}</Text>
        <View style={s.statusBadge}>
          <Ionicons name="checkmark-circle" size={14} color={THEME.success} />
          <Text style={s.statusText}> Confirmed</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {activeTab === 'details' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Flight Details</Text>
            {booking ? (
              <>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Route</Text>
                  <Text style={s.detailValue}>{booking.origin || '—'} → {booking.destination || '—'}</Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Date</Text>
                  <Text style={s.detailValue}>{booking.departureDate || '—'}</Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Flight</Text>
                  <Text style={s.detailValue}>{booking.flightNumber || '—'}</Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>PNR</Text>
                  <Text style={[s.detailValue, s.mono]}>{booking.pnr || '—'}</Text>
                </View>
              </>
            ) : (
              <Text style={s.noData}>Booking details not available</Text>
            )}
          </View>
        )}

        {activeTab === 'passengers' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Passengers</Text>
            {(booking?.passengers || []).length > 0 ? (
              booking.passengers.map((p, i) => (
                <View key={i} style={s.passRow}>
                  <View style={s.passAvatar}>
                    <Text style={s.passAvatarText}>{p.firstName?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={s.passName}>{p.firstName} {p.lastName}</Text>
                    <Text style={s.passType}>Adult · {p.gender}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={s.noData}>Passenger details not available</Text>
            )}
          </View>
        )}

        {activeTab === 'payment' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Payment</Text>
            {booking?.fareBreakdown ? (
              <>
                <View style={s.detailRow}><Text style={s.detailLabel}>Base Fare</Text><Text style={s.detailValue}>${booking.fareBreakdown.baseFare}</Text></View>
                <View style={s.detailRow}><Text style={s.detailLabel}>Taxes</Text><Text style={s.detailValue}>${booking.fareBreakdown.taxes}</Text></View>
                <View style={[s.detailRow, s.totalRow]}>
                  <Text style={s.totalLabel}>Total Paid</Text>
                  <Text style={s.totalValue}>${booking.fareBreakdown.totalAmount}</Text>
                </View>
              </>
            ) : (
              <Text style={s.noData}>Payment details not available</Text>
            )}
          </View>
        )}

        {/* Cancel Button */}
        <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCancelModal(true)}>
          <Ionicons name="close-circle-outline" size={18} color={THEME.error} />
          <Text style={s.cancelBtnText}> Cancel Booking</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Cancel Booking?</Text>
            <Text style={s.modalSubtitle}>A cancellation fee of $50 may apply. Select a reason:</Text>

            {CANCELLATION_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[s.reasonBtn, cancelReason === reason && s.reasonBtnActive]}
                onPress={() => setCancelReason(reason)}
              >
                <Text style={[s.reasonText, cancelReason === reason && s.reasonTextActive]}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.keepBtn} onPress={() => setShowCancelModal(false)}>
                <Text style={s.keepBtnText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmCancelBtn, cancelling && { opacity: 0.7 }]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.confirmCancelText}>Confirm Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.pageBg },
  loadingText: { marginTop: 12, color: THEME.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  refCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  refLabel: { fontSize: 12, color: THEME.textMuted, marginRight: 8 },
  refValue: { fontSize: 14, fontWeight: '700', color: THEME.textPrimary, fontFamily: 'monospace', flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, color: THEME.success, fontWeight: '600' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: THEME.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: THEME.primary },
  tabText: { fontSize: 14, color: THEME.textMuted, fontWeight: '500' },
  tabTextActive: { color: THEME.primary, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary, marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: THEME.border },
  detailLabel: { fontSize: 13, color: THEME.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: THEME.textPrimary },
  mono: { fontFamily: 'monospace' },
  totalRow: { borderBottomWidth: 0, paddingTop: 12 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: THEME.textPrimary },
  totalValue: { fontSize: 16, fontWeight: '800', color: THEME.primary },
  passRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  passAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  passAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  passName: { fontSize: 14, fontWeight: '600', color: THEME.textPrimary },
  passType: { fontSize: 12, color: THEME.textSecondary },
  noData: { color: THEME.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 8 },
  cancelBtnText: { color: THEME.error, fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: THEME.textPrimary, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: THEME.textSecondary, marginBottom: 16 },
  reasonBtn: { borderWidth: 1, borderColor: THEME.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  reasonBtnActive: { borderColor: THEME.primary, backgroundColor: '#EFF6FF' },
  reasonText: { fontSize: 14, color: THEME.textSecondary },
  reasonTextActive: { color: THEME.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  keepBtn: { flex: 1, borderWidth: 1, borderColor: THEME.border, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  keepBtnText: { color: THEME.textSecondary, fontWeight: '600' },
  confirmCancelBtn: { flex: 1, backgroundColor: THEME.error, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  confirmCancelText: { color: '#fff', fontWeight: '700' },
});
