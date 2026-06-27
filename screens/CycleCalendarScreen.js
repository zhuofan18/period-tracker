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

  // Predicted next period start
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
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cycle</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.prompt}>When did your last period start?</Text>
        <Text style={styles.sub}>Tap a date on the calendar below.</Text>

        <Calendar
          current={today}
          maxDate={today}
          onDayPress={onDayPress}
          markingType="period"
          markedDates={markedDates}
          theme={{
            todayTextColor: '#e75480',
            selectedDayBackgroundColor: '#e75480',
            arrowColor: '#e75480',
            monthTextColor: '#111',
            textMonthFontWeight: 'bold',
            textDayFontSize: 14,
          }}
          style={styles.calendar}
        />

        {/* Legend */}
        {selectedDate && (
          <View style={styles.legend}>
            {Object.entries(PHASES).map(([key, val]) => (
              <View key={key} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: val.color }]} />
                <Text style={styles.legendLabel}>{val.label}</Text>
              </View>
            ))}
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: PHASES.period.color, opacity: 0.5 }]} />
              <Text style={styles.legendLabel}>Predicted Next Period</Text>
            </View>
          </View>
        )}

        {/* Flow type */}
        <Text style={styles.sectionLabel}>How was your flow?</Text>
        <View style={styles.flowRow}>
          {FLOW_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.flowBtn, flow === option && styles.flowBtnSelected]}
              onPress={() => setFlow(option)}
              activeOpacity={0.8}
            >
              <Text style={[styles.flowBtnText, flow === option && styles.flowBtnTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Symptoms input */}
        <Text style={styles.sectionLabel}>
          Describe your symptoms during or before your period
        </Text>
        <TextInput
          style={styles.symptomsInput}
          placeholder="e.g. cramps, bloating, headaches..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          value={symptoms}
          onChangeText={setSymptoms}
          textAlignVertical="top"
        />

        {/* Mood */}
        <Text style={styles.sectionLabel}>How was your mood during your period?</Text>
        <Text style={styles.sub}>Select all that apply</Text>
        <View style={styles.moodGrid}>
          {MOOD_OPTIONS.map((mood) => {
            const active = moods.includes(mood);
            return (
              <TouchableOpacity
                key={mood}
                style={[styles.moodChip, active && styles.moodChipSelected]}
                onPress={() => toggleMood(mood)}
                activeOpacity={0.8}
              >
                <Text style={[styles.moodChipText, active && styles.moodChipTextSelected]}>
                  {mood}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          style={[styles.symptomsInput, { marginTop: 12 }]}
          placeholder="Describe your mood in your own words... (optional)"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !selectedDate && styles.continueBtnDisabled]}
          disabled={!selectedDate}
          onPress={() => navigation.navigate('MainApp')}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: '#222' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  prompt: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  legend: {
    marginTop: 20,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendLabel: {
    fontSize: 14,
    color: '#333',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginTop: 24,
    marginBottom: 10,
  },
  flowRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flowBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#eee',
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
  },
  flowBtnSelected: {
    backgroundColor: '#fde8ef',
    borderColor: '#e75480',
  },
  flowBtnText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  flowBtnTextSelected: {
    color: '#e75480',
    fontWeight: '700',
  },
  symptomsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#222',
    minHeight: 110,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f3f3',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodChipSelected: {
    backgroundColor: '#fde8ef',
    borderColor: '#e75480',
  },
  moodChipText: {
    fontSize: 13,
    color: '#555',
  },
  moodChipTextSelected: {
    color: '#e75480',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  continueBtn: {
    backgroundColor: '#e75480',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#f2b8cc',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
