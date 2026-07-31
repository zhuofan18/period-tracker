import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import FadeInView from '../components/FadeInView';
import BloomButton from '../components/BloomButton';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { getCycleDay, getPhaseForDay, PHASES, CYCLE_LENGTH, PERIOD_LENGTH, addDays, getCurrentCycleStart, getPhaseDates } from '../utils/cycleUtils';

function buildMarkedDates(lastPeriodStartStr, cycleLength, periodLength) {
  const currentStart = getCurrentCycleStart(lastPeriodStartStr, cycleLength);
  const marked = {};

  for (let c = 0; c < 3; c++) {
    const cycleStart = addDays(currentStart, c * cycleLength);
    for (let i = 0; i < cycleLength; i++) {
      const dateStr  = addDays(cycleStart, i);
      const dayNum   = i + 1;
      const phaseKey = getPhaseForDay(dayNum, periodLength);
      if (!phaseKey) continue;
      const prevKey = getPhaseForDay(dayNum - 1, periodLength);
      const nextKey = getPhaseForDay(dayNum + 1, periodLength);
      const phase   = PHASES[phaseKey];
      marked[dateStr] = {
        color:       phase.color,
        textColor:   phase.textColor,
        startingDay: phaseKey !== prevKey,
        endingDay:   phaseKey !== nextKey,
      };
    }
  }

  const predictedNext = addDays(currentStart, 3 * cycleLength);
  marked[predictedNext] = {
    color:       PHASES.period.color + '99',
    textColor:   '#fff',
    startingDay: true,
    endingDay:   true,
  };

  return marked;
}

const PHASE_DESCRIPTIONS = {
  period:     'Your period is here. Focus on rest, hydration, and managing cramps.',
  follicular: 'Your body is rebuilding. Energy and mood are gradually rising.',
  fertile:    'Your fertile window — chances of conception are higher.',
  ovulation:  'Ovulation day! Your egg is being released. Peak fertility.',
  luteal:     'Post-ovulation phase. You may notice PMS symptoms as your cycle winds down.',
};

const today = new Date().toISOString().split('T')[0];

