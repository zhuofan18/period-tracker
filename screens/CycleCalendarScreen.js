import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../context/ThemeContext';

const CYCLE_LENGTH = 28;
const PERIOD_LENGTH = 5;

const PHASES = {
  period:     { color: '#e75480', textColor: '#fff',    label: 'Menstrual Phase' },
  follicular: { color: '#fbbf24', textColor: '#78350f', label: 'Follicular Phase' },
  fertile:    { color: '#86efac', textColor: '#14532d', label: 'Fertile Window' },
  ovulation:  { color: '#fb923c', textColor: '#fff',    label: 'Ovulation' },
  luteal:     { color: '#c084fc', textColor: '#fff',    label: 'Luteal Phase' },
};

function getPhase(dayNum) {
  if (dayNum >= 1 && dayNum <= PERIOD_LENGTH) return 'period';
  if (dayNum === 14)                           return 'ovulation';
  if (dayNum >= 10 && dayNum <= 17)            return 'fertile';
  if (dayNum >= 6 && dayNum <= 13)             return 'follicular';
  if (dayNum > 17 && dayNum <= CYCLE_LENGTH)   return 'luteal';
  return null;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function buildMarkedDates(startDateStr) {
  const marked = {};

  for (let i = 0; i < CYCLE_LENGTH; i++) {
    const dateStr = addDays(startDateStr, i);
    const dayNum  = i + 1;
    const phase   = getPhase(dayNum);
    if (!phase) continue;

    const prevPhase = getPhase(dayNum - 1);
    const nextPhase = getPhase(dayNum + 1);

    marked[dateStr] = {
      color:       PHASES[phase].color,
      textColor:   PHASES[phase].textColor,
      startingDay: phase !== prevPhase,
      endingDay:   phase !== nextPhase,
    };
  }

  const nextStart = addDays(startDateStr, CYCLE_LENGTH);
  marked[nextStart] = {
    color: PHASES.period.color,
    textColor: PHASES.period.textColor,
    startingDay: true,
    endingDay: true,
  };

  return marked;
}

const FLOW_OPTIONS = ['Light', 'Medium', 'Heavy'];

const MOOD_OPTIONS = [
  'Happy 😊',
  'Calm 😌',
  'Anxious 😰',
  'Irritable 😤',
  'Sad 😢',
  'Tired 😴',
  'Sensitive 🥺',
  'Energetic ⚡',
];

const today = new Date().toISOString().split('T')[0];

export default function CycleCalendarScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  const [selectedDate, setSelectedDate] = useState(null);
  const [markedDates, setMarkedDates]   = useState({});
  const [flow, setFlow]                 = useState(null);
  const [symptoms, setSymptoms]         = useState('');
  const [moods, setMoods]               = useState([]);

  const onDayPress = (day) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    setMarkedDates(buildMarkedDates(dateStr));
  };

  const toggleMood = (mood) => {
    setMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your Cycle</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.prompt}>When did your last period start?</Text>
        <Text style={s.sub}>Tap a date on the calendar below.</Text>

        <Calendar
          current={today}
          maxDate={today}
          onDayPress={onDayPress}
          markingType="period"
          markedDates={markedDates}
          theme={{
            backgroundColor: theme.card,
            calendarBackground: theme.card,
            todayTextColor: '#e75480',
            selectedDayBackgroundColor: '#e75480',
            arrowColor: '#e75480',
            monthTextColor: theme.text,
            textMonthFontWeight: 'bold',
            textDayFontSize: 14,
            dayTextColor: theme.text,
            textDisabledColor: theme.muted,
          }}
          style={[s.calendar, { backgroundColor: theme.card }]}
        />

        {selectedDate && (
          <View style={s.legend}>
            {Object.entries(PHASES).map(([key, val]) => (
              <View key={key} style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: val.color }]} />
                <Text style={s.legendLabel}>{val.label}</Text>
              </View>
            ))}
            <View style={s.legendRow}>
              <View style={[s.legendDot, { backgroundColor: PHASES.period.color, opacity: 0.5 }]} />
              <Text style={s.legendLabel}>Predicted Next Period</Text>
            </View>
          </View>
        )}

        <Text style={s.sectionLabel}>How was your flow?</Text>
        <View style={s.flowRow}>
          {FLOW_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[s.flowBtn, flow === option && s.flowBtnSelected]}
              onPress={() => setFlow(option)}
              activeOpacity={0.8}
            >
              <Text style={[s.flowBtnText, flow === option && s.flowBtnTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>
          Describe your symptoms during or before your period
        </Text>
        <TextInput
          style={s.symptomsInput}
          placeholder="e.g. cramps, bloating, headaches..."
          placeholderTextColor={theme.placeholder}
          multiline
          numberOfLines={4}
          value={symptoms}
          onChangeText={setSymptoms}
          textAlignVertical="top"
        />

        <Text style={s.sectionLabel}>How was your mood during your period?</Text>
        <Text style={s.sub}>Select all that apply</Text>
        <View style={s.moodGrid}>
          {MOOD_OPTIONS.map((mood) => {
            const active = moods.includes(mood);
            return (
              <TouchableOpacity
                key={mood}
                style={[s.moodChip, active && s.moodChipSelected]}
                onPress={() => toggleMood(mood)}
                activeOpacity={0.8}
              >
                <Text style={[s.moodChipText, active && s.moodChipTextSelected]}>
                  {mood}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          style={[s.symptomsInput, { marginTop: 12 }]}
          placeholder="Describe your mood in your own words... (optional)"
          placeholderTextColor={theme.placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.continueBtn, !selectedDate && s.continueBtnDisabled]}
          disabled={!selectedDate}
          onPress={() => navigation.navigate('MainApp')}
        >
          <Text style={s.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 12,
    backgroundColor: theme.background,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: theme.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  prompt: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  sub: { fontSize: 13, color: theme.muted, marginBottom: 16 },
  calendar: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  legend: {
    marginTop: 20,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  legendLabel: { fontSize: 14, color: theme.text },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: theme.text, marginTop: 24, marginBottom: 10 },
  flowRow: { flexDirection: 'row', gap: 10 },
  flowBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.optionBg,
    alignItems: 'center',
  },
  flowBtnSelected: { backgroundColor: theme.primaryLight, borderColor: '#e75480' },
  flowBtnText: { fontSize: 14, color: theme.subtext, fontWeight: '500' },
  flowBtnTextSelected: { color: '#e75480', fontWeight: '700' },
  symptomsInput: {
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: theme.text,
    minHeight: 110,
    backgroundColor: theme.inputBg,
  },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.optionBg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodChipSelected: { backgroundColor: theme.primaryLight, borderColor: '#e75480' },
  moodChipText: { fontSize: 13, color: theme.subtext },
  moodChipTextSelected: { color: '#e75480', fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: theme.background },
  continueBtn: { backgroundColor: '#e75480', borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: '#f2b8cc' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
