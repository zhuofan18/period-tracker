import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

function calcStats(periods) {
  if (periods.length < 2) return null;

  const sorted = [...periods].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const cycleLengths = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i].start_date) - new Date(sorted[i - 1].start_date)) / (1000 * 60 * 60 * 24)
    );
    if (diff > 0 && diff < 60) cycleLengths.push(diff);
  }

  if (cycleLengths.length === 0) return null;

  const avg = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
  const min = Math.min(...cycleLengths);
  const max = Math.max(...cycleLengths);

  const variance = cycleLengths.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / cycleLengths.length;
  const stdDev   = Math.sqrt(variance);
  const regularityPct = Math.max(0, Math.round(100 - (stdDev / avg) * 100));
  const regularity    = regularityPct >= 75 ? 'Regular' : regularityPct >= 50 ? 'Moderate' : 'Irregular';

  const periodLengths = sorted
    .filter(p => p.end_date)
    .map(p => Math.round((new Date(p.end_date) - new Date(p.start_date)) / (1000 * 60 * 60 * 24)) + 1);
  const avgPeriodLength = periodLengths.length > 0
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : null;

  return { avg, min, max, regularity, regularityPct, cyclesTracked: cycleLengths.length, recentCycles: cycleLengths.slice(-6), avgPeriodLength };
}

function StatCard({ label, value, unit, sub, color, theme }) {
  const s = cardStyles(theme);
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{label}</Text>
      <View style={s.cardValueRow}>
        <Text style={[s.cardValue, { color }]}>{value}</Text>
        {unit ? <Text style={s.cardUnit}> {unit}</Text> : null}
      </View>
      {sub ? <Text style={s.cardSub}>{sub}</Text> : null}
    </View>
  );
}

const cardStyles = (theme) => StyleSheet.create({
  card: {
    width: '47%', backgroundColor: theme.card, borderRadius: 16, padding: 16,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } }),
  },
  cardLabel:    { fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: '500' },
  cardValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  cardValue:    { fontSize: 28, fontWeight: '800' },
  cardUnit:     { fontSize: 13, color: theme.muted, marginBottom: 4 },
  cardSub:      { fontSize: 11, color: theme.muted, marginTop: 4 },
});

function CycleBar({ days, maxDays, theme }) {
  const barHeight = (days / maxDays) * 80;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Text style={{ fontSize: 11, color: theme.muted }}>{days}d</Text>
      <View style={{ width: 32, height: 80, backgroundColor: theme.optionBg, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' }}>
        <View style={{ width: '100%', height: barHeight, backgroundColor: '#e75480', borderRadius: 8 }} />
      </View>
    </View>
  );
}

export default function StatisticsScreen() {
  const { theme } = useTheme();
  const s = styles(theme);

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: periods } = await supabase
          .from('periods')
          .select('start_date, end_date')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });
        setStats(periods ? calcStats(periods) : null);
        setLoading(false);
      };
      load();
    }, [])
  );

  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e75480" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={s.screen}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Statistics & Insights</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text, marginBottom: 8 }}>Not enough data yet</Text>
          <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 20 }}>
            Log at least 2 period start dates to see your cycle statistics and trends.
          </Text>
        </View>
      </View>
    );
  }

  const maxDays = Math.max(...stats.recentCycles);

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Statistics & Insights</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.cardGrid}>
          <StatCard label="Avg. Cycle Length" value={stats.avg} unit="days" sub={`${stats.min}–${stats.max} day range`} color="#e75480" theme={theme} />
          <StatCard label="Avg. Period Length" value={stats.avgPeriodLength ?? '—'} unit={stats.avgPeriodLength ? 'days' : ''} sub={stats.avgPeriodLength ? null : 'Log end dates to track'} color="#c084fc" theme={theme} />
          <StatCard label="Cycle Regularity" value={stats.regularity} sub={`${stats.regularityPct}% consistent`} color="#34d399" theme={theme} />
          <StatCard label="Cycles Tracked" value={stats.cyclesTracked} unit="cycles" color="#fb923c" theme={theme} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Cycle Regularity</Text>
          <View style={s.regularityTrack}>
            <View style={[s.regularityFill, { width: `${stats.regularityPct}%` }]} />
          </View>
          <View style={s.regularityLabels}>
            <Text style={s.regularityLabelSide}>Irregular</Text>
            <Text style={s.regularityValue}>{stats.regularityPct}%</Text>
            <Text style={s.regularityLabelSide}>Regular</Text>
          </View>
        </View>

        {stats.recentCycles.length > 1 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Cycles</Text>
            <Text style={s.sectionSub}>Length of your last {stats.recentCycles.length} cycles</Text>
            <View style={s.barChart}>
              {stats.recentCycles.map((days, i) => (
                <CycleBar key={i} days={days} maxDays={maxDays} theme={theme} />
              ))}
            </View>
          </View>
        )}

        <View style={s.insightBanner}>
          <Text style={s.insightIcon}>💡</Text>
          <Text style={s.insightText}>
            {stats.regularityPct >= 75
              ? `Your cycles have been consistent over the past ${stats.cyclesTracked} cycles. Keep logging to improve prediction accuracy.`
              : `Your cycles vary by ${stats.max - stats.min} days. Keep logging to help identify patterns.`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen:      { flex: 1, backgroundColor: theme.surface },
  header:      { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 14, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  content:     { padding: 20, gap: 20 },
  cardGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: {
    backgroundColor: theme.card, borderRadius: 16, padding: 18,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } }),
  },
  sectionTitle:         { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  sectionSub:           { fontSize: 12, color: theme.muted, marginBottom: 16 },
  regularityTrack:      { height: 12, backgroundColor: theme.optionBg, borderRadius: 6, overflow: 'hidden', marginTop: 12 },
  regularityFill:       { height: '100%', backgroundColor: '#34d399', borderRadius: 6 },
  regularityLabels:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  regularityLabelSide:  { fontSize: 11, color: theme.muted },
  regularityValue:      { fontSize: 13, fontWeight: '700', color: '#34d399' },
  barChart:             { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 110, marginTop: 8 },
  insightBanner:        { flexDirection: 'row', backgroundColor: theme.primaryLight, borderRadius: 14, padding: 16, gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: theme.primary + '33' },
  insightIcon:          { fontSize: 20 },
  insightText:          { flex: 1, fontSize: 13, color: theme.text, lineHeight: 20 },
});