export default function CalendarScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const navigation = useNavigation();

  const [lastPeriodStart, setLastPeriodStart] = useState(null);
  const [selectedDate, setSelectedDate]       = useState(null);
  const [cycleLength, setCycleLength]         = useState(CYCLE_LENGTH);
  const [periodLength, setPeriodLength]       = useState(PERIOD_LENGTH);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('cycle_length, period_length')
          .eq('id', user.id)
          .single();
        if (profile) {
          if (profile.cycle_length)  setCycleLength(profile.cycle_length);
          if (profile.period_length) setPeriodLength(profile.period_length);
        }
        const { data } = await supabase
          .from('periods')
          .select('start_date')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false })
          .limit(1);
        if (data && data.length > 0) setLastPeriodStart(data[0].start_date);
      };
      load();
    }, [])
  );

  const markedDates       = lastPeriodStart ? buildMarkedDates(lastPeriodStart, cycleLength, periodLength) : {};
  const cycleDay          = lastPeriodStart ? getCycleDay(lastPeriodStart, cycleLength) : null;
  const currentCycleStart = lastPeriodStart ? getCurrentCycleStart(lastPeriodStart, cycleLength) : null;
  const phaseDates        = currentCycleStart ? getPhaseDates(currentCycleStart, cycleLength, periodLength) : null;

  const getSelectedInfo = (dateStr) => {
    if (!lastPeriodStart) return null;
    const diff = Math.floor(
      (new Date(dateStr) - new Date(lastPeriodStart)) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return null;
    const day      = (diff % cycleLength) + 1;
    const phaseKey = getPhaseForDay(day, periodLength);
    if (!phaseKey) return null;
    return { day, phaseKey, phase: PHASES[phaseKey] };
  };

  const onDayPress = (day) => {
    setSelectedDate((prev) => (prev === day.dateString ? null : day.dateString));
  };

  const selectedInfo = selectedDate ? getSelectedInfo(selectedDate) : null;

  const displayDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <FadeInView style={s.screen}>
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <Text style={s.headerTitle}>My Cycle</Text>
          <BloomButton onPress={() => navigation.navigate('Chat')} />
        </View>
        <Text style={s.headerSub}>{cycleDay ? `Day ${cycleDay} of ${cycleLength}` : 'No period logged yet'}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Calendar
          current={today}
          onDayPress={onDayPress}
          markingType="period"
          markedDates={markedDates}
          theme={{
            backgroundColor:        theme.card,
            calendarBackground:     theme.card,
            todayTextColor:         theme.primary,
            arrowColor:             theme.primary,
            monthTextColor:         theme.text,
            textMonthFontWeight:    'bold',
            textDayFontSize:        14,
            dayTextColor:           theme.text,
            textDisabledColor:      theme.muted,
          }}
          style={[s.calendar, { backgroundColor: theme.card }]}
        />

        {/* No period logged — prompt to get started */}
        {!lastPeriodStart && (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>📅</Text>
            <Text style={s.emptyTitle}>Your cycle map is empty</Text>
            <Text style={s.emptySub}>Log your first period start date to see your cycle phases mapped on the calendar.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
              <Text style={s.emptyBtnText}>Go to Home to Log Period</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Selected day info */}
        {lastPeriodStart && (selectedInfo ? (
          <View style={[s.dayCard, { borderLeftColor: selectedInfo.phase.color }]}>
            <Text style={[s.dayCardTitle, { color: selectedInfo.phase.color }]}>
              Day {selectedInfo.day} — {selectedInfo.phase.label}
            </Text>
            <Text style={s.dayCardDate}>{displayDate}</Text>
            <Text style={s.dayCardDesc}>{PHASE_DESCRIPTIONS[selectedInfo.phaseKey]}</Text>
          </View>
        ) : (
          <View style={s.tapHint}>
            <Text style={s.tapHintText}>Tap any date to see phase details</Text>
          </View>
        ))}

        {/* Legend */}
        <View style={s.legend}>
          <Text style={s.legendTitle}>Cycle Phases</Text>
          {Object.entries(PHASES).map(([key, val]) => (
            <View key={key} style={s.legendRow}>
              <View style={[s.legendDot, { backgroundColor: val.color }]} />
              <Text style={s.legendLabel}>{val.label}</Text>
              <Text style={s.legendDay}>
                {phaseDates ? phaseDates[key] : `Day ${val.day}`}
              </Text>
            </View>
          ))}
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: PHASES.period.color, opacity: 0.4 }]} />
            <Text style={s.legendLabel}>Predicted Next Period</Text>
            {phaseDates && <Text style={s.legendDay}>{phaseDates.nextPeriod}</Text>}
          </View>
        </View>
      </ScrollView>
    </FadeInView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: theme.text },
  chatBtn:      { padding: 4 },
  chatBtnText:  { color: theme.muted, fontSize: 24, letterSpacing: 2, fontWeight: '400' },
  headerSub:    { fontSize: 13, color: theme.muted, marginTop: 4 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  calendar: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  dayCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    ...Platform.select({
      web:     { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    }),
  },
  dayCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  dayCardDate:  { fontSize: 12, color: theme.muted, marginBottom: 8 },
  dayCardDesc:  { fontSize: 13, color: theme.subtext, lineHeight: 20 },
  tapHint: { alignItems: 'center', paddingVertical: 12 },
  tapHintText: { fontSize: 13, color: theme.muted },
  emptyCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20, alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } }),
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyBtn:   { backgroundColor: '#e75480', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  legend: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    ...Platform.select({
      web:     { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    }),
  },
  legendTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot:   { width: 14, height: 14, borderRadius: 7 },
  legendLabel: { flex: 1, fontSize: 13, color: theme.text },
  legendDay:   { fontSize: 12, color: theme.muted },
});
