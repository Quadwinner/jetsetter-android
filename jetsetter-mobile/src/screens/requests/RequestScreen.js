import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  StyleSheet, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import requestService from '../../services/requestService';

const T = {
  primary: '#055B75', primaryDark: '#034457', accent: '#0066b2',
  pageBg: '#F9FAFB', cardBg: '#FFFFFF', border: '#E5E7EB',
  textPrimary: '#1F2937', textSecondary: '#6B7280',
  error: '#EF4444', success: '#10B981', danger: '#DC2626',
};

const INQUIRY_TYPES = [
  { id: 'flight', label: 'Flights', icon: 'airplane-outline' },
  { id: 'hotel', label: 'Hotels', icon: 'bed-outline' },
  { id: 'cruise', label: 'Cruises', icon: 'boat-outline' },
  { id: 'package', label: 'Packages', icon: 'gift-outline' },
  { id: 'general', label: 'General', icon: 'chatbubble-ellipses-outline' },
];

const CANCEL_REASONS = [
  'Change of plans', 'Found a better deal', 'Schedule conflict',
  'Personal reasons', 'Medical emergency', 'Other',
];

const PACKAGE_INTERESTS = [
  'Adventure', 'Culture', 'Relaxation', 'Food & Wine',
  'Shopping', 'Wildlife', 'History', 'Beach',
];

const DEFAULT_FORM = {
  customer_name: '', customer_email: '', customer_phone: '',
  customer_country: '', special_requirements: '', budget_range: '',
  preferred_contact_method: 'email',
  flight_origin: '', flight_destination: '',
  flight_departure_date: '', flight_return_date: '',
  flight_passengers: 1, flight_class: 'economy',
  hotel_destination: '', hotel_checkin_date: '',
  hotel_checkout_date: '', hotel_rooms: 1, hotel_guests: 1, hotel_room_type: '',
  cruise_destination: '', cruise_departure_date: '',
  cruise_duration: 7, cruise_cabin_type: '', cruise_passengers: 1,
  package_destination: '', package_start_date: '',
  package_end_date: '', package_travelers: 1,
  package_budget_range: '', package_interests: [],
  inquiry_subject: '', inquiry_message: '',
};

