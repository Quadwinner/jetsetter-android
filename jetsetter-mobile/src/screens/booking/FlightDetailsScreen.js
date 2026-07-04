import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import flightService from '../../services/flightService';
import { useFareRules, useFareOptions } from '../../hooks/queries';

/**
 * FlightDetailsScreen — proper flight detail between Results and Booking:
 * summary + baggage + amenities, cancellation policy (/flights/fare-rules),
 * and selectable branded fare options (/flights/upsell). Uses the flat flight
 * shape + flight.originalOffer for the API calls.
 */
export default function FlightDetailsScreen({ route, navigation }) {
  const { flight, searchParams } = route.params;
  const dep = flight.departure || {};
  const arr = flight.arrival || {};

  const { data: rules, isLoading: rulesLoading } = useFareRules(flight.originalOffer);
  const { data: fo, isLoading: foLoading } = useFareOptions(flight.originalOffer);
  const loading = rulesLoading || foLoading;
  const [selectedFareId, setSelectedFareId] = useState('base');

  // Branded fare options = base fare + de-duped upsells from /flights/upsell.
  const fareOptions = useMemo(() => {
    const base = {
      id: 'base',
      label: flight.brandedFareLabel || 'Standard',
      price: parseFloat(flight.price?.total || flight.price?.amount || 0) || 0,
      currency: flight.price?.currency || 'USD',
      refundable: flight.refundable,
      baggage: flight.baggage,
      cabin: flight.cabin,
    };
    const upsells = (fo?.options || []).map((o, i) => ({
      id: o.id || `up${i}`,
      label: o.brandedFareLabel || o.brandedFare || o.cabin || `Fare ${i + 1}`,
      price: parseFloat(o.price?.total || o.price?.amount || 0) || 0,
      currency: o.price?.currency || 'USD',
      refundable: o.refundable,
      baggage: o.baggageDetails?.checked?.weight
        ? `${o.baggageDetails.checked.weight} ${o.baggageDetails.checked.weightUnit || 'KG'}`
        : o.baggage || null,
      cabin: o.cabin,
    }));
    const seen = new Set();
    return [base, ...upsells].filter((o) => {
      const k = `${o.label}-${o.price}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [fo, flight]);

  const selectedFare = fareOptions.find((o) => o.id === selectedFareId) || fareOptions[0];
  const currency = selectedFare?.currency || flight.price?.currency || 'USD';
  const displayPrice = selectedFare?.price ?? (parseFloat(flight.price?.total || 0) || 0);
  const cancel = rules?.cancellation;

  const continueToBooking = () => {
    const bookingFlight =
      selectedFare && selectedFare.id !== 'base'
        ? {
            ...flight,
            price: { ...flight.price, total: String(selectedFare.price), amount: selectedFare.price, currency },
            refundable: selectedFare.refundable,
            cabin: selectedFare.cabin || flight.cabin,
            brandedFareLabel: selectedFare.label,
          }
        : flight;
    navigation.navigate('FlightBooking', { selectedFlight: bookingFlight, searchParams });
  };

  const prettyCabin = (c) => (c || 'Economy').split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ');

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Flight Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Summary */}
        <View style={st.card}>
          <View style={st.rowBetween}>
            <View style={st.airlineRow}>
              <Image source={{ uri: `https://pics.avs.io/120/120/${(flight.airlineCode || 'XX').toUpperCase()}.png` }} style={st.logo} />
              <View>
                <Text style={st.airline}>{flight.airline || flight.airlineCode}</Text>
                <Text style={st.muted}>{flight.flightNumber} · {flight.aircraft || prettyCabin(flight.cabin)}</Text>
              </View>
            </View>
            {(flight.stops || 0) === 0 ? (
              <View style={st.nonstopBadge}><Text style={st.nonstopText}>Non-stop</Text></View>
            ) : (
              <Text style={st.muted}>{flight.stops} stop{flight.stops > 1 ? 's' : ''}</Text>
            )}
          </View>

          <View style={st.routeRow}>
            <View style={st.routeCol}>
              <Text style={st.time}>{dep.time}</Text>
              <Text style={st.code}>{dep.airport}</Text>
              <Text style={st.muted}>{dep.date}</Text>
            </View>
            <View style={st.routeMid}>
              <Text style={st.muted}>{flight.duration}</Text>
              <View style={st.line} />
              <Ionicons name="airplane" size={16} color="#055B75" />
            </View>
            <View style={[st.routeCol, { alignItems: 'flex-end' }]}>
              <Text style={st.time}>{arr.time}</Text>
              <Text style={st.code}>{arr.airport}</Text>
              <Text style={st.muted}>{arr.date}</Text>
            </View>
          </View>

          <View style={st.chipsRow}>
            <View style={st.infoChip}><Ionicons name="bag-check-outline" size={14} color="#055B75" /><Text style={st.infoChipText}>{flight.baggage ? `Bag ${flight.baggage}` : 'Baggage incl.'}</Text></View>
            <View style={st.infoChip}><Ionicons name="briefcase-outline" size={14} color="#055B75" /><Text style={st.infoChipText}>{prettyCabin(flight.cabin)}</Text></View>
            <View style={st.infoChip}><Ionicons name={flight.refundable ? 'checkmark-circle-outline' : 'close-circle-outline'} size={14} color={flight.refundable ? '#16A34A' : '#DC2626'} /><Text style={st.infoChipText}>{flight.refundable ? 'Refundable' : 'Non-refundable'}</Text></View>
          </View>
        </View>

        {/* Amenities */}
        {Array.isArray(flight.amenities) && flight.amenities.length > 0 && (
          <View style={st.card}>
            <Text style={st.sectionTitle}>What's included</Text>
            {flight.amenities.slice(0, 6).map((a, i) => (
              <View key={i} style={st.amenityRow}>
                <Ionicons name={a.isChargeable ? 'add-circle-outline' : 'checkmark-circle'} size={16} color={a.isChargeable ? '#F59E0B' : '#16A34A'} />
                <Text style={st.amenityText}>{(a.description || a.amenityType || '').replace(/_/g, ' ')}{a.isChargeable ? ' (paid)' : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cancellation policy */}
        <View style={st.card}>
          <Text style={st.sectionTitle}>Cancellation policy</Text>
          {loading ? (
            <ActivityIndicator color="#055B75" style={{ marginVertical: 8 }} />
          ) : cancel && cancel.hasData ? (
            <>
              <View style={st.policyRow}><Text style={st.muted}>Refundable</Text><Text style={[st.policyVal, { color: cancel.refundable ? '#16A34A' : '#DC2626' }]}>{cancel.refundable ? 'Yes' : 'No'}</Text></View>
              <View style={st.policyRow}><Text style={st.muted}>Cancellation fee</Text><Text style={st.policyVal}>{flightService.formatPrice(cancel.cancelFee || 0, cancel.currency || currency)}</Text></View>
              <View style={st.policyRow}><Text style={st.muted}>Change fee</Text><Text style={st.policyVal}>{flightService.formatPrice(cancel.changeFee || 0, cancel.currency || currency)}</Text></View>
              {cancel.cutoffHours != null && (
                <Text style={[st.muted, { marginTop: 6 }]}>Changes/cancellation up to {cancel.cutoffHours}h before departure.</Text>
              )}
            </>
          ) : (
            <Text style={st.muted}>Fare rules will be confirmed at checkout by the airline.</Text>
          )}
        </View>

        {/* Fare options */}
        {fareOptions.length > 1 && (
          <View style={st.card}>
            <Text style={st.sectionTitle}>Choose your fare</Text>
            {fareOptions.map((o) => {
              const active = o.id === selectedFareId;
              return (
                <TouchableOpacity key={o.id} style={[st.fareCard, active && st.fareCardActive]} onPress={() => setSelectedFareId(o.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.fareLabel, active && { color: '#055B75' }]}>{o.label}</Text>
                    <Text style={st.muted}>
                      {o.baggage ? `Checked ${o.baggage}` : 'Cabin bag only'} · {o.refundable ? 'Refundable' : 'Non-refundable'}
                    </Text>
                  </View>
                  <Text style={[st.farePrice, active && { color: '#055B75' }]}>{flightService.formatPrice(o.price, o.currency)}</Text>
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? '#055B75' : '#9CA3AF'} style={{ marginLeft: 10 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={st.footer}>
        <View>
          <Text style={st.muted}>Total price</Text>
          <Text style={st.footerPrice}>{flightService.formatPrice(displayPrice, currency)}</Text>
        </View>
        <TouchableOpacity style={st.continueBtn} onPress={continueToBooking}>
          <Text style={st.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6F8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#055B75', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  airlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6' },
  airline: { fontWeight: '700', color: '#1F2937', fontSize: 15 },
  muted: { color: '#6B7280', fontSize: 12 },
  nonstopBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  nonstopText: { color: '#16A34A', fontSize: 12, fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  routeCol: { alignItems: 'flex-start' },
  routeMid: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  line: { height: 1, backgroundColor: '#CBD5E1', width: '80%', marginVertical: 6 },
  time: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  code: { fontSize: 14, fontWeight: '700', color: '#055B75', marginTop: 2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAF6FA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  infoChipText: { color: '#055B75', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  amenityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  amenityText: { color: '#374151', fontSize: 13, flex: 1 },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  policyVal: { fontWeight: '700', color: '#1F2937', fontSize: 13 },
  fareCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 10 },
  fareCardActive: { borderColor: '#055B75', backgroundColor: '#F0F9FC' },
  fareLabel: { fontWeight: '700', color: '#1F2937', fontSize: 14, marginBottom: 3 },
  farePrice: { fontWeight: '800', color: '#1F2937', fontSize: 15 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  footerPrice: { fontSize: 22, fontWeight: '900', color: '#055B75' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#055B75', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  continueText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
