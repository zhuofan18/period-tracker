import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STATS = {
  avgCycleLength: 28,
  avgPeriodLength: 5,
  longestCycle: 31,
  shortestCycle: 25,
  regularity: 'Regular',
  regularityPercent: 85,
  cyclesTracked: 4,
  recentCycles: [27, 28, 31, 26],
};

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
  cardLabel: { fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: '500' },
  cardValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  cardValue: { fontSize: 28, fontWeight: '800' },
  cardUnit: { fontSize: 13, color: theme.muted, marginBottom: 4 },
  cardSub: { fontSize: 11, color: theme.muted, marginTop: 4 },
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
  const maxDays = Math.max(...STATS.recentCycles);

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Statistics & Insights</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.cardGrid}>
          <StatCard label="Avg. Cycle Length" value={STATS.avgCycleLength} unit="days" sub={`${STATS.shortestCycle}–${STATS.longestCycle} day range`} color="#e75480" theme={theme} />
          <StatCard label="Avg. Period Length" value={STATS.avgPeriodLength} unit="days" color="#c084fc" theme={theme} />
          <StatCard label="Cycle Regularity" value={STATS.regularity} sub={`${STATS.regularityPercent}% consistent`} color="#34d399" theme={theme} />
          <StatCard label="Cycles Tracked" value={STATS.cyclesTracked} unit="cycles" color="#fb923c" theme={theme} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Cycle Regularity</Text>
          <View style={s.regularityTrack}>
            <View style={[s.regularityFill, { width: `${STATS.regularityPercent}%` }]} />
          </View>
          <View style={s.regularityLabels}>
            <Text style={s.regularityLabelSide}>Irregular</Text>
            <Text style={s.regularityValue}>{STATS.regularityPercent}%</Text>
            <Text style={s.regularityLabelSide}>Regular</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Cycles</Text>
          <Text style={s.sectionSub}>Length of your last {STATS.recentCycles.length} cycles</Text>
          <View style={s.barChart}>
            {STATS.recentCycles.map((days, i) => (
              <CycleBar key={i} days={days} maxDays={maxDays} theme={theme} />
            ))}
          </View>
        </View>

        <View style={s.insightBanner}>
          <Text style={s.insightIcon}>💡</Text>
          <Text style={s.insightText}>Your cycles have been consistent over the past {STATS.cyclesTracked} months. Keep logging to improve prediction accuracy.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 14, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  content: { padding: 20, gap: 20 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: {
    backgroundColor: theme.card, borderRadius: 16, padding: 18,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } }),
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: theme.muted, marginBottom: 16 },
  regularityTrack: { height: 12, backgroundColor: theme.optionBg, borderRadius: 6, overflow: 'hidden', marginTop: 12 },
  regularityFill: { height: '100%', backgroundColor: '#34d399', borderRadius: 6 },
  regularityLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  regularityLabelSide: { fontSize: 11, color: theme.muted },
  regularityValue: { fontSize: 13, fontWeight: '700', color: '#34d399' },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 110, marginTop: 8 },
  insightBanner: { flexDirection: 'row', backgroundColor: theme.primaryLight, borderRadius: 14, padding: 16, gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: theme.primary + '33' },
  insightIcon: { fontSize: 20 },
  insightText: { flex: 1, fontSize: 13, color: theme.text, lineHeight: 20 },
});
