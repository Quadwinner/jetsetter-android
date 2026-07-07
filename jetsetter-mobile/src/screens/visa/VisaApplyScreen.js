import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Alert,
  StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import visaService from '../../services/visaService';
import currencyService from '../../services/currencyService';

const STEPS = ['Personal Info', 'Travel Details', 'Documents', 'Review & Pay'];
const TIERS = [
  { id: 'standard', label: 'Standard', time: '5–7 days', price: 49 },
  { id: 'express', label: 'Express', time: '2–3 days', price: 99 },
  { id: 'premium', label: 'Premium', time: '24 hours', price: 199 },
];

export default function VisaApplyScreen({ route, navigation }) {
  const { nationality = '', destination = '' } = route.params || {};
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [personal, setPersonal] = useState({
    firstName: '', lastName: '', dob: '', nationality: nationality,
    passportNumber: '', passportExpiry: '', email: '', phone: '',
  });
  const [travel, setTravel] = useState({
    destination: destination, travelDate: '', returnDate: '',
    purpose: 'tourism', visaType: 'tourist',
  });
  const [tier, setTier] = useState('standard');

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!personal.firstName.trim()) e.firstName = 'Required';
      if (!personal.lastName.trim()) e.lastName = 'Required';
      if (!personal.dob) e.dob = 'Required';
      if (!personal.nationality.trim()) e.nationality = 'Required';
      if (!personal.passportNumber.trim()) e.passportNumber = 'Required';
      if (!personal.passportExpiry) e.passportExpiry = 'Required';
      if (!personal.email.trim()) e.email = 'Required';
      if (!personal.phone.trim()) e.phone = 'Required';
    } else if (step === 1) {
      if (!travel.destination.trim()) e.destination = 'Required';
      if (!travel.travelDate) e.travelDate = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, 3)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await visaService.submitApplication({
        firstName: personal.firstName.trim(),
        lastName: personal.lastName.trim(),
        dateOfBirth: personal.dob,
        nationality: personal.nationality.trim(),
        passportNumber: personal.passportNumber.trim(),
        passportExpiry: personal.passportExpiry,
        email: personal.email.trim(),
        phone: personal.phone.trim(),
        destination: travel.destination.trim(),
        travelDate: travel.travelDate,
        returnDate: travel.returnDate || null,
        purpose: travel.purpose,
        visaType: travel.visaType,
        serviceTier: tier,
      });

      if (result.success && result.data) {
        const app = result.data;
        if (result.checkoutUrl) {
          await Linking.openURL(result.checkoutUrl);
        }
        navigation.replace('VisaSuccess', {
          applicationRef: app.application_ref,
          destination: travel.destination,
          tier,
        });
      } else {
        Alert.alert('Submitted', result.message || 'Your visa application has been submitted.');
        navigation.replace('VisaSuccess', {
          applicationRef: result.application_ref || result.data?.application_ref || '',
          destination: travel.destination,
          tier,
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, value, onChange, error, placeholder, keyboardType, ...props }) => (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.fieldInput, error && { borderColor: '#EF4444' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        {...props}
      />
      {error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );

  const renderStep0 = () => (
    <>
      <Text style={s.stepHeading}>Personal Information</Text>
      <Field label="First Name" value={personal.firstName} onChange={(v) => setPersonal({ ...personal, firstName: v })} error={errors.firstName} placeholder="As on passport" />
      <Field label="Last Name" value={personal.lastName} onChange={(v) => setPersonal({ ...personal, lastName: v })} error={errors.lastName} placeholder="As on passport" />
      <Field label="Date of Birth" value={personal.dob} onChange={(v) => setPersonal({ ...personal, dob: v })} error={errors.dob} placeholder="YYYY-MM-DD" />
      <Field label="Nationality" value={personal.nationality} onChange={(v) => setPersonal({ ...personal, nationality: v })} error={errors.nationality} placeholder="e.g., Indian" />
      <Field label="Passport Number" value={personal.passportNumber} onChange={(v) => setPersonal({ ...personal, passportNumber: v })} error={errors.passportNumber} placeholder="e.g., A1234567" />
      <Field label="Passport Expiry" value={personal.passportExpiry} onChange={(v) => setPersonal({ ...personal, passportExpiry: v })} error={errors.passportExpiry} placeholder="YYYY-MM-DD" />
      <Field label="Email" value={personal.email} onChange={(v) => setPersonal({ ...personal, email: v })} error={errors.email} placeholder="your@email.com" keyboardType="email-address" />
      <Field label="Phone" value={personal.phone} onChange={(v) => setPersonal({ ...personal, phone: v })} error={errors.phone} placeholder="+91 9876543210" keyboardType="phone-pad" />
    </>
  );

  const renderStep1 = () => (
    <>
      <Text style={s.stepHeading}>Travel Details</Text>
      <Field label="Destination Country" value={travel.destination} onChange={(v) => setTravel({ ...travel, destination: v })} error={errors.destination} placeholder="e.g., United States" />
      <Field label="Travel Date" value={travel.travelDate} onChange={(v) => setTravel({ ...travel, travelDate: v })} error={errors.travelDate} placeholder="YYYY-MM-DD" />
      <Field label="Return Date (optional)" value={travel.returnDate} onChange={(v) => setTravel({ ...travel, returnDate: v })} placeholder="YYYY-MM-DD" />
      <View style={s.fieldWrap}>
        <Text style={s.fieldLabel}>Purpose of Visit</Text>
        <View style={s.chipsRow}>
          {['tourism', 'business', 'study', 'medical', 'transit'].map((p) => (
            <TouchableOpacity key={p} style={[s.chip, travel.purpose === p && s.chipActive]} onPress={() => setTravel({ ...travel, purpose: p })}>
              <Text style={[s.chipText, travel.purpose === p && s.chipTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={s.stepHeading}>Documents</Text>
      <Text style={s.docNote}>After submission, you'll be able to upload documents from the tracker. Required documents for {travel.destination || 'your destination'}:</Text>
      {['Passport Bio Page (color copy)', 'Passport-size Photos (2)', 'Bank Statements (3 months)', 'Travel Insurance', 'Hotel Booking Confirmation'].map((doc, i) => (
        <View key={i} style={s.docRow}>
          <Ionicons name="document-outline" size={18} color="#0890BC" />
          <Text style={s.docText}>{doc}</Text>
        </View>
      ))}
    </>
  );

  const renderStep3 = () => {
    const selectedTier = TIERS.find((t) => t.id === tier);
    return (
      <>
        <Text style={s.stepHeading}>Review & Pay</Text>
        <View style={s.reviewCard}>
          <Text style={s.reviewRow}><Text style={s.reviewLabel}>Name: </Text>{personal.firstName} {personal.lastName}</Text>
          <Text style={s.reviewRow}><Text style={s.reviewLabel}>Passport: </Text>{personal.passportNumber}</Text>
          <Text style={s.reviewRow}><Text style={s.reviewLabel}>Destination: </Text>{travel.destination}</Text>
          <Text style={s.reviewRow}><Text style={s.reviewLabel}>Travel Date: </Text>{travel.travelDate}</Text>
          <Text style={s.reviewRow}><Text style={s.reviewLabel}>Purpose: </Text>{travel.purpose}</Text>
        </View>
        <Text style={[s.fieldLabel, { marginTop: 16 }]}>Processing Tier</Text>
        {TIERS.map((t) => (
          <TouchableOpacity key={t.id} style={[s.tierRow, tier === t.id && s.tierRowActive]} onPress={() => setTier(t.id)}>
            <View style={{ flex: 1 }}>
              <Text style={s.tierLabel}>{t.label}</Text>
              <Text style={s.tierTime}>{t.time}</Text>
            </View>
            <Text style={s.tierPrice}>{currencyService.format(t.price)}</Text>
            {tier === t.id && <Ionicons name="checkmark-circle" size={22} color="#0890BC" />}
          </TouchableOpacity>
        ))}
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => step > 0 ? back() : navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Visa Application</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step Indicator */}
      <View style={s.stepsRow}>
        {STEPS.map((label, i) => (
          <View key={i} style={s.stepItem}>
            <View style={[s.stepDot, i <= step && s.stepDotActive]}>
              {i < step ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={[s.stepDotText, i <= step && { color: '#fff' }]}>{i + 1}</Text>}
            </View>
            <Text style={[s.stepLabel, i <= step && { color: '#055B75' }]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Footer Button */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step < 3 ? (
          <TouchableOpacity style={s.nextBtn} onPress={next}>
            <Text style={s.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.nextBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <><Text style={s.nextBtnText}>Submit & Pay</Text><Ionicons name="card" size={18} color="#fff" /></>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1E293B' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#0890BC' },
  stepDotText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  stepLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  stepHeading: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 15, color: '#1E293B', backgroundColor: '#fff' },
  fieldError: { color: '#EF4444', fontSize: 11, marginTop: 3 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: '#E0F7FA', borderColor: '#0890BC' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#055B75' },
  docNote: { fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 20 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  docText: { fontSize: 14, color: '#1E293B', flex: 1 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  reviewRow: { fontSize: 14, color: '#374151', marginBottom: 8 },
  reviewLabel: { fontWeight: '700', color: '#1E293B' },
  tierRow: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8, gap: 10 },
  tierRowActive: { borderColor: '#0890BC', backgroundColor: '#F0FDFA' },
  tierLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  tierTime: { fontSize: 12, color: '#6B7280' },
  tierPrice: { fontSize: 16, fontWeight: '800', color: '#055B75' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#055B75', borderRadius: 12, height: 50, gap: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
