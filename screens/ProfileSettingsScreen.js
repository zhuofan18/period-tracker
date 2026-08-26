import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Switch, Modal, Linking, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import FadeInView from '../components/FadeInView';
import BloomButton from '../components/BloomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import {
  requestPermissions, getPermissionStatus,
  schedulePeriodReminder, cancelPeriodReminder,
  scheduleOvulationAlert, cancelOvulationAlert,
  scheduleDailyLogReminder, cancelDailyLogReminder,
} from '../utils/notifications';
import { getNextPeriodDate, CYCLE_LENGTH } from '../utils/cycleUtils';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../utils/legalContent';
import { shadow } from '../theme/spacing';
import { fontFamily } from '../theme/typography';

export default function ProfileSettingsScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = styles(theme);

  const [editing, setEditing]         = useState(false);
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [age, setAge]                 = useState('');
  const [email, setEmail]             = useState('');
  const [faqVisible, setFaqVisible]         = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [termsVisible, setTermsVisible]     = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');

      const [{ data }, { data: periods }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('periods').select('start_date').eq('user_id', user.id).order('start_date', { ascending: false }).limit(1),
      ]);

      if (data) {
        setFirstName(data.first_name || data.username || '');
        setLastName(data.last_name || '');
        setAge(data.age ? String(data.age) : '');
        setWeight(data.weight ? String(data.weight) : '');
        setHeightUnit(data.height_unit || 'cm');
        setHeightCm(data.height_cm ? String(data.height_cm) : '');
        setHeightFt(data.height_ft ? String(data.height_ft) : '');
        setHeightIn(data.height_in ? String(data.height_in) : '');
        setCycleLength(data.cycle_length ? String(data.cycle_length) : '28');
        setPeriodLength(data.period_length ? String(data.period_length) : '5');
        setCycleLen(data.cycle_length || CYCLE_LENGTH);
      }
      if (periods?.[0]) setLastPeriodStart(periods[0].start_date);

      // Load saved notification prefs
      const [pr, oa, dl] = await Promise.all([
        AsyncStorage.getItem('notif_period_reminder'),
        AsyncStorage.getItem('notif_ovulation_alert'),
        AsyncStorage.getItem('notif_daily_log'),
      ]);
      setPeriodReminder(pr === 'true');
      setOvulationAlert(oa === 'true');
      setDailyLog(dl === 'true');
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id:            user.id,
      first_name:    firstName,
      last_name:     lastName,
      age:           age ? parseInt(age) : null,
      weight:        weight ? parseFloat(weight) : null,
      height_unit:   heightUnit,
      height_cm:     heightCm ? parseFloat(heightCm) : null,
      height_ft:     heightFt ? parseInt(heightFt) : null,
      height_in:     heightIn ? parseInt(heightIn) : null,
      cycle_length:  cycleLength ? parseInt(cycleLength) : 28,
      period_length: periodLength ? parseInt(periodLength) : 5,
      updated_at:    new Date().toISOString(),
    });
  };
  const [weight, setWeight]           = useState('');
  const [heightUnit, setHeightUnit]   = useState('cm');
  const [heightCm, setHeightCm]       = useState('');
  const [heightFt, setHeightFt]       = useState('');
  const [heightIn, setHeightIn]       = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [periodReminder, setPeriodReminder]   = useState(false);
  const [ovulationAlert, setOvulationAlert]   = useState(false);
  const [dailyLog, setDailyLog]               = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState(null);
  const [cycleLen, setCycleLen]               = useState(CYCLE_LENGTH);
  const [exporting, setExporting]             = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText]   = useState('');
  const [deleting, setDeleting]               = useState(false);

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileRow }, { data: periods }, { data: logs }, { data: goalsRow }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('periods').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
        supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }),
        supabase.from('user_goals').select('goals').eq('user_id', user.id).maybeSingle(),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        account: { id: user.id, email: user.email },
        profile: profileRow || null,
        periods: periods || [],
        dailyLogs: logs || [],
        goals: goalsRow?.goals || [],
      };
      const json = JSON.stringify(payload, null, 2);
      const filename = `luna-data-export-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Your Luna Data' });
        } else {
          Alert.alert('Export complete', `Saved to ${fileUri}`);
        }
      }
    } catch (e) {
      Alert.alert('Export failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await supabase.auth.signOut();
      setDeleteModalVisible(false);
      navigation.navigate('Login');
    } catch (e) {
      Alert.alert('Delete failed', e.message || 'Something went wrong. Please try again or contact support.');
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    const doLogout = async () => {
      await supabase.auth.signOut();
      navigation.navigate('Login');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) doLogout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <FadeInView style={s.screen}>
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <Text style={s.headerTitle}>Profile & Settings</Text>
          <BloomButton onPress={() => navigation.navigate('Chat')} />
        </View>
      </View>
      <ScrollView contentContainerStyle={s.content}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.avatarName}>{[firstName, lastName].filter(Boolean).join(' ') || 'Your Name'}</Text>
          <Text style={s.avatarEmail}>{email || 'No email set'}</Text>
        </View>

        {/* Personal Info */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => { if (editing) saveProfile(); setEditing(!editing); }}>
              <Text style={s.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {/* Name & Age */}
          {[
            ['First Name', firstName, setFirstName, 'default'],
            ['Last Name', lastName, setLastName, 'default'],
            ['Age', age, setAge, 'numeric'],
          ].map(([label, val, setter, kbType]) => (
            <View key={label} style={s.field}>
              <Text style={s.fieldLabel}>{label}</Text>
              <TextInput
                style={s.fieldInput}
                value={val}
                onChangeText={(v) => setter(kbType === 'numeric' ? v.replace(/[^0-9]/g, '') : v)}
                editable={editing}
                keyboardType={kbType}
                autoCapitalize="sentences"
              />
            </View>
          ))}

          {/* Height */}
          <View style={s.field}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Height</Text>
              {editing && (
                <View style={s.unitToggle}>
                  {[['cm', 'cm'], ['ft', 'ft & in']].map(([unit, label]) => (
                    <TouchableOpacity
                      key={unit}
                      style={[s.unitBtn, heightUnit === unit && s.unitBtnSelected]}
                      onPress={() => setHeightUnit(unit)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.unitBtnText, heightUnit === unit && s.unitBtnTextSelected]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {heightUnit === 'cm' ? (
              <View style={s.fieldInputRow}>
                <TextInput
                  style={[s.fieldInput, { flex: 1 }]}
                  value={heightCm}
                  onChangeText={(v) => setHeightCm(v.replace(/[^0-9]/g, ''))}
                  editable={editing}
                  keyboardType="numeric"
                />
                <Text style={s.fieldUnit}>cm</Text>
              </View>
            ) : (
              <View style={s.ftRow}>
                <View style={s.fieldInputRow}>
                  <TextInput
                    style={[s.fieldInput, { flex: 1 }]}
                    value={heightFt}
                    onChangeText={(v) => setHeightFt(v.replace(/[^0-9]/g, ''))}
                    editable={editing}
                    keyboardType="numeric"
                  />
                  <Text style={s.fieldUnit}>ft</Text>
                </View>
                <View style={s.fieldInputRow}>
                  <TextInput
                    style={[s.fieldInput, { flex: 1 }]}
                    value={heightIn}
                    onChangeText={(v) => setHeightIn(v.replace(/[^0-9]/g, ''))}
                    editable={editing}
                    keyboardType="numeric"
                  />
                  <Text style={s.fieldUnit}>in</Text>
                </View>
              </View>
            )}
          </View>

          {/* Weight */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Weight</Text>
            <View style={s.fieldInputRow}>
              <TextInput
                style={[s.fieldInput, { flex: 1 }]}
                value={weight}
                onChangeText={(v) => setWeight(v.replace(/[^0-9]/g, ''))}
                editable={editing}
                keyboardType="numeric"
              />
              <Text style={s.fieldUnit}>kg</Text>
            </View>
          </View>

          {/* Cycle & Period Length */}
          {[
            ['Cycle Length', cycleLength, setCycleLength, 'days'],
            ['Period Length', periodLength, setPeriodLength, 'days'],
          ].map(([label, val, setter, unit], i, arr) => (
            <View key={label} style={[s.field, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.fieldLabel}>{label}</Text>
              <View style={s.fieldInputRow}>
                <TextInput
                  style={[s.fieldInput, { flex: 1 }]}
                  value={val}
                  onChangeText={(v) => setter(v.replace(/[^0-9]/g, ''))}
                  editable={editing}
                  keyboardType="numeric"
                />
                <Text style={s.fieldUnit}>{unit}</Text>
              </View>
            </View>
          ))}

          {/* Email */}
          <View style={[s.field, { borderBottomWidth: 0, marginTop: 4 }]}>
            <Text style={s.fieldLabel}>Email</Text>
            <TextInput
              style={s.fieldInput}
              value={email}
              onChangeText={setEmail}
              editable={editing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Notifications</Text>
          {[
            {
              label: 'Period Reminder',
              sub: 'Notified 2 days before your predicted period',
              val: periodReminder,
              onToggle: async (v) => {
                const granted = await requestPermissions();
                if (!granted && v) { Alert.alert('Permission needed', 'Enable notifications in your device settings to use reminders.'); return; }
                setPeriodReminder(v);
                await AsyncStorage.setItem('notif_period_reminder', String(v));
                if (v) await schedulePeriodReminder(lastPeriodStart ? getNextPeriodDate(lastPeriodStart, cycleLen) : null);
                else   await cancelPeriodReminder();
              },
            },
            {
              label: 'Ovulation Alert',
              sub: 'Notified on your predicted ovulation day',
              val: ovulationAlert,
              onToggle: async (v) => {
                const granted = await requestPermissions();
                if (!granted && v) { Alert.alert('Permission needed', 'Enable notifications in your device settings to use reminders.'); return; }
                setOvulationAlert(v);
                await AsyncStorage.setItem('notif_ovulation_alert', String(v));
                if (v) await scheduleOvulationAlert(lastPeriodStart, cycleLen);
                else   await cancelOvulationAlert();
              },
            },
            {
              label: 'Daily Log Reminder',
              sub: 'Reminded at 8 PM each day to log your symptoms',
              val: dailyLog,
              onToggle: async (v) => {
                const granted = await requestPermissions();
                if (!granted && v) { Alert.alert('Permission needed', 'Enable notifications in your device settings to use reminders.'); return; }
                setDailyLog(v);
                await AsyncStorage.setItem('notif_daily_log', String(v));
                if (v) await scheduleDailyLogReminder();
                else   await cancelDailyLogReminder();
              },
            },
          ].map(({ label, sub, val, onToggle }, i, arr) => (
            <View key={label} style={[s.toggleRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.toggleInfo}>
                <Text style={s.toggleLabel}>{label}</Text>
                <Text style={s.toggleSub}>{sub}</Text>
              </View>
              <Switch value={val} onValueChange={onToggle} trackColor={{ false: theme.border, true: '#f9a8c4' }} thumbColor={val ? theme.primary : theme.card} />
            </View>
          ))}
        </View>

        {/* Goals */}
        <TouchableOpacity style={s.section} onPress={() => navigation.navigate('Goals', { fromProfile: true })} activeOpacity={0.8}>
          <View style={s.goalsRow}>
            <View>
              <Text style={[s.sectionTitle, { marginBottom: 2 }]}>My Goals</Text>
              <Text style={s.goalsSub}>View and update your health goals</Text>
            </View>
            <Text style={s.goalsChevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Theme */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Theme</Text>
          <View style={s.themeRow}>
            {[['light', '☀️', 'Light'], ['dark', '🌙', 'Dark']].map(([key, icon, label]) => (
              <TouchableOpacity
                key={key}
                style={[s.themeBtn, !isDark && key === 'light' && s.themeBtnSelected, isDark && key === 'dark' && s.themeBtnSelected]}
                onPress={() => toggleTheme(key === 'dark')}
                activeOpacity={0.8}
              >
                <Text style={s.themeIcon}>{icon}</Text>
                <Text style={[s.themeBtnText, ((!isDark && key === 'light') || (isDark && key === 'dark')) && s.themeBtnTextSelected]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          {[
            { label: 'Version',          right: '1.0.0', onPress: null },
            { label: 'Privacy Policy',   right: '›',     onPress: () => setPrivacyVisible(true) },
            { label: 'Terms of Service', right: '›',     onPress: () => setTermsVisible(true) },
            { label: 'Contact Us',       right: '›',     onPress: () => setContactVisible(true) },
            { label: 'FAQ',              right: '›',     onPress: () => setFaqVisible(true) },
          ].map(({ label, right, onPress }, i, arr) => (
            <TouchableOpacity
              key={label}
              style={[s.aboutRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
              onPress={onPress ?? undefined}
              activeOpacity={onPress ? 0.7 : 1}
            >
              <Text style={s.aboutLabel}>{label}</Text>
              <Text style={[s.aboutRight, right === '›' && s.aboutChevron]}>{right}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Modal */}
        <Modal visible={faqVisible} transparent animationType="slide" onRequestClose={() => setFaqVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Frequently Asked Questions</Text>
                <TouchableOpacity onPress={() => setFaqVisible(false)}>
                  <Text style={s.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { q: 'How is my next period date calculated?', a: 'We use your last period start date and your average cycle length to predict your next period.' },
                  { q: 'What is the fertile window?', a: 'Your fertile window is the days around ovulation when pregnancy is most likely — typically days 10–17 of your cycle.' },
                  { q: 'How accurate is the cycle prediction?', a: 'Predictions improve with more logged data. Cycles naturally vary, so predictions are estimates rather than guarantees.' },
                  { q: 'How do I update my cycle length?', a: 'Go to Profile & Settings, tap Edit in the Personal Information section, and update your Cycle Length.' },
                  { q: 'How do I log a new period start?', a: 'On the Home screen, tap the "My period started" card at the bottom to select your period start date.' },
                  { q: 'Is my data private?', a: 'Yes. Your data is stored securely and is never shared with third parties. Only you can access your cycle information.' },
                  { q: 'How do I delete my account?', a: 'Scroll to the Danger Zone section of Profile & Settings and tap "Delete Account". This permanently removes your account and all data immediately — no waiting required.' },
                  { q: 'Can I export my data?', a: 'Yes — tap "Export My Data" in Profile & Settings to download a JSON file with your full period history, daily logs, and profile info.' },
                ].map(({ q, a }, i) => (
                  <View key={i} style={s.faqItem}>
                    <Text style={s.faqQ}>{q}</Text>
                    <Text style={s.faqA}>{a}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal visible={privacyVisible} transparent animationType="slide" onRequestClose={() => setPrivacyVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Privacy Policy</Text>
                <TouchableOpacity onPress={() => setPrivacyVisible(false)}>
                  <Text style={s.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {PRIVACY_POLICY.map(({ heading, body }, i) => (
                  <View key={i} style={s.policySection}>
                    <Text style={s.policyHeading}>{heading}</Text>
                    <Text style={s.policyBody}>{body}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Terms of Service Modal */}
        <Modal visible={termsVisible} transparent animationType="slide" onRequestClose={() => setTermsVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Terms of Service</Text>
                <TouchableOpacity onPress={() => setTermsVisible(false)}>
                  <Text style={s.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {TERMS_OF_SERVICE.map(({ heading, body }, i) => (
                  <View key={i} style={s.policySection}>
                    <Text style={s.policyHeading}>{heading}</Text>
                    <Text style={s.policyBody}>{body}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Contact Us Modal */}
        <Modal visible={contactVisible} transparent animationType="slide" onRequestClose={() => setContactVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Contact Us</Text>
                <TouchableOpacity onPress={() => setContactVisible(false)}>
                  <Text style={s.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.contactBody}>
                Have a question, found a bug, or want to give feedback? We'd love to hear from you.
              </Text>
              <TouchableOpacity
                style={s.contactEmailBtn}
                onPress={() => Linking.openURL('mailto:markyuki18@gmail.com?subject=Period%20Tracker%20Support')}
                activeOpacity={0.8}
              >
                <Text style={s.contactEmailLabel}>Email Support</Text>
                <Text style={s.contactEmailAddr}>markyuki18@gmail.com</Text>
              </TouchableOpacity>
              <Text style={s.contactNote}>We aim to respond within 2–3 business days.</Text>
            </View>
          </View>
        </Modal>

        {/* Delete Account confirmation */}
        <Modal visible={deleteModalVisible} transparent animationType="slide" onRequestClose={() => !deleting && setDeleteModalVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Delete Account</Text>
                {!deleting && (
                  <TouchableOpacity onPress={() => { setDeleteModalVisible(false); setDeleteConfirmText(''); }}>
                    <Text style={s.modalClose}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={s.deleteWarning}>
                This permanently deletes your account, profile, period history, daily logs, and goals. This cannot be undone.
              </Text>
              <Text style={s.deleteConfirmLabel}>Type DELETE to confirm</Text>
              <TextInput
                style={s.deleteConfirmInput}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                autoCapitalize="characters"
                placeholder="DELETE"
                placeholderTextColor={theme.placeholder}
                editable={!deleting}
              />
              <TouchableOpacity
                style={[s.deleteConfirmBtn, (deleteConfirmText !== 'DELETE' || deleting) && s.deleteConfirmBtnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                activeOpacity={0.8}
              >
                <Text style={s.deleteConfirmBtnText}>{deleting ? 'Deleting…' : 'Permanently Delete My Account'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Your Data */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your Data</Text>
          <TouchableOpacity style={s.exportBtn} onPress={handleExportData} activeOpacity={0.8} disabled={exporting}>
            <Text style={s.exportBtnText}>{exporting ? 'Preparing export…' : '⬇️  Export My Data'}</Text>
          </TouchableOpacity>
          <Text style={s.exportHint}>Downloads a JSON file with your full period history, daily logs, and profile info.</Text>
        </View>

        {/* Danger Zone */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: '#ff4d4d' }]}>Danger Zone</Text>
          <Text style={s.dangerHint}>Permanently delete your account and all associated data. This cannot be undone.</Text>
          <TouchableOpacity style={s.deleteBtn} onPress={() => setDeleteModalVisible(true)} activeOpacity={0.8}>
            <Text style={s.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </FadeInView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  header:       { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 14, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:  { fontSize: 20, fontFamily: fontFamily.bold, color: theme.text },
  content: { padding: 20, gap: 20 },
  avatarSection: { alignItems: 'center', paddingVertical: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontFamily: fontFamily.bold, color: '#fff' },
  avatarName: { fontSize: 18, fontFamily: fontFamily.bold, color: theme.text, marginBottom: 4 },
  avatarEmail: { fontSize: 13, color: theme.muted },
  section: {
    backgroundColor: theme.card, borderRadius: 16, padding: 18,
    ...Platform.select(shadow),
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontFamily: fontFamily.bold, color: theme.text, marginBottom: 14 },
  editBtn: { fontSize: 14, color: theme.primary, fontFamily: fontFamily.semibold },
  field: { borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 10, marginBottom: 4 },
  fieldLabel: { fontSize: 11, color: theme.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { fontSize: 15, color: theme.text },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  fieldInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldUnit: { fontSize: 13, color: theme.muted, minWidth: 28 },
  ftRow: { flexDirection: 'row', gap: 20 },
  unitToggle: { flexDirection: 'row', gap: 6 },
  unitBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.optionBg },
  unitBtnSelected: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  unitBtnText: { fontSize: 12, color: theme.subtext, fontFamily: fontFamily.medium },
  unitBtnTextSelected: { color: theme.primary, fontFamily: fontFamily.bold },
  goalsRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalsSub:    { fontSize: 12, color: theme.muted, marginTop: 2, fontFamily: fontFamily.regular },
  goalsChevron:{ fontSize: 22, color: theme.muted },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, color: theme.text, fontFamily: fontFamily.medium, marginBottom: 2 },
  toggleSub: { fontSize: 12, color: theme.muted },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.optionBg, borderWidth: 2, borderColor: 'transparent' },
  themeBtnSelected: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  themeIcon: { fontSize: 16 },
  themeBtnText: { fontSize: 14, color: theme.subtext, fontFamily: fontFamily.medium },
  themeBtnTextSelected: { color: theme.primary, fontFamily: fontFamily.bold },
  aboutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  aboutLabel: { fontSize: 14, color: theme.text },
  aboutRight: { fontSize: 13, color: theme.muted },
  aboutChevron: { fontSize: 18, color: theme.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontFamily: fontFamily.bold, color: theme.text },
  modalClose: { fontSize: 18, color: theme.muted, padding: 4 },
  faqItem: { marginBottom: 18 },
  faqQ: { fontSize: 14, fontFamily: fontFamily.bold, color: theme.text, marginBottom: 4 },
  faqA: { fontSize: 13, color: theme.subtext, lineHeight: 20 },
  policySection: { marginBottom: 18 },
  policyHeading: { fontSize: 14, fontFamily: fontFamily.bold, color: theme.text, marginBottom: 4 },
  policyBody:    { fontSize: 13, color: theme.subtext, lineHeight: 20 },
  contactBody:   { fontSize: 14, color: theme.subtext, lineHeight: 21, marginBottom: 20 },
  contactEmailBtn:  { backgroundColor: theme.optionBg, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: theme.primary, marginBottom: 12 },
  contactEmailLabel: { fontSize: 12, color: theme.muted, marginBottom: 4 },
  contactEmailAddr:  { fontSize: 15, fontFamily: fontFamily.bold, color: theme.primary },
  contactNote:  { fontSize: 12, color: theme.muted, textAlign: 'center' },

  exportBtn: { backgroundColor: theme.optionBg, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: theme.primary },
  exportBtnText: { fontSize: 14, fontFamily: fontFamily.semibold, color: theme.primary },
  exportHint: { fontSize: 12, color: theme.muted, marginTop: 10, lineHeight: 17 },

  dangerHint: { fontSize: 12, color: theme.muted, marginBottom: 14, lineHeight: 17 },
  deleteBtn: { backgroundColor: '#ff4d4d', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  deleteBtnText: { fontSize: 14, fontFamily: fontFamily.bold, color: '#fff' },
  deleteWarning: { fontSize: 13, color: theme.subtext, lineHeight: 19, marginBottom: 18 },
  deleteConfirmLabel: { fontSize: 12, color: theme.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteConfirmInput: {
    borderWidth: 1.5, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 18,
  },
  deleteConfirmBtn: { backgroundColor: '#ff4d4d', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  deleteConfirmBtnDisabled: { backgroundColor: '#ff4d4d55' },
  deleteConfirmBtnText: { fontSize: 15, fontFamily: fontFamily.bold, color: '#fff' },

  logoutBtn: { backgroundColor: theme.card, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#ff4d4d' },
  logoutText: { fontSize: 15, fontFamily: fontFamily.bold, color: '#ff4d4d' },
});
