import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from 'react-native';

// Mock data — will be replaced with real tracked data later
const STATS = {
  avgCycleLength: 28,
  avgPeriodLength: 5,
  longestCycle: 31,
  shortestCycle: 25,
  regularity: 'Regular',
  regularityPercent: 85,
  cyclesTracked: 4,
  recentCycles: [27, 28, 31, 26], // days per cycle, most recent last
};

function StatCard({ label, value, unit, sub, color = '#e75480' }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.cardValueRow}>
        <Text style={[styles.cardValue, { color }]}>{value}</Text>
        {unit ? <Text style={styles.cardUnit}> {unit}</Text> : null}
      </View>
      {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
    </View>
  );
}

function CycleBar({ days, maxDays, index }) {
  const barHeight = (days / maxDays) * 80;
  return (
    <View style={styles.barWrapper}>
      <Text style={styles.barDays}>{days}d</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: barHeight }]} />
      </View>
      <Text style={styles.barIndex}>C{index + 1}</Text>
    </View>
  );
}

export default function StatisticsScreen({ navigation }) {
  const maxDays = Math.max(...STATS.recentCycles);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics & Insights</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Summary cards */}
        <View style={styles.cardGrid}>
          <StatCard
            label="Avg. Cycle Length"
            value={STATS.avgCycleLength}
            unit="days"
            sub={`${STATS.shortestCycle}–${STATS.longestCycle} day range`}
            color="#e75480"
          />
          <StatCard
            label="Avg. Period Length"
            value={STATS.avgPeriodLength}
            unit="days"
            color="#c084fc"
          />
          <StatCard
            label="Cycle Regularity"
            value={STATS.regularity}
            sub={`${STATS.regularityPercent}% consistent`}
            color="#34d399"
          />
          <StatCard
            label="Cycles Tracked"
            value={STATS.cyclesTracked}
            unit="cycles"
            color="#fb923c"
          />
        </View>

        {/* Regularity bar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cycle Regularity</Text>
          <View style={styles.regularityTrack}>
            <View
              style={[
                styles.regularityFill,
                { width: `${STATS.regularityPercent}%` },
              ]}
            />
          </View>
          <View style={styles.regularityLabels}>
            <Text style={styles.regularityLabelLeft}>Irregular</Text>
            <Text style={styles.regularityValue}>{STATS.regularityPercent}%</Text>
            <Text style={styles.regularityLabelRight}>Regular</Text>
          </View>
        </View>

        {/* Recent cycles bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Cycles</Text>
          <Text style={styles.sectionSub}>Length of your last {STATS.recentCycles.length} cycles</Text>
          <View style={styles.barChart}>
            {STATS.recentCycles.map((days, i) => (
              <CycleBar key={i} days={days} maxDays={maxDays} index={i} />
            ))}
          </View>
        </View>

        {/* Insight banner */}
        <View style={styles.insightBanner}>
          <Text style={styles.insightIcon}>💡</Text>
          <Text style={styles.insightText}>
            Your cycles have been consistent over the past {STATS.cyclesTracked} months.
            Keep logging to improve prediction accuracy.
          </Text>
        </View>

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
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
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
  cardLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontWeight: '500',
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  cardUnit: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  regularityTrack: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 12,
  },
  regularityFill: {
    height: '100%',
    backgroundColor: '#34d399',
    borderRadius: 6,
  },
  regularityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  regularityLabelLeft: { fontSize: 11, color: '#bbb' },
  regularityLabelRight: { fontSize: 11, color: '#bbb' },
  regularityValue: { fontSize: 13, fontWeight: '700', color: '#34d399' },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 110,
    marginTop: 8,
  },
  barWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  barDays: {
    fontSize: 11,
    color: '#999',
  },
  barTrack: {
    width: 32,
    height: 80,
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#e75480',
    borderRadius: 8,
  },
  barIndex: {
    fontSize: 11,
    color: '#bbb',
  },
  insightBanner: {
    flexDirection: 'row',
    backgroundColor: '#fff5f8',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#fde8ef',
  },
  insightIcon: {
    fontSize: 20,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});
