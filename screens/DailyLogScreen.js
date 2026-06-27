import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { getCycleDay, getPhaseForDay, PHASES } from '../utils/cycleUtils';

const PHASE_QUESTIONS = {
  period: {
    intro: 'How are you feeling during your period today?',
    sections: [
      { title: 'Flow Intensity', type: 'single', options: ['Spotting', 'Light', 'Medium', 'Heavy', 'Very Heavy'] },
      { title: 'Pain Level', type: 'single', options: ['None', 'Mild', 'Moderate', 'Severe'] },
      { title: 'Symptoms', type: 'multi', options: ['Cramps', 'Bloating', 'Headache', 'Back pain', 'Nausea', 'Fatigue', 'Tender breasts', 'Diarrhoea'] },
      { title: 'Mood', type: 'multi', options: ['Emotional 😢', 'Irritable 😤', 'Tired 😴', 'Calm 😌', 'Anxious 😰', 'Low 😞'] },
    ],
  },
  follicular: {
    intro: 'Your body is recharging after your period. Log how you feel.',
    sections: [
      { title: 'Energy Level', type: 'single', options: ['Very Low', 'Low', 'Medium', 'High', 'Very High'] },
      { title: 'Cervical Mucus', type: 'single', options: ['Dry', 'Sticky', 'Creamy', 'Not sure'] },
      { title: 'Mood', type: 'multi', options: ['Happy 😊', 'Motivated 💪', 'Calm 😌', 'Anxious 😰', 'Tired 😴', 'Social 🥳'] },
      { title: 'Exercise Today', type: 'single', options: ['None', 'Light walk', 'Moderate workout', 'Intense workout'] },
    ],
  },
  fertile: {
    intro: "You're in your fertile window. Your body is gearing up for ovulation.",
    sections: [
      { title: 'Cervical Mucus', type: 'single', options: ['Creamy', 'Watery', 'Egg-white', 'Dry', 'Not sure'] },
      { title: 'Libido', type: 'single', options: ['Low', 'Normal', 'High', 'Very High'] },
      { title: 'Symptoms', type: 'multi', options: ['Mild cramping', 'Breast tenderness', 'Bloating', 'Increased energy', 'Heightened senses', 'None'] },
      { title: 'Mood', type: 'multi', options: ['Confident 😎', 'Energetic ⚡', 'Romantic 💕', 'Happy 😊', 'Calm 😌', 'Anxious 😰'] },
    ],
  },
  ovulation: {
    intro: "It's your ovulation day! Your body is at peak fertility.",
    sections: [
      { title: 'Ovulation Symptoms', type: 'multi', options: ['Mittelschmerz (side cramp)', 'Egg-white discharge', 'Breast tenderness', 'Bloating', 'High libido', 'Heightened smell', 'None'] },
      { title: 'Cervical Mucus', type: 'single', options: ['Egg-white', 'Watery', 'Stretchy', 'Other'] },
      { title: 'Libido', type: 'single', options: ['Low', 'Normal', 'High', 'Very High'] },
      { title: 'Mood', type: 'multi', options: ['Confident 😎', 'Energetic ⚡', 'Romantic 💕', 'Happy 😊', 'Focused 🎯', 'Calm 😌'] },
    ],
  },
  luteal: {
    intro: "You're in the luteal phase. Your body is winding down towards your next period.",
    sections: [
      { title: 'PMS Symptoms', type: 'multi', options: ['Bloating', 'Mood swings', 'Food cravings', 'Breast tenderness', 'Fatigue', 'Irritability', 'Headache', 'Acne', 'None'] },
      { title: 'Energy Level', type: 'single', options: ['Very Low', 'Low', 'Medium', 'High'] },
      { title: 'Sleep Quality', type: 'single', options: ['Poor', 'Fair', 'Good', 'Great'] },
      { title: 'Mood', type: 'multi', options: ['Irritable 😤', 'Anxious 😰', 'Sad 😢', 'Tired 😴', 'Calm 😌', 'Okay 🙂', 'Sensitive 🥺'] },
    ],
  },
};

