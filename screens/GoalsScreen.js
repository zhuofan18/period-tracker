import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BloomButton from '../components/BloomButton';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { shadow } from '../theme/spacing';
import { fontFamily } from '../theme/typography';

const GOALS = [
  { id: 'period',        label: 'Track my period',           emoji: '📅', tip: 'Log your period start and end dates to build accurate cycle predictions.' },
  { id: 'wellbeing',     label: 'Take charge of my wellbeing', emoji: '⚡', tip: 'Use daily logs to spot patterns between your symptoms, mood, and cycle phase.' },
  { id: 'pregnant',      label: 'Get pregnant',              emoji: '🧪', tip: 'Your fertile window is days 10–17. Luna can answer fertility questions anytime.' },
  { id: 'weight',        label: 'Manage my weight',          emoji: '⚖️', tip: 'Hormones affect appetite and energy throughout your cycle — logging helps you see trends.' },
  { id: 'contraception', label: 'Explore contraception',     emoji: '💊', tip: 'Luna can walk you through different contraception options and how they affect your cycle.' },
  { id: 'sex',           label: 'Enhance my sex life',       emoji: '💕', tip: 'Understanding your cycle phases can help you tune into your natural rhythms and libido shifts.' },
  { id: 'discharge',     label: 'Decode my discharge',       emoji: '💧', tip: 'Cervical mucus changes throughout your cycle — track it in daily logs to spot patterns.' },
  { id: 'pregnancy',     label: 'Track my pregnancy',        emoji: '🤰', tip: 'Luna can support you with general information about pregnancy and prenatal health.' },
];

export default function GoalsScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const navigation = useNavigation();
  const route = useRoute();

  const fromOnboarding = route.params?.fromOnboarding !== false && !route.params?.fromProfile;

  const [selected, setSelected]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('user_goals')
        .select('goals')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.goals) {
        // goals stored as labels — map back to ids
        const savedIds = GOALS.filter(g => data.goals.includes(g.label)).map(g => g.id);
        setSelected(savedIds);
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggle = (id) => {
    setSaved(false);
    setSelected((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const goalLabels = GOALS.filter(g => selected.includes(g.id)).map(g => g.label);
      await supabase.from('user_goals').upsert({ user_id: user.id, goals: goalLabels });
    }
    setSaving(false);
    if (fromOnboarding) {
      navigation.navigate('GeneralInfo');
    } else {
      setSaved(true);
    }
  };

  const activeGoals = GOALS.filter(g => selected.includes(g.id));

  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        {!fromOnboarding && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <View style={s.headerText}>
          <Text style={s.headerTitle}>{fromOnboarding ? 'What are your goals?' : 'My Goals'}</Text>
          <Text style={s.headerSub}>Choose as many as you like — you can change these any time.</Text>
        </View>
        {!fromOnboarding && (
          <BloomButton onPress={() => navigation.navigate('Chat')} />
        )}
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Active goal tips — shown only in-app when goals are selected */}
        {!fromOnboarding && activeGoals.length > 0 && (
          <View style={s.tipsSection}>
            <Text style={s.tipsSectionTitle}>Your goal tips</Text>
            {activeGoals.map(g => (
              <View key={g.id} style={s.tipCard}>
                <Text style={s.tipEmoji}>{g.emoji}</Text>
                <View style={s.tipContent}>
                  <Text style={s.tipLabel}>{g.label}</Text>
                  <Text style={s.tipText}>{g.tip}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Goal grid */}
        <Text style={s.gridTitle}>{fromOnboarding || activeGoals.length === 0 ? 'Select your goals' : 'All goals'}</Text>
        <View style={s.grid}>
          {GOALS.map((goal) => {
            const isSelected = selected.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[s.card, isSelected && s.cardSelected]}
                onPress={() => toggle(goal.id)}
                activeOpacity={0.8}
              >
                <View style={[s.iconCircle, isSelected && s.iconCircleSelected]}>
                  <Text style={s.emoji}>{goal.emoji}</Text>
                </View>
                <Text style={[s.cardLabel, isSelected && s.cardLabelSelected]}>{goal.label}</Text>
                {isSelected && <View style={s.checkBadge}><Text style={s.checkMark}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, (selected.length === 0 || saving) && s.saveBtnDisabled]}
          disabled={selected.length === 0 || saving}
          onPress={save}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>
            {saving ? 'Saving...' : saved ? 'Saved ✓' : fromOnboarding ? 'Next' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn:    { padding: 2 },
  backArrow:  { fontSize: 22, color: theme.text },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: fontFamily.bold, color: theme.text },
  headerSub:   { fontSize: 12, color: theme.muted, marginTop: 2 },

  content: { padding: 16, paddingBottom: 32, gap: 16 },

  tipsSection:      { gap: 10 },
  tipsSectionTitle: { fontSize: 14, fontFamily: fontFamily.bold, color: theme.text },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: theme.card, borderRadius: 14, padding: 14,
    borderLeftWidth: 3, borderLeftColor: theme.primary,
    ...Platform.select(shadow),
  },
  tipEmoji:   { fontSize: 22, marginTop: 1 },
  tipContent: { flex: 1 },
  tipLabel:   { fontSize: 13, fontFamily: fontFamily.bold, color: theme.text, marginBottom: 2 },
  tipText:    { fontSize: 12, color: theme.muted, lineHeight: 18 },

  gridTitle: { fontSize: 14, fontFamily: fontFamily.bold, color: theme.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%', backgroundColor: theme.card, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    ...Platform.select(shadow),
  },
  cardSelected:      { borderColor: theme.primary },
  iconCircle:        { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.optionBg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconCircleSelected:{ backgroundColor: theme.primaryLight },
  emoji:             { fontSize: 28 },
  cardLabel:         { fontSize: 12, color: theme.text, textAlign: 'center', fontFamily: fontFamily.medium, lineHeight: 17 },
  cardLabelSelected: { color: theme.primary, fontFamily: fontFamily.bold },
  checkBadge:        { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  checkMark:         { color: '#fff', fontSize: 10, fontFamily: fontFamily.bold },

  footer:  { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#f2b8cc' },
  saveBtnText:     { color: '#fff', fontSize: 16, fontFamily: fontFamily.bold },
});
