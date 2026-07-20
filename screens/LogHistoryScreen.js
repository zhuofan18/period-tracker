import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { getPhaseForDay, PHASES, CYCLE_LENGTH, PERIOD_LENGTH } from '../utils/cycleUtils';

function getSummaryTags(phase_answers) {
  if (!phase_answers) return [];
  const tags = [];
  for (const [, val] of Object.entries(phase_answers)) {
    if (Array.isArray(val)) {
      tags.push(...val.slice(0, 2));
    } else if (val) {
      tags.push(val);
    }
    if (tags.length >= 4) break;
  }
  return tags.slice(0, 4);
}

function groupByMonth(logs) {
  const sections = [];
  const map = {};
  for (const log of logs) {
    const d = new Date(log.log_date);
    const key = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
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
  const [cycleLength, setCycleLength] = useState(CYCLE_LENGTH);
  const [periodLength, setPeriodLength] = useState(PERIOD_LENGTH);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: profile }, { data: periods }, { data: logData }] = await Promise.all([
        supabase.from('profiles').select('cycle_length, period_length').eq('id', user.id).single(),
        supabase.from('periods').select('start_date').eq('user_id', user.id).order('start_date', { ascending: false }).limit(1),
        supabase.from('daily_logs').select('log_date, phase_answers, notes').eq('user_id', user.id).order('log_date', { ascending: false }),
      ]);

      if (profile?.cycle_length)  setCycleLength(profile.cycle_length);
      if (profile?.period_length) setPeriodLength(profile.period_length);
      if (periods?.[0])           setLastPeriodStart(periods[0].start_date);
      setLogs(logData || []);
      setLoading(false);
    };
    load();
  }, []);

  const getPhaseForDate = (dateStr) => {
    if (!lastPeriodStart) return null;
    const diff = Math.floor((new Date(dateStr) - new Date(lastPeriodStart)) / (1000 * 60 * 60 * 24));
    if (diff < 0) return null;
    const day = (diff % cycleLength) + 1;
    return getPhaseForDay(day, periodLength);
  };

  const openLog = (dateStr) => {
    navigation.navigate('MainApp', { screen: 'Log', params: { date: dateStr } });
  };

  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e75480" />
      </View>
    );
  }

  const sections = groupByMonth(logs);

  return (
    <View style={s.screen}>
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
          <Text style={s.emptySub}>Start logging your daily symptoms and they'll appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {sections.map((section) => (
            <View key={section.title}>
              <Text style={s.monthHeader}>{section.title}</Text>
              {section.data.map((log) => {
                const phaseKey = getPhaseForDate(log.log_date) || 'follicular';
                const phase    = PHASES[phaseKey];
                const tags     = getSummaryTags(log.phase_answers);
                const date     = new Date(log.log_date);
                const dayLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

                return (
                  <TouchableOpacity
                    key={log.log_date}
                    style={[s.logCard, { borderLeftColor: phase.color }]}
                    onPress={() => openLog(log.log_date)}
                    activeOpacity={0.8}
                  >
                    <View style={s.logTop}>
                      <Text style={s.logDate}>{dayLabel}</Text>
                      <View style={[s.phaseBadge, { backgroundColor: phase.color + '22' }]}>
                        <Text style={[s.phaseBadgeText, { color: phase.color }]}>{phase.label}</Text>
                      </View>
                    </View>

                    {tags.length > 0 && (
                      <View style={s.tags}>
                        {tags.map((tag, i) => (
                          <View key={i} style={s.tag}>
                            <Text style={s.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {log.notes ? (
                      <Text style={s.notesPreview} numberOfLines={1}>📝 {log.notes}</Text>
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
  screen: { flex: 1, backgroundColor: theme.surface },
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
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: theme.text },
  headerCount: { fontSize: 13, color: theme.muted },

  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.text, marginBottom: 8 },
  emptySub:   { fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 20 },

  content:     { padding: 16, paddingBottom: 32 },
  monthHeader: { fontSize: 13, fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 10, marginLeft: 4 },

  logCard: {
    backgroundColor: theme.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderLeftWidth: 4,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 } }),
  },
  logTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  logDate:      { fontSize: 14, fontWeight: '700', color: theme.text },
  phaseBadge:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  phaseBadgeText: { fontSize: 11, fontWeight: '700' },

  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tag:     { backgroundColor: theme.optionBg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontSize: 12, color: theme.text },

  notesPreview: { fontSize: 12, color: theme.muted, marginBottom: 4, fontStyle: 'italic' },
  tapHint:      { fontSize: 11, color: theme.muted, marginTop: 4, textAlign: 'right' },
});
