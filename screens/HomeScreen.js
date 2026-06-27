import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { getCycleDay, getPhaseForDay, getDaysUntilNextPeriod, getNextPeriodDate, PHASES, CYCLE_LENGTH } from '../utils/cycleUtils';

// Mock last period start — replace with real stored value later
const LAST_PERIOD_START = '2026-06-16';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function PhasePill({ label, color }) {
  return (
    <View style={[styles.phasePill, { backgroundColor: color + '22', borderColor: color }]}>
      <View style={[styles.phaseDot, { backgroundColor: color }]} />
      <Text style={[styles.phasePillText, { color }]}>{label}</Text>
    </View>
  );
}

function CycleStrip({ cycleDay }) {
  const segments = [
    { label: 'Period',      days: [1, 5],   color: '#e75480' },
    { label: 'Follicular',  days: [6, 13],  color: '#fbbf24' },
    { label: 'Fertile',     days: [10, 17], color: '#86efac' },
    { label: 'Ovulation',   days: [14, 14], color: '#fb923c' },
    { label: 'Luteal',      days: [15, 28], color: '#c084fc' },
  ];

  // Build 28 day strip
  const days = Array.from({ length: CYCLE_LENGTH }, (_, i) => i + 1);

  return (
    <View style={styles.stripContainer}>
      <View style={styles.strip}>
        {days.map((d) => {
          const phase = getPhaseForDay(d);
          const color = PHASES[phase]?.color ?? '#eee';
          const isCurrent = d === cycleDay;
          return (
            <View
              key={d}
              style={[
                styles.stripDay,
                { backgroundColor: color },
                isCurrent && styles.stripDayCurrent,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.stripLabels}>
        <Text style={styles.stripLabelText}>Day 1</Text>
        <Text style={styles.stripLabelText}>Day 14</Text>
        <Text style={styles.stripLabelText}>Day 28</Text>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const cycleDay    = getCycleDay(LAST_PERIOD_START);
  const phaseKey    = getPhaseForDay(cycleDay);
  const phase       = PHASES[phaseKey];
  const daysLeft    = getDaysUntilNextPeriod(LAST_PERIOD_START);
  const nextPeriod  = getNextPeriodDate(LAST_PERIOD_START);
  const userName    = 'Jane';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { backgroundColor: phase.color }]}>
        <Text style={styles.greeting}>{getGreeting()}, {userName} 👋</Text>
        <Text style={styles.headerSub}>Here's your cycle overview for today</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Current day card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardLeft}>
            <Text style={styles.cycleLabel}>Cycle Day</Text>
            <Text style={[styles.cycleDay, { color: phase.color }]}>{cycleDay}</Text>
            <PhasePill label={phase.label} color={phase.color} />
          </View>
          <View style={styles.mainCardDivider} />
          <View style={styles.mainCardRight}>
            <Text style={styles.nextLabel}>Next Period In</Text>
            <Text style={[styles.nextDays, { color: phase.color }]}>{daysLeft}</Text>
            <Text style={styles.nextDaysUnit}>days</Text>
            <Text style={styles.nextDate}>{nextPeriod}</Text>
          </View>
        </View>

        {/* 28-day strip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Cycle</Text>
          <CycleStrip cycleDay={cycleDay} />

          {/* Legend */}
          <View style={styles.legend}>
            {Object.entries(PHASES).map(([key, val]) => (
              <View key={key} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: val.color }]} />
                <Text style={styles.legendText}>{val.label}</Text>
                <Text style={styles.legendDays}>Day {val.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Phase info card */}
        <View style={[styles.phaseInfoCard, { borderLeftColor: phase.color }]}>
          <Text style={[styles.phaseInfoTitle, { color: phase.color }]}>{phase.label}</Text>
          <Text style={styles.phaseInfoText}>{getPhaseDescription(phaseKey)}</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: phase.color }]}
            onPress={() => navigation.navigate('Log')}
          >
            <Text style={styles.actionBtnText}>📝  Log Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: phase.color }]}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={[styles.actionBtnOutlineText, { color: phase.color }]}>📅  Calendar</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

function getPhaseDescription(phaseKey) {
  const descriptions = {
    period:     'Your period has started. Focus on rest and self-care. Stay hydrated and manage cramps with heat or light movement.',
    follicular: 'Your body is preparing for ovulation. Energy levels are rising — a great time to be active and social.',
    fertile:    'You are in your fertile window. Chances of conception are higher. Cervical mucus may become clear and stretchy.',
    ovulation:  'Ovulation day! Your egg is being released. You may feel a slight twinge or increased energy and libido.',
    luteal:     'Post-ovulation phase. Progesterone rises. You may experience PMS symptoms as your body prepares for the next cycle.',
  };
  return descriptions[phaseKey] ?? '';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    }),
  },
  mainCardLeft: {
    flex: 1,
    alignItems: 'center',
  },
  mainCardDivider: {
    width: 1,
    height: 80,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  mainCardRight: {
    flex: 1,
    alignItems: 'center',
  },
  cycleLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  cycleDay: {
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 60,
  },
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
  },
  phaseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  phasePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  nextLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  nextDays: {
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 60,
  },
  nextDaysUnit: {
    fontSize: 13,
    color: '#aaa',
  },
  nextDate: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    }),
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  stripContainer: {
    marginBottom: 12,
  },
  strip: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    gap: 1,
  },
  stripDay: {
    flex: 1,
  },
  stripDayCurrent: {
    borderWidth: 2,
    borderColor: '#111',
    borderRadius: 2,
  },
  stripLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stripLabelText: {
    fontSize: 10,
    color: '#bbb',
  },
  legend: {
    gap: 8,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
  },
  legendDays: {
    fontSize: 11,
    color: '#bbb',
  },
  phaseInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    }),
  },
  phaseInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  phaseInfoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnOutline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  actionBtnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
