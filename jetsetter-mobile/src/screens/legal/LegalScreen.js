import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';

/**
 * LegalScreen — renders a legal/info web page (privacy, terms, cookies, help,
 * about) inside a WebView so the app reuses the website's canonical content and
 * stays in sync automatically. Navigate with { url, title }.
 */
export default function LegalScreen({ route, navigation }) {
  const { url, title } = route.params || {};
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Info'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!!url ? (
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: url }}
            onLoadEnd={() => setLoading(false)}
            startInLoadingState
            style={{ flex: 1 }}
          />
          {loading && (
            <View style={styles.loader} pointerEvents="none">
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.loader}>
          <Text style={styles.errorText}>Page unavailable.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', flex: 1, textAlign: 'center' },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  errorText: { color: '#6B7280', fontSize: 15 },
});
