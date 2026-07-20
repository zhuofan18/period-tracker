import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { getPhaseForDay, PHASES, CYCLE_LENGTH, PERIOD_LENGTH } from '../utils/cycleUtils';

const PHASE_QUESTIONS = {
  period: {
    intro: 'How are you feeling during your period today?',
    sections: [
      { title: 'Flow Intensity', type: 'single', options: ['Spotting', 'Light', 'Medium', 'Heavy', 'Very Heavy'] },
      { title: 'Pain Level',    type: 'single', options: ['None', 'Mild', 'Moderate', 'Severe'] },
      { title: 'Symptoms',     type: 'multi',  options: ['Cramps', 'Bloating', 'Headache', 'Back pain', 'Nausea', 'Fatigue', 'Tender breasts', 'Diarrhoea'] },
      { title: 'Mood',         type: 'multi',  options: ['Emotional 😢', 'Irritable 😤', 'Tired 😴', 'Calm 😌', 'Anxious 😰', 'Low 😞'] },
    ],
  },
  follicular: {
    intro: 'Your body is recharging after your period. Log how you feel.',
    sections: [
      { title: 'Energy Level',    type: 'single', options: ['Very Low', 'Low', 'Medium', 'High', 'Very High'] },
      { title: 'Cervical Mucus', type: 'single', options: ['Dry', 'Sticky', 'Creamy', 'Not sure'] },
      { title: 'Mood',           type: 'multi',  options: ['Happy 😊', 'Motivated 💪', 'Calm 😌', 'Anxious 😰', 'Tired 😴', 'Social 🥳'] },
      { title: 'Exercise Today', type: 'single', options: ['None', 'Light walk', 'Moderate workout', 'Intense workout'] },
    ],
  },
  fertile: {
    intro: "You're in your fertile window. Your body is gearing up for ovulation.",
    sections: [
      { title: 'Cervical Mucus', type: 'single', options: ['Creamy', 'Watery', 'Egg-white', 'Dry', 'Not sure'] },
      { title: 'Libido',        type: 'single', options: ['Low', 'Normal', 'High', 'Very High'] },
      { title: 'Symptoms',      type: 'multi',  options: ['Mild cramping', 'Breast tenderness', 'Bloating', 'Increased energy', 'Heightened senses', 'None'] },
      { title: 'Mood',          type: 'multi',  options: ['Confident 😎', 'Energetic ⚡', 'Romantic 💕', 'Happy 😊', 'Calm 😌', 'Anxious 😰'] },
    ],
  },
  ovulation: {
    intro: "It's your ovulation day! Your body is at peak fertility.",
    sections: [
      { title: 'Ovulation Symptoms', type: 'multi',  options: ['Mittelschmerz (side cramp)', 'Egg-white discharge', 'Breast tenderness', 'Bloating', 'High libido', 'Heightened smell', 'None'] },
      { title: 'Cervical Mucus',     type: 'single', options: ['Egg-white', 'Watery', 'Stretchy', 'Other'] },
      { title: 'Libido',             type: 'single', options: ['Low', 'Normal', 'High', 'Very High'] },
      { title: 'Mood',               type: 'multi',  options: ['Confident 😎', 'Energetic ⚡', 'Romantic 💕', 'Happy 😊', 'Focused 🎯', 'Calm 😌'] },
    ],
  },
  luteal: {
    intro: "You're in the luteal phase. Your body is winding down towards your next period.",
    sections: [
      { title: 'PMS Symptoms',  type: 'multi',  options: ['Bloating', 'Mood swings', 'Food cravings', 'Breast tenderness', 'Fatigue', 'Irritability', 'Headache', 'Acne', 'None'] },
      { title: 'Energy Level',  type: 'single', options: ['Very Low', 'Low', 'Medium', 'High'] },
      { title: 'Sleep Quality', type: 'single', options: ['Poor', 'Fair', 'Good', 'Great'] },
      { title: 'Mood',          type: 'multi',  options: ['Irritable 😤', 'Anxious 😰', 'Sad 😢', 'Tired 😴', 'Calm 😌', 'Okay 🙂', 'Sensitive 🥺'] },
    ],
  },
};

const todayStr = new Date().toISOString().split('T')[0];

