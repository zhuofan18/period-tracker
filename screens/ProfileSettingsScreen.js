import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
} from 'react-native';

export default function ProfileSettingsScreen({ navigation }) {
  // Personal info state
  const [editing, setEditing]           = useState(false);
  const [firstName, setFirstName]       = useState('Jane');
  const [lastName, setLastName]         = useState('Doe');
  const [age, setAge]                   = useState('24');
  const [email, setEmail]               = useState('jane.doe@email.com');

  // Settings state
  const [periodReminder, setPeriodReminder]     = useState(true);
  const [ovulationAlert, setOvulationAlert]     = useState(true);
  const [dailyLog, setDailyLog]                 = useState(false);
  const [theme, setTheme]                       = useState('light');

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) navigation.navigate('Login');
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => navigation.navigate('Login') },
      ]);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.avatarName}>{firstName} {lastName}</Text>
          <Text style={styles.avatarEmail}>{email}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={[styles.fieldInput, !editing && styles.fieldInputDisabled]}
              value={firstName}
              onChangeText={setFirstName}
              editable={editing}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={[styles.fieldInput, !editing && styles.fieldInputDisabled]}
              value={lastName}
              onChangeText={setLastName}
              editable={editing}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={[styles.fieldInput, !editing && styles.fieldInputDisabled]}
              value={age}
              onChangeText={setAge}
              editable={editing}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.fieldInput, !editing && styles.fieldInputDisabled]}
              value={email}
              onChangeText={setEmail}
              editable={editing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Period Reminder</Text>
              <Text style={styles.toggleSub}>Notified 2 days before predicted period</Text>
            </View>
            <Switch
              value={periodReminder}
              onValueChange={setPeriodReminder}
              trackColor={{ false: '#ddd', true: '#f9a8c4' }}
              thumbColor={periodReminder ? '#e75480' : '#fff'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Ovulation Alert</Text>
              <Text style={styles.toggleSub}>Notified on your predicted ovulation day</Text>
            </View>
            <Switch
              value={ovulationAlert}
              onValueChange={setOvulationAlert}
              trackColor={{ false: '#ddd', true: '#f9a8c4' }}
              thumbColor={ovulationAlert ? '#e75480' : '#fff'}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Daily Log Reminder</Text>
              <Text style={styles.toggleSub}>Reminded to log your symptoms each day</Text>
            </View>
            <Switch
              value={dailyLog}
              onValueChange={setDailyLog}
              trackColor={{ false: '#ddd', true: '#f9a8c4' }}
              thumbColor={dailyLog ? '#e75480' : '#fff'}
            />
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <View style={styles.themeRow}>
            {['light', 'dark'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.themeBtn, theme === t && styles.themeBtnSelected]}
                onPress={() => setTheme(t)}
                activeOpacity={0.8}
              >
                <Text style={styles.themeIcon}>{t === 'light' ? '☀️' : '🌙'}</Text>
                <Text style={[styles.themeBtnText, theme === t && styles.themeBtnTextSelected]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e75480',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  avatarEmail: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 14,
  },
  editBtn: {
    fontSize: 14,
    color: '#e75480',
    fontWeight: '600',
  },
  field: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontSize: 15,
    color: '#222',
  },
  fieldInputDisabled: {
    color: '#555',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12,
    color: '#aaa',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeBtnSelected: {
    backgroundColor: '#fde8ef',
    borderColor: '#e75480',
  },
  themeIcon: {
    fontSize: 16,
  },
  themeBtnText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  themeBtnTextSelected: {
    color: '#e75480',
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ff4d4d',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff4d4d',
  },
});
