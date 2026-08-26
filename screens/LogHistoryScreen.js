import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { SYMPTOM_EMOJI_MAP, MOOD_EMOJI_MAP } from '../components/SymptomMoodPicker';
import { getPhaseForDay, getAvgCycleLength, PHASES, CYCLE_LENGTH, PERIOD_LENGTH } from '../utils/cycleUtils';
import { shadow } from '../theme/spacing';
import { fontFamily } from '../theme/typography';

// Label → short display label for phase-specific keys
const KEY_LABELS = {
  'Flow Intensity': 'Flow',
  'Pain Level':     'Pain',
  'Energy Level':   'Energy',
  'Sleep Quality':  'Sleep',
  'Cervical Mucus': 'Mucus',
  'Libido':         'Libido',
  'Exercise Today': 'Exercise',
};

function parseLog(phase_answers) {
  if (!phase_answers) return { kvPairs: [], symptoms: [], moods: [] };

  const symptoms = (phase_answers.Symptoms || []).slice(0, 8);
  const moods    = (phase_answers.Mood    || []).slice(0, 6);
  const kvPairs  = [];

  for (const [key, val] of Object.entries(phase_answers)) {
    if (key === 'Symptoms' || key === 'Mood') continue;
    if (typeof val === 'string' && val) {
      kvPairs.push({ key: KEY_LABELS[key] || key, val });
    }
  }

  return { kvPairs: kvPairs.slice(0, 4), symptoms, moods };
}

function groupByMonth(logs) {
  const sections = [];
  const map = {};
  for (const log of logs) {
    const key = new Date(log.log_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!map[key]) { map[key] = []; sections.push({ title: key, data: map[key] }); }
    map[key].push(log);
  }
  return sections;
}

