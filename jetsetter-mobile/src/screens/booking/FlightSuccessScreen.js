import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../constants/flightConstants';
import { formatTime, parseDuration } from '../../utils/flightUtils';
import currencyService from '../../services/currencyService';

export default function FlightSuccessScreen({ route, navigation }) {
  const { bookingRef, pnr, bookingData, selectedFlight } = route.params || {};
  const insets = useSafeAreaInsets();

  // Flattened backend shape → shim segments for existing first/last usages.
  const _dep = selectedFlight?.departure || {};
  const _arr = selectedFlight?.arrival || {};
  const first = { departure: { iataCode: _dep.airport, at: _dep.time }, carrierCode: selectedFlight?.airlineCode, number: selectedFlight?.flightNumber };
  const last = { arrival: { iataCode: _arr.airport, at: _arr.time } };
  const passengers = bookingData?.passengers || [];
  const fare = bookingData?.fareBreakdown || {};

  const handleShare = async () => {
    try {
      await Share.share({
        message: `✈ Flight Booking Confirmed!\nRef: ${bookingRef}\nPNR: ${pnr}\n${first?.departure?.iataCode} → ${last?.arrival?.iataCode}`,
      });
    } catch (_) {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0c1e30' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Success Banner */}
        <LinearGradient colors={[THEME.success, '#059669']} style={[s.banner, { paddingTop: insets.top + 20 }]}>
          <Ionicons name="checkmark-circle" size={60} color="#fff" />
          <Text style={s.bannerTitle}>Booking Confirmed!</Text>
          <Text style={s.bannerRef}>Ref: {bookingRef}</Text>
          {!!pnr && <Text style={s.bannerPnr}>PNR: {pnr}</Text>}
        </LinearGradient>

        {/* E-Ticket Card */}
        <View style={s.ticketCard}>
          {/* Ticket Header */}
          <LinearGradient colors={[THEME.primary, THEME.primaryDark]} style={s.ticketHeader}>
            <Ionicons name="airplane" size={22} color="#fff" />
            <Text style={s.ticketHeaderText}> JETSETTER BOARDING PASS</Text>
          </LinearGradient>

          {/* Route */}
          <View style={s.routeRow}>
            <View style={s.routePoint}>
              <Text style={s.routeCode}>{first?.departure?.iataCode}</Text>
              <Text style={s.routeTime}>{formatTime(first?.departure?.at)}</Text>
              <Text style={s.routeDate}>{first?.departure?.at?.split('T')[0]}</Text>
            </View>
            <View style={s.routeMiddle}>
              <View style={s.routeLine} />
              <Ionicons name="airplane" size={18} color={THEME.primary} />
              <View style={s.routeLine} />
            </View>
            <View style={[s.routePoint, { alignItems: 'flex-end' }]}>
              <Text style={s.routeCode}>{last?.arrival?.iataCode}</Text>
              <Text style={s.routeTime}>{formatTime(last?.arrival?.at)}</Text>
              <Text style={s.routeDate}>{last?.arrival?.at?.split('T')[0]}</Text>
            </View>
          </View>

          {/* Tear-off line */}
          <View style={s.tearLine}>
            <View style={s.tearCircleLeft} />
            <View style={s.tearDash} />
            <View style={s.tearCircleRight} />
          </View>

          {/* Booking Info Grid */}
          <View style={s.infoGrid}>
            {[
              { label: 'FLIGHT', value: selectedFlight?.flightNumber || `${first?.carrierCode || ''}` },
              { label: 'DURATION', value: selectedFlight?.duration || '' },
              { label: 'CLASS', value: bookingData?.searchParams?.travelClass || 'Economy' },
              { label: 'STOPS', value: String(selectedFlight?.stops ?? 0) },
              { label: 'BOOKING REF', value: bookingRef, mono: true },
              { label: 'STATUS', value: 'Confirmed', green: true },
            ].map(({ label, value, mono, green }) => (
              <View key={label} style={s.infoItem}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={[s.infoValue, mono && s.mono, green && { color: THEME.success }]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Passengers */}
          {passengers.length > 0 && (
            <View style={s.passSection}>
              <Text style={s.passSectionTitle}>Passengers</Text>
              {passengers.map((p, i) => (
                <View key={i} style={s.passRow}>
                  <View style={s.passAvatar}>
                    <Text style={s.passAvatarText}>{p.firstName?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={s.passName}>{p.firstName} {p.lastName}</Text>
                    <Text style={s.passType}>Adult · {p.gender}</Text>
                  </View>
                  <View style={s.confirmedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={THEME.success} />
                    <Text style={s.confirmedText}> Confirmed</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Payment Summary */}
          <View style={s.paySection}>
            <Text style={s.passSectionTitle}>Payment Summary</Text>
            {fare.baseFare && <View style={s.payRow}><Text style={s.payLabel}>Base Fare</Text><Text style={s.payVal}>{currencyService.format(fare.baseFare)}</Text></View>}
            {fare.taxes && <View style={s.payRow}><Text style={s.payLabel}>Taxes & Fees</Text><Text style={s.payVal}>{currencyService.format(fare.taxes)}</Text></View>}
            {parseFloat(fare.couponDiscount) > 0 && <View style={s.payRow}><Text style={s.payLabel}>Discount</Text><Text style={[s.payVal, { color: THEME.success }]}>-{currencyService.format(fare.couponDiscount)}</Text></View>}
            <View style={[s.payRow, s.payTotal]}>
              <Text style={s.payTotalLabel}>Total Paid</Text>
              <Text style={s.payTotalVal}>{currencyService.format(fare.totalAmount)}</Text>
            </View>
            <View style={s.paySuccessBox}>
              <Ionicons name="checkmark-circle" size={18} color={THEME.success} />
              <Text style={s.paySuccessText}> Payment Successful</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionPrimary} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={s.actionPrimaryText}> Share E-Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionSecondary} onPress={() => navigation.navigate('ManageBooking', { bookingRef })}>
            <Ionicons name="document-text-outline" size={18} color={THEME.primary} />
            <Text style={s.actionSecondaryText}> Manage Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionGhost} onPress={() => navigation.navigate('Cruise')}>
            <Text style={s.actionGhostText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  banner: { alignItems: 'center', paddingBottom: 30, paddingHorizontal: 20 },
  bannerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 12 },
  bannerRef: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6, fontFamily: 'monospace' },
  bannerPnr: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2, fontFamily: 'monospace' },
  ticketCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -20, borderRadius: 16, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  ticketHeaderText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  routePoint: { alignItems: 'flex-start' },
  routeCode: { fontSize: 28, fontWeight: '900', color: THEME.textPrimary },
  routeTime: { fontSize: 14, color: THEME.textSecondary, marginTop: 4 },
  routeDate: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  routeMiddle: { flexDirection: 'row', alignItems: 'center', flex: 1, marginHorizontal: 10 },
  routeLine: { flex: 1, height: 1, backgroundColor: THEME.border },
  tearLine: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -1 },
  tearCircleLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0c1e30', marginLeft: -10 },
  tearDash: { flex: 1, height: 1, borderWidth: 1, borderColor: THEME.border, borderStyle: 'dashed' },
  tearCircleRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0c1e30', marginRight: -10 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16 },
  infoItem: { width: '50%', paddingVertical: 8, paddingHorizontal: 4 },
  infoLabel: { fontSize: 10, fontWeight: '700', color: THEME.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 15, fontWeight: '700', color: THEME.textPrimary, marginTop: 3 },
  mono: { fontFamily: 'monospace' },
  passSection: { borderTopWidth: 1, borderTopColor: THEME.border, padding: 16 },
  passSectionTitle: { fontSize: 14, fontWeight: '700', color: THEME.textPrimary, marginBottom: 12 },
  passRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  passAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  passAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  passName: { fontSize: 14, fontWeight: '600', color: THEME.textPrimary },
  passType: { fontSize: 12, color: THEME.textSecondary },
  confirmedBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  confirmedText: { fontSize: 11, color: THEME.success, fontWeight: '600' },
  paySection: { borderTopWidth: 1, borderTopColor: THEME.border, padding: 16 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  payLabel: { fontSize: 13, color: THEME.textSecondary },
  payVal: { fontSize: 13, color: THEME.textPrimary, fontWeight: '600' },
  payTotal: { borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 10, marginTop: 4 },
  payTotalLabel: { fontSize: 15, fontWeight: '700', color: THEME.textPrimary },
  payTotalVal: { fontSize: 18, fontWeight: '800', color: THEME.primary },
  paySuccessBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', padding: 12, borderRadius: 8, marginTop: 12 },
  paySuccessText: { color: THEME.success, fontWeight: '600', fontSize: 14 },
  actions: { padding: 16, gap: 10 },
  actionPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.primary, paddingVertical: 14, borderRadius: 12 },
  actionPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: THEME.primary, paddingVertical: 14, borderRadius: 12 },
  actionSecondaryText: { color: THEME.primary, fontSize: 15, fontWeight: '700' },
  actionGhost: { alignItems: 'center', paddingVertical: 12 },
  actionGhostText: { color: THEME.textSecondary, fontSize: 14 },
});