export default function DailyLogScreen() {
  const { theme } = useTheme();
  const s = styles(theme);

  const [lastPeriodStart, setLastPeriodStart] = useState(null);

  const today    = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const cycleDay = lastPeriodStart ? getCycleDay(lastPeriodStart) : null;
  const phaseKey = cycleDay ? getPhaseForDay(cycleDay) : 'follicular';
  const phase    = PHASES[phaseKey];
  const questions = PHASE_QUESTIONS[phaseKey];

  const [answers, setAnswers] = useState({});
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: periods } = await supabase
        .from('periods')
        .select('start_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);
      if (periods && periods.length > 0) setLastPeriodStart(periods[0].start_date);
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: log } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', todayStr).single();
      if (log) {
        if (log.phase_answers) setAnswers(log.phase_answers);
        if (log.notes) setNotes(log.notes);
      }
    };
    load();
  }, []);

  const handleSelect = (title, option, type) => {
    setAnswers((prev) => {
      if (type === 'single') return { ...prev, [title]: option };
      const existing = prev[title] || [];
      const updated  = existing.includes(option) ? existing.filter((o) => o !== option) : [...existing, option];
      return { ...prev, [title]: updated };
    });
  };

  const isSelected = (title, option, type) =>
    type === 'single' ? answers[title] === option : (answers[title] || []).includes(option);

  return (
    <View style={s.screen}>
      <View style={[s.header, { backgroundColor: phase.color }]}>
        <Text style={s.headerDate}>{today}</Text>
        <Text style={s.headerTitle}>Daily Log</Text>
        <View style={s.phaseBadge}>
          <Text style={s.phaseBadgeText}>{cycleDay ? `Day ${cycleDay} · ` : ''}{phase.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.intro}>{questions.intro}</Text>

        {questions.sections.map((section) => (
          <View key={section.title} style={s.card}>
            <Text style={s.cardTitle}>{section.title}</Text>
            {section.type === 'multi' && <Text style={s.cardSub}>Select all that apply</Text>}
            <View style={s.optionsList}>
              {section.options.map((option) => {
                const active = isSelected(section.title, option, section.type);
                return (
                  <TouchableOpacity key={option} style={[s.optionBtn, active && s.optionBtnSelected]} onPress={() => handleSelect(section.title, option, section.type)} activeOpacity={0.8}>
                    <Text style={[s.optionText, active && s.optionTextSelected]}>{option}</Text>
                    {section.type === 'multi' && (
                      <View style={[s.checkBox, active && s.checkBoxSelected]}>
                        {active && <Text style={s.checkMark}>✓</Text>}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={s.card}>
          <Text style={s.cardTitle}>Personal Notes</Text>
          <Text style={s.cardSub}>Describe how you feel in your own words</Text>
          <TextInput style={s.notesInput} placeholder="How are you feeling today? Any other symptoms or thoughts..." placeholderTextColor={theme.placeholder} multiline numberOfLines={5} value={notes} onChangeText={setNotes} textAlignVertical="top" />
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: saved ? '#4CAF50' : phase.color }]}
          onPress={async () => {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const todayStr = new Date().toISOString().split('T')[0];
              await supabase.from('daily_logs').upsert({
                user_id:       user.id,
                log_date:      todayStr,
                phase_answers: answers,
                notes,
                updated_at:    new Date().toISOString(),
              }, { onConflict: 'user_id,log_date' });
              setSaved(true);
            }
            setSaving(false);
          }}
        >
          <Text style={s.saveBtnText}>{saved ? 'Saved ✓' : saving ? 'Saving...' : "Save Today's Log"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: 20 },
  headerDate: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10 },
  phaseBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)' },
  phaseBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  intro: { fontSize: 15, color: theme.subtext, lineHeight: 22 },
  card: {
    backgroundColor: theme.card, borderRadius: 16, padding: 16,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } }),
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: theme.muted, marginBottom: 12 },
  optionsList: { gap: 8, marginTop: 8 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.optionBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 2, borderColor: 'transparent' },
  optionBtnSelected: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  optionText: { fontSize: 14, color: theme.text, flex: 1 },
  optionTextSelected: { color: theme.primary, fontWeight: '600' },
  checkBox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  checkBoxSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  notesInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12, fontSize: 14, color: theme.text, minHeight: 120, marginTop: 8, backgroundColor: theme.inputBg },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