export default function DailyLogScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const navigation = useNavigation();
  const route = useRoute();

  const [selectedDate, setSelectedDate]   = useState(route.params?.date || todayStr);
  const [userId, setUserId]               = useState(null);
  const [lastPeriodStart, setLastPeriodStart] = useState(null);
  const [cycleLength, setCycleLength]     = useState(CYCLE_LENGTH);
  const [periodLength, setPeriodLength]   = useState(PERIOD_LENGTH);

  const [answers, setAnswers] = useState({});
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  // Update selected date when navigated from LogHistory
  useEffect(() => {
    if (route.params?.date) setSelectedDate(route.params.date);
  }, [route.params?.date]);

  // One-time init: get user, profile, last period
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('cycle_length, period_length')
        .eq('id', user.id)
        .single();
      if (profile) {
        if (profile.cycle_length)  setCycleLength(profile.cycle_length);
        if (profile.period_length) setPeriodLength(profile.period_length);
      }

      const { data: periods } = await supabase
        .from('periods')
        .select('start_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);
      if (periods && periods.length > 0) setLastPeriodStart(periods[0].start_date);
    };
    init();
  }, []);

  // Reload log whenever the selected date or user changes
  useEffect(() => {
    if (!userId) return;
    const loadLog = async () => {
      setAnswers({});
      setNotes('');
      setSaved(false);
      const { data: log } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', selectedDate)
        .maybeSingle();
      if (log) {
        if (log.phase_answers) setAnswers(log.phase_answers);
        if (log.notes) setNotes(log.notes);
      }
    };
    loadLog();
  }, [selectedDate, userId]);

  const isToday = selectedDate === todayStr;

  const navigateDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().split('T')[0];
    if (next <= todayStr) setSelectedDate(next);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Phase for the selected date (not necessarily today)
  const cycleDay = (() => {
    if (!lastPeriodStart) return null;
    const start = new Date(lastPeriodStart);
    start.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    const diff = Math.floor((sel - start) / (1000 * 60 * 60 * 24));
    if (diff < 0) return null;
    return (diff % cycleLength) + 1;
  })();

  const phaseKey  = cycleDay ? getPhaseForDay(cycleDay, periodLength) : 'follicular';
  const phase     = PHASES[phaseKey];
  const questions = PHASE_QUESTIONS[phaseKey];

  const handleSelect = (title, option, type) => {
    setSaved(false);
    setAnswers((prev) => {
      if (type === 'single') return { ...prev, [title]: option };
      const existing = prev[title] || [];
      const updated  = existing.includes(option)
        ? existing.filter((o) => o !== option)
        : [...existing, option];
      return { ...prev, [title]: updated };
    });
  };

  const isSelected = (title, option, type) =>
    type === 'single' ? answers[title] === option : (answers[title] || []).includes(option);

  const saveLog = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from('daily_logs').upsert({
      user_id:       userId,
      log_date:      selectedDate,
      phase_answers: answers,
      notes,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id,log_date' });
    setSaving(false);
    if (!error) setSaved(true);
  };

  const saveBtnLabel = saved ? 'Saved ✓' : saving ? 'Saving...' : isToday ? "Save Today's Log" : 'Update Log';

  return (
    <View style={s.screen}>
      <View style={[s.header, { backgroundColor: phase.color }]}>
        {/* Top row: title + history + chat button */}
        <View style={s.headerTopRow}>
          <Text style={s.headerTitle}>Daily Log</Text>
          <View style={s.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('LogHistory')}
              style={s.historyBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={s.historyBtnText}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat')}
              style={s.chatBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={s.chatBtnText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date navigation */}
        <View style={s.dateNav}>
          <TouchableOpacity onPress={() => navigateDay(-1)} style={s.dateArrow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.dateArrowText}>‹</Text>
          </TouchableOpacity>
          <View style={s.dateCenter}>
            <Text style={s.dateText}>{formattedDate}</Text>
            {isToday && <View style={s.todayBadge}><Text style={s.todayBadgeText}>Today</Text></View>}
          </View>
          <TouchableOpacity
            onPress={() => navigateDay(1)}
            style={s.dateArrow}
            disabled={isToday}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[s.dateArrowText, isToday && s.dateArrowDisabled]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Phase badge */}
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
                  <TouchableOpacity
                    key={option}
                    style={[s.optionBtn, active && s.optionBtnSelected]}
                    onPress={() => handleSelect(section.title, option, section.type)}
                    activeOpacity={0.8}
                  >
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
          <TextInput
            style={s.notesInput}
            placeholder="Any other symptoms or thoughts..."
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={5}
            value={notes}
            onChangeText={(v) => { setNotes(v); setSaved(false); }}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: saved ? '#4CAF50' : phase.color }]}
          onPress={saveLog}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>{saveBtnLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen:      { flex: 1, backgroundColor: theme.surface },
  header:      { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: 16 },
  headerTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyBtn:    { padding: 4 },
  historyBtnText:{ fontSize: 20 },
  chatBtn:       { padding: 4 },
  chatBtnText:   { color: 'rgba(255,255,255,0.9)', fontSize: 26, letterSpacing: 2, fontWeight: '300' },

  dateNav:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateArrow:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dateArrowText:   { color: '#fff', fontSize: 26, fontWeight: '300' },
  dateArrowDisabled: { opacity: 0.3 },
  dateCenter:      { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dateText:        { color: '#fff', fontSize: 13, fontWeight: '600' },
  todayBadge:      { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  todayBadgeText:  { color: '#fff', fontSize: 11, fontWeight: '600' },

  phaseBadge:     { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)' },
  phaseBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  content:    { padding: 16, gap: 16, paddingBottom: 32 },
  intro:      { fontSize: 15, color: theme.subtext, lineHeight: 22 },
  card: {
    backgroundColor: theme.card, borderRadius: 16, padding: 16,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } }),
  },
  cardTitle:        { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  cardSub:          { fontSize: 12, color: theme.muted, marginBottom: 12 },
  optionsList:      { gap: 8, marginTop: 8 },
  optionBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.optionBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 2, borderColor: 'transparent' },
  optionBtnSelected: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  optionText:        { fontSize: 14, color: theme.text, flex: 1 },
  optionTextSelected: { color: theme.primary, fontWeight: '600' },
  checkBox:          { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  checkBoxSelected:  { backgroundColor: theme.primary, borderColor: theme.primary },
  checkMark:         { color: '#fff', fontSize: 12, fontWeight: '700' },
  notesInput:        { borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12, fontSize: 14, color: theme.text, minHeight: 120, marginTop: 8, backgroundColor: theme.inputBg },
  saveBtn:    { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
