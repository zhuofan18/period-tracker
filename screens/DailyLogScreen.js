import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { getCycleDay, getPhaseForDay, PHASES } from '../utils/cycleUtils';

const LAST_PERIOD_START = '2026-06-16';

// Dynamic questions per phase
const PHASE_QUESTIONS = {
  period: {
    intro: 'How are you feeling during your period today?',
    sections: [
      {
        title: 'Flow Intensity',
        type: 'single',
        options: ['Spotting', 'Light', 'Medium', 'Heavy', 'Very Heavy'],
      },
      {
        title: 'Pain Level',
        type: 'single',
        options: ['None', 'Mild', 'Moderate', 'Severe'],
      },
      {
        title: 'Symptoms',
        type: 'multi',
        options: ['Cramps', 'Bloating', 'Headache', 'Back pain', 'Nausea', 'Fatigue', 'Tender breasts', 'Diarrhoea'],
      },
      {
        title: 'Mood',
        type: 'multi',
        options: ['Emotional 😢', 'Irritable 😤', 'Tired 😴', 'Calm 😌', 'Anxious 😰', 'Low 😞'],
      },
    ],
  },
  follicular: {
    intro: 'Your body is recharging after your period. Log how you feel.',
    sections: [
      {
        title: 'Energy Level',
        type: 'single',
        options: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      },
      {
        title: 'Cervical Mucus',
        type: 'single',
        options: ['Dry', 'Sticky', 'Creamy', 'Not sure'],
      },
      {
        title: 'Mood',
        type: 'multi',
        options: ['Happy 😊', 'Motivated 💪', 'Calm 😌', 'Anxious 😰', 'Tired 😴', 'Social 🥳'],
      },
      {
        title: 'Exercise Today',
        type: 'single',
        options: ['None', 'Light walk', 'Moderate workout', 'Intense workout'],
      },
    ],
  },
  fertile: {
    intro: 'You\'re in your fertile window. Your body is gearing up for ovulation.',
    sections: [
      {
        title: 'Cervical Mucus',
        type: 'single',
        options: ['Creamy', 'Watery', 'Egg-white', 'Dry', 'Not sure'],
      },
      {
        title: 'Libido',
        type: 'single',
        options: ['Low', 'Normal', 'High', 'Very High'],
      },
      {
        title: 'Symptoms',
        type: 'multi',
        options: ['Mild cramping', 'Breast tenderness', 'Bloating', 'Increased energy', 'Heightened senses', 'None'],
      },
      {
        title: 'Mood',
        type: 'multi',
        options: ['Confident 😎', 'Energetic ⚡', 'Romantic 💕', 'Happy 😊', 'Calm 😌', 'Anxious 😰'],
      },
    ],
  },
  ovulation: {
    intro: 'It\'s your ovulation day! Your body is at peak fertility.',
    sections: [
      {
        title: 'Ovulation Symptoms',
        type: 'multi',
        options: ['Mittelschmerz (side cramp)', 'Egg-white discharge', 'Breast tenderness', 'Bloating', 'High libido', 'Heightened smell', 'None'],
      },
      {
        title: 'Cervical Mucus',
        type: 'single',
        options: ['Egg-white', 'Watery', 'Stretchy', 'Other'],
      },
      {
        title: 'Libido',
        type: 'single',
        options: ['Low', 'Normal', 'High', 'Very High'],
      },
      {
        title: 'Mood',
        type: 'multi',
        options: ['Confident 😎', 'Energetic ⚡', 'Romantic 💕', 'Happy 😊', 'Focused 🎯', 'Calm 😌'],
      },
    ],
  },
  luteal: {
    intro: 'You\'re in the luteal phase. Your body is winding down towards your next period.',
    sections: [
      {
        title: 'PMS Symptoms',
        type: 'multi',
        options: ['Bloating', 'Mood swings', 'Food cravings', 'Breast tenderness', 'Fatigue', 'Irritability', 'Headache', 'Acne', 'None'],
      },
      {
        title: 'Energy Level',
        type: 'single',
        options: ['Very Low', 'Low', 'Medium', 'High'],
      },
      {
        title: 'Sleep Quality',
        type: 'single',
        options: ['Poor', 'Fair', 'Good', 'Great'],
      },
      {
        title: 'Mood',
        type: 'multi',
        options: ['Irritable 😤', 'Anxious 😰', 'Sad 😢', 'Tired 😴', 'Calm 😌', 'Okay 🙂', 'Sensitive 🥺'],
      },
    ],
  },
};

function OptionButton({ label, selected, onPress, type }) {
  return (
    <TouchableOpacity
      style={[styles.optionBtn, selected && styles.optionBtnSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.optionBtnText, selected && styles.optionBtnTextSelected]}>
        {label}
      </Text>
      {type === 'multi' && (
        <View style={[styles.checkBox, selected && styles.checkBoxSelected]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DailyLogScreen() {
  const cycleDay   = getCycleDay(LAST_PERIOD_START);
  const phaseKey   = getPhaseForDay(cycleDay);
  const phase      = PHASES[phaseKey];
  const questions  = PHASE_QUESTIONS[phaseKey];
  const today      = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const [answers, setAnswers] = useState({});
  const [notes, setNotes]     = useState('');

  const handleSelect = (sectionTitle, option, type) => {
    setAnswers((prev) => {
      if (type === 'single') {
        return { ...prev, [sectionTitle]: option };
      }
      const existing = prev[sectionTitle] || [];
      const updated  = existing.includes(option)
        ? existing.filter((o) => o !== option)
        : [...existing, option];
      return { ...prev, [sectionTitle]: updated };
    });
  };

  const isSelected = (sectionTitle, option, type) => {
    if (type === 'single') return answers[sectionTitle] === option;
    return (answers[sectionTitle] || []).includes(option);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: phase.color }]}>
        <Text style={styles.headerDate}>{today}</Text>
        <Text style={styles.headerTitle}>Daily Log</Text>
        <View style={[styles.phaseBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={styles.phaseBadgeText}>Day {cycleDay} · {phase.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Intro */}
        <Text style={styles.intro}>{questions.intro}</Text>

        {/* Dynamic sections */}
        {questions.sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.type === 'multi' && (
              <Text style={styles.sectionSub}>Select all that apply</Text>
            )}
            <View style={styles.optionsList}>
              {section.options.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  type={section.type}
                  selected={isSelected(section.title, option, section.type)}
                  onPress={() => handleSelect(section.title, option, section.type)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Personal notes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Notes</Text>
          <Text style={styles.sectionSub}>Describe how you feel in your own words</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How are you feeling today? Any other symptoms or thoughts..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={5}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Save button */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: phase.color }]}>
          <Text style={styles.saveBtnText}>Save Today's Log</Text>
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
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 20,
  },
  headerDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  phaseBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  intro: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
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
    color: '#aaa',
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
    marginTop: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionBtnSelected: {
    backgroundColor: '#fde8ef',
    borderColor: '#e75480',
  },
  optionBtnText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  optionBtnTextSelected: {
    color: '#e75480',
    fontWeight: '600',
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxSelected: {
    backgroundColor: '#e75480',
    borderColor: '#e75480',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#222',
    minHeight: 120,
    marginTop: 8,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
