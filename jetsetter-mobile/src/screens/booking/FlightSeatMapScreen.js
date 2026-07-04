import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import flightService from '../../services/flightService';
import { useSeatMap } from '../../hooks/queries';

/**
 * FlightSeatMapScreen — interactive seat map from /flights/seatmaps.
 * Params: { selectedFlight, passengerCount, preselected, onSeatsSelected }.
 * Calls onSeatsSelected(seatObjects) on confirm and pops back.
 */
export default function FlightSeatMapScreen({ route, navigation }) {
  const { selectedFlight, passengerCount = 1, preselected = [], onSeatsSelected } = route.params || {};
  const { data: seatData, isLoading: loading } = useSeatMap(selectedFlight?.originalOffer);
  const seats = seatData?.seats || [];
  const available = seatData?.success || false;
  const [selected, setSelected] = useState(preselected.map((s) => s.number));

  // Group seats by row; derive the column list + an aisle split.
  const { rows, columns, aisleAfter } = useMemo(() => {
    const cols = Array.from(new Set(seats.map((s) => s.col))).sort();
    const byRow = {};
    seats.forEach((s) => {
      (byRow[s.row] = byRow[s.row] || {})[s.col] = s;
    });
    const rowNums = Object.keys(byRow).map(Number).sort((a, b) => a - b);
    return {
      rows: rowNums.map((r) => ({ row: r, seatsByCol: byRow[r] })),
      columns: cols,
      aisleAfter: cols[Math.ceil(cols.length / 2) - 1],
    };
  }, [seats]);

  const seatByNumber = useMemo(() => {
    const m = {}; seats.forEach((s) => { m[s.number] = s; }); return m;
  }, [seats]);

  const toggleSeat = (seat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelected((prev) => {
      if (prev.includes(seat.number)) return prev.filter((n) => n !== seat.number);
      if (prev.length >= passengerCount) {
        // Replace the oldest selection when at capacity.
        return [...prev.slice(1), seat.number];
      }
      return [...prev, seat.number];
    });
  };

  const selectedSeats = selected.map((n) => seatByNumber[n]).filter(Boolean);
  const seatFee = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
  const currency = seats[0]?.currency || 'USD';

  const confirm = () => {
    if (typeof onSeatsSelected === 'function') onSeatsSelected(selectedSeats);
    navigation.goBack();
  };

  const seatStyle = (seat) => {
    if (selected.includes(seat.number)) return [st.seat, st.seatSelected];
    if (seat.status !== 'AVAILABLE') return [st.seat, st.seatBlocked];
    return [st.seat, st.seatAvailable];
  };

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#055B75" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Select Seats</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={st.center}><ActivityIndicator size="large" color="#055B75" /><Text style={st.muted}>Loading seat map…</Text></View>
      ) : !available ? (
        <View style={st.center}>
          <Ionicons name="airplane-outline" size={48} color="#D1D5DB" />
          <Text style={st.emptyTitle}>Seat selection unavailable</Text>
          <Text style={st.muted}>This airline doesn't offer seat selection for this flight. You can continue without choosing seats.</Text>
          <TouchableOpacity style={st.confirmBtn} onPress={() => navigation.goBack()}>
            <Text style={st.confirmText}>Continue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={st.legend}>
            <View style={st.legendItem}><View style={[st.legendDot, st.seatAvailable]} /><Text style={st.legendText}>Available</Text></View>
            <View style={st.legendItem}><View style={[st.legendDot, st.seatSelected]} /><Text style={st.legendText}>Selected</Text></View>
            <View style={st.legendItem}><View style={[st.legendDot, st.seatBlocked]} /><Text style={st.legendText}>Taken</Text></View>
          </View>
          <Text style={st.hint}>Choose up to {passengerCount} seat{passengerCount > 1 ? 's' : ''}</Text>

          <ScrollView contentContainerStyle={st.grid} showsVerticalScrollIndicator={false}>
            {/* Column header */}
            <View style={st.rowLine}>
              <Text style={st.rowLabel} />
              {columns.map((c) => (
                <React.Fragment key={c}>
                  <Text style={st.colHeader}>{c}</Text>
                  {c === aisleAfter && <View style={st.aisle} />}
                </React.Fragment>
              ))}
            </View>

            {rows.map(({ row, seatsByCol }) => (
              <View key={row} style={st.rowLine}>
                <Text style={st.rowLabel}>{row}</Text>
                {columns.map((c) => {
                  const seat = seatsByCol[c];
                  return (
                    <React.Fragment key={c}>
                      {seat ? (
                        <TouchableOpacity
                          style={seatStyle(seat)}
                          onPress={() => toggleSeat(seat)}
                          disabled={seat.status !== 'AVAILABLE'}
                        >
                          <Ionicons
                            name="person"
                            size={14}
                            color={selected.includes(seat.number) ? '#fff' : seat.status !== 'AVAILABLE' ? '#9CA3AF' : '#055B75'}
                          />
                        </TouchableOpacity>
                      ) : (
                        <View style={[st.seat, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
                      )}
                      {c === aisleAfter && <View style={st.aisle} />}
                    </React.Fragment>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={st.footer}>
            <View style={{ flex: 1 }}>
              <Text style={st.muted}>{selectedSeats.length ? `Seats: ${selected.join(', ')}` : 'No seats selected'}</Text>
              <Text style={st.feeText}>Seat fee: {flightService.formatPrice(seatFee, currency)}</Text>
            </View>
            <TouchableOpacity style={st.confirmBtn} onPress={confirm}>
              <Text style={st.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const SEAT = 34;
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 12 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 18, height: 18, borderRadius: 5, borderWidth: 1 },
  legendText: { fontSize: 12, color: '#374151' },
  hint: { textAlign: 'center', color: '#6B7280', fontSize: 13, marginBottom: 8 },
  grid: { alignItems: 'center', paddingBottom: 20 },
  rowLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rowLabel: { width: 22, textAlign: 'center', color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  colHeader: { width: SEAT, textAlign: 'center', color: '#9CA3AF', fontSize: 12, fontWeight: '700', marginHorizontal: 3 },
  aisle: { width: 16 },
  seat: { width: SEAT, height: SEAT, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 },
  seatAvailable: { backgroundColor: '#EAF6FA', borderColor: '#65B3CF' },
  seatSelected: { backgroundColor: '#055B75', borderColor: '#055B75' },
  seatBlocked: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  feeText: { color: '#055B75', fontWeight: '700', fontSize: 15, marginTop: 2 },
  confirmBtn: { backgroundColor: '#055B75', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
