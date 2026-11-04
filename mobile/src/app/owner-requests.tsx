import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { request } from '../services/api';

type OwnerRequest = {
  id: string;
  guesthouseName: string;
  city: string;
  status: string;
  createdAt: string;
  rejectReason?: string | null;
};
type Page<T> = { content: T[]; totalPages: number };
type Profile = { role: string };
type Field = 'guesthouseName' | 'city' | 'address' | 'phone' | 'pricePerNight' | 'description' | 'notes';

const initial: Record<Field, string> = {
  guesthouseName: '', city: '', address: '', phone: '',
  pricePerNight: '', description: '', notes: '',
};

export default function OwnerRequests() {
  const { user, loading: authLoading, syncError } = useAuth();
  const [form, setForm] = useState(initial);
  const [role, setRole] = useState('');
  const [items, setItems] = useState<OwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setRole(''); setItems([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const profile = await request<Profile>('/me', {}, true);
      const currentRole = (profile.role || '').toLowerCase();
      setRole(currentRole);
      if (currentRole === 'owner' || currentRole === 'admin') {
        const page = await request<Page<OwnerRequest>>('/owner/requests?page=0&size=50', {}, true);
        setItems(page.content || []);
      } else setItems([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your requests.');
    } finally { setLoading(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  function update(field: Field, value: string) {
    setForm(previous => ({ ...previous, [field]: value }));
  }

  async function submit() {
    const name = form.guesthouseName.trim();
    const city = form.city.trim();
    const phone = form.phone.trim();
    const price = Number(form.pricePerNight.trim());
    if (!name || !city || !phone || !form.pricePerNight.trim()) {
      Alert.alert('Required information', 'Enter the guesthouse name, city, phone number and nightly price.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
      Alert.alert('Invalid price', 'Enter a nightly price between P0 and P1,000,000.');
      return;
    }
    if (name.length > 120 || city.length > 80 || phone.length > 30 ||
        form.address.length > 200 || form.description.length > 3000 || form.notes.length > 1000) {
      Alert.alert('Too much text', 'Please shorten one of the fields before submitting.');
      return;
    }
    setBusy(true);
    try {
      await request('/owner/requests', {
        method: 'POST',
        body: JSON.stringify({
          guesthouseName: name, city, address: form.address.trim(),
          phone, pricePerNight: price, description: form.description.trim(),
          notes: form.notes.trim(),
        }),
      }, true);
      setForm(initial);
      setShowForm(false);
      await refresh();
      Alert.alert('Request submitted', 'Your guesthouse request is pending administrator review.');
    } catch (e) {
      Alert.alert('Unable to submit', e instanceof Error ? e.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  const field = (label: string, key: Field, placeholder: string, options?: {multiline?: boolean; numeric?: boolean; limit?: number}) => (
    <View style={styles.field} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, options?.multiline && styles.multiline]}
        placeholder={placeholder} placeholderTextColor="#8B9F95"
        value={form[key]} onChangeText={value => update(key, value)}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 4 : 1}
        maxLength={options?.limit}
        keyboardType={options?.numeric ? 'decimal-pad' : key === 'phone' ? 'phone-pad' : 'default'}
        autoCapitalize={key === 'phone' || key === 'pricePerNight' ? 'none' : 'sentences'}
        textAlignVertical={options?.multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.kicker}>LOCATEBASE • PARTNER SERVICES</Text>
          <Text style={styles.title}>List your guesthouse</Text>
          <Text style={styles.heroText}>Send your property details to our team for review. Track your request right here.</Text>
        </View>
        {authLoading || loading ? <ActivityIndicator size="large" color="#9B1C2B" style={styles.loader} /> :
        !user ? (
          <View style={styles.card}>
            <Text style={styles.heading}>Sign in to continue</Text>
            <Text style={styles.muted}>You'll need an owner account to submit guesthouse details.</Text>
            <Pressable style={styles.primary} onPress={() => router.push('/login')}><Text style={styles.primaryText}>Sign in</Text></Pressable>
            <Pressable style={styles.secondary} onPress={() => router.push('/register')}><Text style={styles.secondaryText}>Create an owner account</Text></Pressable>
          </View>
        ) : syncError || error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{syncError || error}</Text>
            <Pressable style={styles.primary} onPress={() => void refresh()}><Text style={styles.primaryText}>Try again</Text></Pressable>
          </View>
        ) : role !== 'owner' && role !== 'admin' ? (
          <View style={styles.card}>
            <Text style={styles.heading}>Owner account required</Text>
            <Text style={styles.muted}>Your signed-in account is registered as a guest. Existing accounts cannot switch roles during sign-in. Register an owner account or contact an administrator for a role change.</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.heading}>Your requests</Text>
                <Text style={styles.count}>{items.length} recent</Text>
              </View>
              {items.length === 0 ? <Text style={styles.muted}>No requests submitted yet.</Text> :
                items.map(item => (
                  <View key={item.id} style={styles.requestRow}>
                    <View style={styles.requestDetails}>
                      <Text style={styles.requestName}>{item.guesthouseName}</Text>
                      <Text style={styles.muted}>{item.city} • {new Date(item.createdAt).toLocaleDateString()}</Text>
                      {item.rejectReason ? <Text style={styles.error}>{item.rejectReason}</Text> : null}
                    </View>
                    <Text style={styles.status}>{item.status.replace(/_/g, ' ')}</Text>
                  </View>
                ))
              }
              {!showForm && <Pressable style={styles.primary} onPress={() => setShowForm(true)}><Text style={styles.primaryText}>+ Submit a new request</Text></Pressable>}
            </View>
            {showForm && <View style={styles.card}>
              <Text style={styles.heading}>Guesthouse details</Text>
              <Text style={styles.muted}>Fields marked * are required. An administrator will review your submission before publishing.</Text>
              {field('Guesthouse name *', 'guesthouseName', 'e.g. Riverside Guesthouse', {limit: 120})}
              {field('City or town *', 'city', 'e.g. Maun', {limit: 80})}
              {field('Street address', 'address', 'Location of your property', {limit: 200})}
              {field('Contact phone *', 'phone', '+267 ...', {limit: 30})}
              {field('Nightly rate (BWP) *', 'pricePerNight', 'e.g. 650', {numeric: true})}
              {field('Description', 'description', 'Describe rooms, amenities and what makes the stay special', {multiline: true, limit: 3000})}
              {field('Notes for our team', 'notes', 'Any questions or information for the reviewer', {multiline: true, limit: 1000})}
              <Pressable style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={() => void submit()}>
                {busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Send for review</Text>}
              </Pressable>
              <Pressable style={styles.secondary} disabled={busy} onPress={() => setShowForm(false)}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
            </View>}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6FAF7' },
  page: { paddingHorizontal: 20, paddingTop: 154, paddingBottom: 165, gap: 18 },
  hero: { backgroundColor: '#8C1D2D', borderRadius: 24, padding: 26 },
  kicker: { color: '#D8EEE5', letterSpacing: 1.1, fontSize: 10, fontWeight: '800' },
  title: { fontSize: 27, fontWeight: '800', color: '#FFFFFF', marginTop: 12 },
  heroText: { fontSize: 13, color: '#F9E5E9', lineHeight: 20, marginTop: 10 },
  loader: { marginTop: 45 },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#D7EAE0', backgroundColor: '#FFFFFF', gap: 13 },
  heading: { fontSize: 18, fontWeight: '800', color: '#273A32' },
  muted: { color: '#617B6E', fontSize: 12, lineHeight: 19 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { backgroundColor: '#D8EEE5', color: '#226652', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10, fontSize: 11, overflow: 'hidden' },
  requestRow: { flexDirection: 'row', gap: 12, paddingTop: 13, borderTopWidth: 1, borderColor: '#E7F1EB', alignItems: 'center' },
  requestDetails: { flex: 1, gap: 4 },
  requestName: { fontSize: 14, fontWeight: '700', color: '#263B30' },
  status: { fontSize: 10, fontWeight: '800', color: '#8C1D2D', backgroundColor: '#FCECF0', borderRadius: 11, overflow: 'hidden', padding: 8, textTransform: 'capitalize' },
  field: { gap: 7, marginTop: 4 },
  label: { fontSize: 12, color: '#375649', fontWeight: '700' },
  input: { minHeight: 48, backgroundColor: '#FBFEFC', padding: 13, borderColor: '#CFDFD6', borderWidth: 1, borderRadius: 11, color: '#233B2F', fontSize: 13 },
  multiline: { minHeight: 96 },
  primary: { minHeight: 48, backgroundColor: '#9B1C2B', paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: 'white', fontWeight: '800', fontSize: 13 },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontWeight: '700', fontSize: 12, color: '#9B1C2B' },
  disabled: { opacity: .6 },
  error: { color: '#AA233A', fontSize: 12 },
});
