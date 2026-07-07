import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import subscriptionService from '../../services/subscriptionService';
import currencyService from '../../services/currencyService';

const PLANS = [
  {
    id: 'premium_monthly',
    name: 'Monthly Premium',
    price: 9.99,
    period: '/month',
    discount: '5%',
    perks: [
      '5% discount on all bookings',
      'Priority 24/7 support',
      'Free standard seat selection',
      'Monthly travel newsletter',
    ],
  },
  {
    id: 'premium_annual',
    name: 'Annual Jetsetter',
    price: 79.99,
    period: '/year',
    discount: '10%',
    badge: 'Best Value',
    perks: [
      '10% discount on all bookings',
      'VIP priority support',
      'Free premium seat selection',
      'Free checked baggage (when available)',
      'Exclusive destination deals',
      'Annual travel newsletter',
    ],
  },
];

export default function MembershipScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [currentTier, setCurrentTier] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.id) { setLoading(false); return; }
      const res = await subscriptionService.getStatus(user.id);
      if (res.success && res.data) {
        setCurrentTier(res.data.subscription_tier || null);
        setEndDate(res.data.subscription_end_date || null);
      }
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadStatus(); }, [loadStatus]));

  const isPremium = currentTier === 'premium_monthly' || currentTier === 'premium_annual';

  const handleSubscribe = async (plan) => {
    setSubscribing(plan.id);
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.id) { Alert.alert('Sign In', 'Please sign in to subscribe.'); return; }

      const res = await subscriptionService.createCheckout({
        userId: user.id,
        email: user.email,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
      });

      if (res.success && res.checkoutUrl) {
        await Linking.openURL(res.checkoutUrl);
      } else {
        Alert.alert('Error', res.message || 'Failed to initialize checkout.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return <View style={st.center}><ActivityIndicator size="large" color="#0890BC" /></View>;
  }

  return (
    <ScrollView style={st.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#034457', '#055B75', '#0890BC']} style={[st.hero, { paddingTop: insets.top + 20 }]}>
        <Ionicons name="diamond" size={40} color="#F59E0B" />
        <Text style={st.heroTitle}>Jetsetter Premium</Text>
        <Text style={st.heroSub}>Unlock exclusive travel benefits and save on every booking.</Text>
      </LinearGradient>

      {/* Active Membership Banner */}
      {isPremium && (
        <View style={st.activeBanner}>
          <Ionicons name="checkmark-shield" size={28} color="#055B75" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={st.activeTitle}>You're a Premium Member!</Text>
            <Text style={st.activeSub}>
              {currentTier === 'premium_annual' ? '10%' : '5%'} off all bookings
              {endDate ? ` · Expires ${new Date(endDate).toLocaleDateString()}` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Plans */}
      <View style={st.plansSection}>
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <View key={plan.id} style={[st.planCard, isCurrent && st.planCardActive]}>
              {plan.badge && <View style={st.badge}><Text style={st.badgeText}>{plan.badge}</Text></View>}
              <Text style={st.planName}>{plan.name}</Text>
              <View style={st.priceRow}>
                <Text style={st.planPrice}>{currencyService.format(plan.price)}</Text>
                <Text style={st.planPeriod}>{plan.period}</Text>
              </View>
              <Text style={st.discountHighlight}>{plan.discount} off all bookings</Text>

              <View style={st.perksList}>
                {plan.perks.map((perk, i) => (
                  <View key={i} style={st.perkRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={st.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <View style={st.currentBadge}>
                  <Ionicons name="checkmark" size={16} color="#055B75" />
                  <Text style={st.currentBadgeText}>Current Plan</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[st.subscribeBtn, subscribing === plan.id && { opacity: 0.6 }]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={!!subscribing}
                >
                  {subscribing === plan.id
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={st.subscribeBtnText}>Subscribe</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', padding: 28, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 10 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  activeBanner: { flexDirection: 'row', alignItems: 'center', margin: 18, padding: 16, backgroundColor: '#F0FDFA', borderRadius: 14, borderWidth: 1, borderColor: '#B9D0DC' },
  activeTitle: { fontSize: 15, fontWeight: '700', color: '#055B75' },
  activeSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  plansSection: { paddingHorizontal: 18, paddingTop: 20 },
  planCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  planCardActive: { borderColor: '#0890BC', backgroundColor: '#F0FDFA' },
  badge: { position: 'absolute', top: -10, right: 16, backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  planName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 6 },
  planPrice: { fontSize: 28, fontWeight: '800', color: '#055B75' },
  planPeriod: { fontSize: 14, color: '#6B7280' },
  discountHighlight: { fontSize: 13, fontWeight: '700', color: '#10B981', marginBottom: 14 },
  perksList: { gap: 8, marginBottom: 16 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 13, color: '#475569', flex: 1 },
  subscribeBtn: { backgroundColor: '#055B75', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  subscribeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  currentBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#E0F7FA', borderRadius: 10 },
  currentBadgeText: { color: '#055B75', fontWeight: '700', fontSize: 14 },
});