export default function RequestScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [inquiryType, setInquiryType] = useState('flight');
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [datePicker, setDatePicker] = useState({ visible: false, field: '' });

  // Cancel tab state
  const [cancelRef, setCancelRef] = useState('');
  const [cancelEmail, setCancelEmail] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const raw = await AsyncStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        setForm(prev => ({
          ...prev,
          customer_name: u.displayName || u.full_name || u.name || '',
          customer_email: u.email || '',
          customer_phone: u.phone || '',
        }));
      }
    } catch (_) {}
  };

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const toggleInterest = (interest) => {
    const list = form.package_interests || [];
    set('package_interests', list.includes(interest)
      ? list.filter(i => i !== interest)
      : [...list, interest]);
  };

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Required';
    if (!form.customer_email.trim() || !/\S+@\S+\.\S+/.test(form.customer_email)) e.customer_email = 'Valid email required';
    if (!form.customer_phone.trim()) e.customer_phone = 'Required';
    if (inquiryType === 'flight') {
      if (!form.flight_origin.trim()) e.flight_origin = 'Required';
      if (!form.flight_destination.trim()) e.flight_destination = 'Required';
      if (!form.flight_departure_date) e.flight_departure_date = 'Required';
    } else if (inquiryType === 'hotel') {
      if (!form.hotel_destination.trim()) e.hotel_destination = 'Required';
      if (!form.hotel_checkin_date) e.hotel_checkin_date = 'Required';
      if (!form.hotel_checkout_date) e.hotel_checkout_date = 'Required';
    } else if (inquiryType === 'cruise') {
      if (!form.cruise_destination.trim()) e.cruise_destination = 'Required';
      if (!form.cruise_departure_date) e.cruise_departure_date = 'Required';
    } else if (inquiryType === 'package') {
      if (!form.package_destination.trim()) e.package_destination = 'Required';
      if (!form.package_start_date) e.package_start_date = 'Required';
      if (!form.package_end_date) e.package_end_date = 'Required';
    } else if (inquiryType === 'general') {
      if (!form.inquiry_subject.trim()) e.inquiry_subject = 'Required';
      if (!form.inquiry_message.trim()) e.inquiry_message = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getTypeData = () => {
    if (inquiryType === 'flight') return {
      flight_origin: form.flight_origin, flight_destination: form.flight_destination,
      flight_departure_date: form.flight_departure_date, flight_return_date: form.flight_return_date || null,
      flight_passengers: form.flight_passengers, flight_class: form.flight_class,
    };
    if (inquiryType === 'hotel') return {
      hotel_destination: form.hotel_destination, hotel_checkin_date: form.hotel_checkin_date,
      hotel_checkout_date: form.hotel_checkout_date, hotel_rooms: form.hotel_rooms,
      hotel_guests: form.hotel_guests, hotel_room_type: form.hotel_room_type,
    };
    if (inquiryType === 'cruise') return {
      cruise_destination: form.cruise_destination, cruise_departure_date: form.cruise_departure_date,
      cruise_duration: form.cruise_duration, cruise_cabin_type: form.cruise_cabin_type,
      cruise_passengers: form.cruise_passengers,
    };
    if (inquiryType === 'package') return {
      package_destination: form.package_destination, package_start_date: form.package_start_date,
      package_end_date: form.package_end_date, package_travelers: form.package_travelers,
      package_budget_range: form.package_budget_range, package_interests: form.package_interests,
    };
    if (inquiryType === 'general') return {
      inquiry_subject: form.inquiry_subject, inquiry_message: form.inquiry_message,
    };
    return {};
  };

  const handleSubmit = async () => {
    if (!validate()) { Alert.alert('Missing Fields', 'Please fill in all required fields.'); return; }
    setSubmitting(true);
    try {
      const result = await requestService.submitInquiry({
        inquiry_type: inquiryType,
        customer_name: form.customer_name, customer_email: form.customer_email,
        customer_phone: form.customer_phone, customer_country: form.customer_country || null,
        special_requirements: form.special_requirements || null,
        budget_range: form.budget_range || null,
        preferred_contact_method: form.preferred_contact_method,
        ...getTypeData(),
      });
      if (result.success) {
        Alert.alert('Submitted!', result.message || 'Your inquiry has been submitted. Our travel experts will get back to you within 24 hours.');
        setForm({ ...DEFAULT_FORM });
        setErrors({});
      } else {
        Alert.alert('Error', result.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelRef.trim()) { Alert.alert('Required', 'Please enter your booking reference.'); return; }
    setCancelling(true);
    setCancelResult(null);
    try {
      const result = await requestService.cancelBooking(cancelRef.trim(), cancelEmail, cancelReason);
      setCancelResult(result);
    } catch (err) {
      setCancelResult({ success: false, error: err.message });
    } finally {
      setCancelling(false);
    }
  };

  const openDatePicker = (field) => setDatePicker({ visible: true, field });

  const onDateChange = (event, date) => {
    setDatePicker({ visible: false, field: '' });
    if (event.type === 'dismissed' || !date) return;
    set(datePicker.field, date.toISOString().split('T')[0]);
  };

  // ── Input helper ──
  const Field = ({ label, field, placeholder, keyboard, multiline, required, half }) => (
    <View style={[s.fieldWrap, half && s.fieldHalf]}>
      <Text style={s.label}>{label}{required && <Text style={{ color: T.error }}> *</Text>}</Text>
      <TextInput
        style={[s.input, errors[field] && s.inputErr, multiline && { height: 90, textAlignVertical: 'top' }]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboard || 'default'}
        multiline={multiline}
        value={String(form[field] ?? '')}
        onChangeText={v => set(field, v)}
      />
      {errors[field] && <Text style={s.errText}>{errors[field]}</Text>}
    </View>
  );

  const DateField = ({ label, field, required }) => (
    <View style={s.fieldHalf}>
      <Text style={s.label}>{label}{required && <Text style={{ color: T.error }}> *</Text>}</Text>
      <TouchableOpacity
        style={[s.input, errors[field] && s.inputErr, { justifyContent: 'center' }]}
        onPress={() => openDatePicker(field)}
      >
        <Text style={{ color: form[field] ? T.textPrimary : '#9CA3AF', fontSize: 14 }}>
          {form[field] || 'Select date'}
        </Text>
      </TouchableOpacity>
      {errors[field] && <Text style={s.errText}>{errors[field]}</Text>}
    </View>
  );

  const NumField = ({ label, field, required }) => (
    <View style={s.fieldHalf}>
      <Text style={s.label}>{label}{required && <Text style={{ color: T.error }}> *</Text>}</Text>
      <View style={s.numRow}>
        <TouchableOpacity style={s.numBtn} onPress={() => set(field, Math.max(1, (form[field] || 1) - 1))}>
          <Ionicons name="remove" size={18} color={T.accent} />
        </TouchableOpacity>
        <Text style={s.numVal}>{form[field] || 1}</Text>
        <TouchableOpacity style={s.numBtn} onPress={() => set(field, (form[field] || 1) + 1)}>
          <Ionicons name="add" size={18} color={T.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Type-specific forms ──
  const renderTypeForm = () => {
    if (inquiryType === 'flight') return (
      <View style={s.card}>
        <Text style={s.cardTitle}><Ionicons name="airplane-outline" size={18} color={T.primary} /> Flight Details</Text>
        <Field label="Origin" field="flight_origin" placeholder="e.g., New York (JFK)" required />
        <Field label="Destination" field="flight_destination" placeholder="e.g., London (LHR)" required />
        <View style={s.row}>
          <DateField label="Departure Date" field="flight_departure_date" required />
          <DateField label="Return Date" field="flight_return_date" />
        </View>
        <View style={s.row}>
          <NumField label="Passengers" field="flight_passengers" required />
          <View style={s.fieldHalf}>
            <Text style={s.label}>Class</Text>
            <View style={s.chips}>
              {['economy', 'business', 'first'].map(c => (
                <TouchableOpacity key={c} style={[s.chip, form.flight_class === c && s.chipActive]} onPress={() => set('flight_class', c)}>
                  <Text style={[s.chipText, form.flight_class === c && s.chipTextActive]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );

    if (inquiryType === 'hotel') return (
      <View style={s.card}>
        <Text style={s.cardTitle}><Ionicons name="bed-outline" size={18} color={T.primary} /> Hotel Details</Text>
        <Field label="Destination" field="hotel_destination" placeholder="e.g., Paris, France" required />
        <View style={s.row}>
          <DateField label="Check-in" field="hotel_checkin_date" required />
          <DateField label="Check-out" field="hotel_checkout_date" required />
        </View>
        <View style={s.row}>
          <NumField label="Rooms" field="hotel_rooms" required />
          <NumField label="Guests" field="hotel_guests" required />
        </View>
        <View style={s.fieldWrap}>
          <Text style={s.label}>Room Type</Text>
          <View style={s.chips}>
            {['standard', 'deluxe', 'suite', 'executive'].map(t => (
              <TouchableOpacity key={t} style={[s.chip, form.hotel_room_type === t && s.chipActive]} onPress={() => set('hotel_room_type', t)}>
                <Text style={[s.chipText, form.hotel_room_type === t && s.chipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );

    if (inquiryType === 'cruise') return (
      <View style={s.card}>
        <Text style={s.cardTitle}><Ionicons name="boat-outline" size={18} color={T.primary} /> Cruise Details</Text>
        <Field label="Destination" field="cruise_destination" placeholder="e.g., Caribbean, Mediterranean" required />
        <View style={s.row}>
          <DateField label="Departure Date" field="cruise_departure_date" required />
          <NumField label="Duration (days)" field="cruise_duration" required />
        </View>
        <View style={s.row}>
          <NumField label="Passengers" field="cruise_passengers" required />
          <View style={s.fieldHalf}>
            <Text style={s.label}>Cabin Type</Text>
            <View style={s.chips}>
              {['inside', 'oceanview', 'balcony', 'suite'].map(t => (
                <TouchableOpacity key={t} style={[s.chip, form.cruise_cabin_type === t && s.chipActive]} onPress={() => set('cruise_cabin_type', t)}>
                  <Text style={[s.chipText, form.cruise_cabin_type === t && s.chipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );

    if (inquiryType === 'package') return (
      <View style={s.card}>
        <Text style={s.cardTitle}><Ionicons name="gift-outline" size={18} color={T.primary} /> Package Details</Text>
        <Field label="Destination" field="package_destination" placeholder="e.g., Hawaii, Europe" required />
        <View style={s.row}>
          <DateField label="Start Date" field="package_start_date" required />
          <DateField label="End Date" field="package_end_date" required />
        </View>
        <NumField label="Travelers" field="package_travelers" required />
        <View style={s.fieldWrap}>
          <Text style={s.label}>Interests</Text>
          <View style={s.interestGrid}>
            {PACKAGE_INTERESTS.map(i => {
              const sel = (form.package_interests || []).includes(i);
              return (
                <TouchableOpacity key={i} style={[s.interestChip, sel && s.interestChipActive]} onPress={() => toggleInterest(i)}>
                  <Text style={[s.interestText, sel && s.interestTextActive]}>{i}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );

    if (inquiryType === 'general') return (
      <View style={s.card}>
        <Text style={s.cardTitle}><Ionicons name="chatbubble-ellipses-outline" size={18} color={T.primary} /> Inquiry Details</Text>
        <Field label="Subject" field="inquiry_subject" placeholder="What is your inquiry about?" required />
        <Field label="Message" field="inquiry_message" placeholder="Please describe your inquiry in detail..." multiline required />
      </View>
    );
  };

  // ── Tab 1: New Inquiry ──
  const renderInquiryTab = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      {/* Type Selector */}
      <View style={s.typeRow}>
        {INQUIRY_TYPES.map(t => {
          const active = inquiryType === t.id;
          return (
            <TouchableOpacity key={t.id} style={[s.typeCard, active && s.typeCardActive]} onPress={() => setInquiryType(t.id)}>
              <Ionicons name={t.icon} size={24} color={active ? T.accent : '#9CA3AF'} />
              <Text style={[s.typeLabel, active && s.typeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Type-specific form */}
      {renderTypeForm()}

      {/* Contact Info */}
      <View style={s.card}>
        <Text style={s.cardTitle}><Ionicons name="person-outline" size={18} color={T.primary} /> Contact Information</Text>
        <Field label="Full Name" field="customer_name" placeholder="Enter your full name" required />
        <View style={s.row}>
          <Field label="Email" field="customer_email" placeholder="your@email.com" keyboard="email-address" required half />
          <Field label="Phone" field="customer_phone" placeholder="+1 234 567 8900" keyboard="phone-pad" required half />
        </View>
        <Field label="Country" field="customer_country" placeholder="Your country" />
        <Field label="Budget Range" field="budget_range" placeholder="e.g., $2,000 - $5,000" />
        <Field label="Special Requirements" field="special_requirements" placeholder="Dietary needs, accessibility, etc." multiline />

        {/* Preferred Contact */}
        <Text style={s.label}>Preferred Contact Method</Text>
        <View style={s.radioRow}>
          {['email', 'phone', 'whatsapp'].map(m => (
            <TouchableOpacity key={m} style={s.radioItem} onPress={() => set('preferred_contact_method', m)}>
              <View style={[s.radio, form.preferred_contact_method === m && s.radioActive]}>
                {form.preferred_contact_method === m && <View style={s.radioDot} />}
              </View>
              <Text style={s.radioLabel}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit */}
      <View style={s.btnRow}>
        <TouchableOpacity style={s.clearBtn} onPress={() => { setForm({ ...DEFAULT_FORM }); setErrors({}); }}>
          <Text style={s.clearBtnText}>Clear Form</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.submitBtnText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ── Tab 2: Modify Booking ──
  const renderModifyTab = () => (
    <View style={s.centerTab}>
      <View style={s.modifyIcon}>
        <Ionicons name="refresh-outline" size={48} color="#9CA3AF" />
      </View>
      <Text style={s.modifyTitle}>Modify Booking</Text>
      <Text style={s.modifyText}>
        To modify an existing booking, please contact our support team directly. Our agents will assist you with any changes to your reservation.
      </Text>
      <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL('mailto:support@jetsetterss.com')}>
        <Ionicons name="mail-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={s.contactBtnText}>Contact Support</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.phoneBtn} onPress={() => Linking.openURL('tel:8775387380')}>
        <Ionicons name="call-outline" size={18} color={T.primary} style={{ marginRight: 8 }} />
        <Text style={s.phoneBtnText}>(877) 538-7380</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Tab 3: Cancel Booking ──
  const renderCancelTab = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <View style={s.card}>
        <Text style={s.cardTitle}><Ionicons name="close-circle-outline" size={18} color={T.danger} /> Cancel Booking</Text>

        {cancelResult && (
          <View style={cancelResult.success ? s.successBox : s.errorBox}>
            <Ionicons name={cancelResult.success ? 'checkmark-circle' : 'alert-circle'} size={20} color={cancelResult.success ? T.success : T.error} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[s.resultTitle, { color: cancelResult.success ? '#166534' : '#991B1B' }]}>
                {cancelResult.success ? 'Booking Cancelled' : 'Cancellation Failed'}
              </Text>
              {cancelResult.success && cancelResult.booking?.refundAmount && (
                <Text style={{ color: '#15803D', fontSize: 13, marginTop: 4 }}>
                  Refund of ${cancelResult.booking.refundAmount} will be processed within 5-7 business days.
                </Text>
              )}
              {!cancelResult.success && (
                <Text style={{ color: '#B91C1C', fontSize: 13, marginTop: 4 }}>
                  {cancelResult.error || cancelResult.message || 'Booking not found or already cancelled.'}
                </Text>
              )}
            </View>
          </View>
        )}

        <Text style={s.label}>Booking Reference <Text style={{ color: T.error }}>*</Text></Text>
        <TextInput
          style={s.input}
          placeholder="e.g. BOOK-m5kp2q3r"
          placeholderTextColor="#9CA3AF"
          value={cancelRef}
          onChangeText={setCancelRef}
          autoCapitalize="none"
        />

        <Text style={[s.label, { marginTop: 12 }]}>Email (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="Email used when booking"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={cancelEmail}
          onChangeText={setCancelEmail}
        />

        <Text style={[s.label, { marginTop: 12 }]}>Reason</Text>
        <View style={s.chips}>
          {CANCEL_REASONS.map(r => (
            <TouchableOpacity key={r} style={[s.chip, cancelReason === r && s.chipActive]} onPress={() => setCancelReason(r)}>
              <Text style={[s.chipText, cancelReason === r && s.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.cancelBtn, (!cancelRef.trim() || cancelling) && { opacity: 0.5 }]}
          onPress={handleCancel}
          disabled={!cancelRef.trim() || cancelling}
        >
          {cancelling ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.cancelBtnText}>Cancel Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const TABS = [
    { label: 'New Inquiry', icon: 'send-outline' },
    { label: 'Modify', icon: 'refresh-outline' },
    { label: 'Cancel', icon: 'close-circle-outline' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: T.pageBg }}>
      {/* Header */}
      <LinearGradient colors={[T.primary, T.primaryDark]} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Text style={s.headerTitle}>Start Your Journey</Text>
        <Text style={s.headerSub}>Tell us about your dream trip and we'll make it happen</Text>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={i} style={[s.tabItem, activeTab === i && s.tabItemActive]} onPress={() => setActiveTab(i)}>
            <Ionicons name={tab.icon} size={16} color={activeTab === i ? T.accent : T.textSecondary} />
            <Text style={[s.tabLabel, activeTab === i && s.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {activeTab === 0 && renderInquiryTab()}
        {activeTab === 1 && renderModifyTab()}
        {activeTab === 2 && renderCancelTab()}
      </KeyboardAvoidingView>

      {datePicker.visible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  headerSub: { fontSize: 14, color: '#BFDBFE', fontWeight: '300' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 4 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: T.accent, backgroundColor: '#E6F4F8' },
  tabLabel: { fontSize: 12, color: T.textSecondary, fontWeight: '500' },
  tabLabelActive: { color: T.accent, fontWeight: '700' },

  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  typeCard: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F9FAFB', marginHorizontal: 3 },
  typeCardActive: { borderColor: T.accent, backgroundColor: '#E6F4F8', transform: [{ scale: 1.03 }] },
  typeLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  typeLabelActive: { color: T.accent },

  card: { backgroundColor: T.cardBg, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: T.primary, marginBottom: 14 },

  fieldWrap: { marginBottom: 12 },
  fieldHalf: { flex: 1, marginBottom: 12, marginHorizontal: 4 },
  row: { flexDirection: 'row', marginHorizontal: -4 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: T.textPrimary, backgroundColor: '#fff' },
  inputErr: { borderColor: T.error },
  errText: { fontSize: 11, color: T.error, marginTop: 3 },

  numRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.border, borderRadius: 8, overflow: 'hidden' },
  numBtn: { padding: 10, backgroundColor: '#F9FAFB' },
  numVal: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: T.textPrimary },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: T.border, backgroundColor: '#fff' },
  chipActive: { borderColor: T.accent, backgroundColor: '#E6F4F8' },
  chipText: { fontSize: 12, color: T.textSecondary },
  chipTextActive: { color: T.accent, fontWeight: '600' },

  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  interestChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: T.border, backgroundColor: '#fff', width: '47%' },
  interestChipActive: { borderColor: T.accent, backgroundColor: '#E6F4F8' },
  interestText: { fontSize: 13, color: T.textSecondary, textAlign: 'center' },
  interestTextActive: { color: T.accent, fontWeight: '600' },

  radioRow: { flexDirection: 'row', gap: 16, marginTop: 6, marginBottom: 4 },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: T.accent },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.accent },
  radioLabel: { fontSize: 13, color: T.textPrimary },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  clearBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  clearBtnText: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
  submitBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: T.accent, paddingVertical: 14, borderRadius: 12, elevation: 4, shadowColor: T.accent, shadowOpacity: 0.3, shadowRadius: 8 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  centerTab: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  modifyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modifyTitle: { fontSize: 22, fontWeight: '700', color: T.textPrimary, marginBottom: 12 },
  modifyText: { fontSize: 14, color: T.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 320, marginBottom: 24 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 12 },
  contactBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  phoneBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: T.primary },
  phoneBtnText: { color: T.primary, fontWeight: '600', fontSize: 15 },

  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: T.danger, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  cancelBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  successBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 8, padding: 14, marginBottom: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 14, marginBottom: 16 },
  resultTitle: { fontSize: 14, fontWeight: '600' },
});