export default function LogHistoryScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const navigation = useNavigation();

  const [logs, setLogs]               = useState([]);
  const [lastPeriodStart, setLastPeriodStart] = useState(null);
  const [cycleLength, setCycleLength]  = useState(CYCLE_LENGTH);
  const [periodLength, setPeriodLength] = useState(PERIOD_LENGTH);
  const [loading, setLoading]          = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Pull recent history (not just the latest period) so cycle length can be
      // learned from real data instead of relying on the static profile setting.
      const [{ data: profile }, { data: periods }, { data: logData }] = await Promise.all([
        supabase.from('profiles').select('cycle_length, period_length').eq('id', user.id).single(),
        supabase.from('periods').select('start_date').eq('user_id', user.id).order('start_date', { ascending: false }).limit(12),
        supabase.from('daily_logs')
          .select('log_date, phase_answers, notes, updated_at')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false }),
      ]);

      if (profile?.period_length) setPeriodLength(profile.period_length);
      if (periods?.length) {
        setLastPeriodStart(periods[0].start_date);
        setCycleLength(getAvgCycleLength(periods, profile?.cycle_length || CYCLE_LENGTH));
      } else {
        setCycleLength(profile?.cycle_length || CYCLE_LENGTH);
      }
      setLogs(logData || []);
      setLoading(false);
    };
    load();
  }, []);

  const getPhaseKey = (dateStr) => {
    if (!lastPeriodStart) return 'follicular';
    const diff = Math.floor((new Date(dateStr) - new Date(lastPeriodStart)) / 86400000);
    if (diff < 0) return 'follicular';
    return getPhaseForDay((diff % cycleLength) + 1, periodLength, cycleLength);
  };

  const openLog = (dateStr) =>
    navigation.navigate('MainApp', { screen: 'Log', params: { date: dateStr } });

  if (loading) {
    return (
      <View style={[s.screen, s.center]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const sections = groupByMonth(logs);

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Log History</Text>
        <Text style={s.headerCount}>{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</Text>
      </View>

      {logs.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={s.emptyTitle}>No logs yet</Text>
          <Text style={s.emptySub}>Save a daily log and it will appear here for easy reference.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.title}>
              <Text style={s.monthHeader}>{section.title}</Text>
              {section.data.map((log) => {
                const phaseKey = getPhaseKey(log.log_date);
                const phase    = PHASES[phaseKey];
                const date     = new Date(log.log_date);
                const dayLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                const { kvPairs, symptoms, moods } = parseLog(log.phase_answers);
                const hasContent = kvPairs.length > 0 || symptoms.length > 0 || moods.length > 0 || log.notes;

                return (
                  <TouchableOpacity
                    key={log.log_date}
                    style={[s.card, { borderLeftColor: phase.color }]}
                    onPress={() => openLog(log.log_date)}
                    activeOpacity={0.8}
                  >
                    {/* Top row: date + phase */}
                    <View style={s.cardTop}>
                      <Text style={s.cardDate}>{dayLabel}</Text>
                      <View style={[s.phaseBadge, { backgroundColor: phase.color + '22' }]}>
                        <Text style={[s.phaseBadgeText, { color: phase.color }]}>{phase.label}</Text>
                      </View>
                    </View>

                    {!hasContent && (
                      <Text style={s.emptyLog}>No details recorded</Text>
                    )}

                    {/* Phase-specific answers: Flow, Pain, Energy, etc. */}
                    {kvPairs.length > 0 && (
                      <View style={s.kvRow}>
                        {kvPairs.map(({ key, val }) => (
                          <View key={key} style={s.kvChip}>
                            <Text style={s.kvKey}>{key}</Text>
                            <Text style={s.kvVal}>{val}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Symptoms */}
                    {symptoms.length > 0 && (
                      <View style={s.section}>
                        <Text style={s.sectionLabel}>Symptoms</Text>
                        <View style={s.pillRow}>
                          {symptoms.map(sym => (
                            <View key={sym} style={s.pill}>
                              <Text style={s.pillText}>{SYMPTOM_EMOJI_MAP[sym] || '🔹'} {sym}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Moods */}
                    {moods.length > 0 && (
                      <View style={s.section}>
                        <Text style={s.sectionLabel}>Mood</Text>
                        <View style={s.pillRow}>
                          {moods.map(m => (
                            <View key={m} style={[s.pill, s.pillMood]}>
                              <Text style={s.pillText}>{MOOD_EMOJI_MAP[m] || '😊'} {m}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Notes preview */}
                    {log.notes ? (
                      <Text style={s.notesPreview} numberOfLines={2}>📝 {log.notes}</Text>
                    ) : null}

                    <Text style={s.tapHint}>Tap to view or edit →</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen:  { flex: 1, backgroundColor: theme.surface },
  center:  { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    backgroundColor: theme.card,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn:     { padding: 2 },
  backArrow:   { fontSize: 22, color: theme.text },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: fontFamily.bold, color: theme.text },
  headerCount: { fontSize: 13, color: theme.muted },

  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontFamily: fontFamily.bold, color: theme.text, marginBottom: 8 },
  emptySub:   { fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 20 },

  content:     { padding: 16, paddingBottom: 32 },
  monthHeader: {
    fontSize: 12, fontFamily: fontFamily.bold, color: theme.muted,
    textTransform: 'uppercase', letterSpacing: 0.9,
    marginTop: 24, marginBottom: 10, marginLeft: 4,
  },

  card: {
    backgroundColor: theme.card, borderRadius: 16, padding: 14,
    marginBottom: 10, borderLeftWidth: 4,
    ...Platform.select(shadow),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardDate: { fontSize: 14, fontFamily: fontFamily.bold, color: theme.text },
  phaseBadge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  phaseBadgeText: { fontSize: 11, fontFamily: fontFamily.bold },

  emptyLog: { fontSize: 12, color: theme.muted, fontStyle: 'italic', marginBottom: 8 },

  kvRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  kvChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.surface, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: theme.border,
  },
  kvKey: { fontSize: 11, color: theme.muted, fontFamily: fontFamily.semibold },
  kvVal: { fontSize: 12, color: theme.text, fontFamily: fontFamily.bold },

  section:      { marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontFamily: fontFamily.bold, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  pillRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#e7548015', borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: '#e7548035',
  },
  pillMood: { backgroundColor: '#c084fc15', borderColor: '#c084fc35' },
  pillText: { fontSize: 12, color: theme.text },

  notesPreview: { fontSize: 12, color: theme.muted, fontStyle: 'italic', marginTop: 6, marginBottom: 2, lineHeight: 17 },
  tapHint:      { fontSize: 11, color: theme.muted, marginTop: 8, textAlign: 'right' },
});
