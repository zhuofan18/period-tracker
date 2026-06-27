import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

const GOALS = [
  { id: 1, label: 'Get pregnant', emoji: '🧪' },
  { id: 2, label: 'Track my pregnancy', emoji: '🤰' },
  { id: 3, label: 'Track my period', emoji: '📅' },
  { id: 4, label: 'Take charge of my well-being', emoji: '⚡' },
  { id: 5, label: 'Manage my weight', emoji: '⚖️' },
  { id: 6, label: 'Enhance my sex life', emoji: '💕' },
  { id: 7, label: 'Decode my discharge', emoji: '💧' },
  { id: 8, label: 'Explore contraception', emoji: '💊' },
];

export default function GoalsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>What are your goals?</Text>
        <Text style={styles.subtitle}>Choose as many as you'd like.</Text>

        <View style={styles.grid}>
          {GOALS.map((goal) => {
            const isSelected = selected.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => toggle(goal.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                  <Text style={styles.emoji}>{goal.emoji}</Text>
                </View>
                <Text style={styles.cardLabel}>{goal.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, selected.length === 0 && styles.nextBtnDisabled]}
          disabled={selected.length === 0}
          onPress={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const goalLabels = GOALS.filter(g => selected.includes(g.id)).map(g => g.label);
              await supabase.from('user_goals').upsert({ user_id: user.id, goals: goalLabels });
            }
            navigation.navigate('GeneralInfo');
          }}
        >
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  header: { fontSize: 26, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.muted, textAlign: 'center', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', backgroundColor: theme.card, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 } }),
  },
  cardSelected: { borderWidth: 2, borderColor: theme.primary },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.optionBg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconCircleSelected: { backgroundColor: theme.primaryLight },
  emoji: { fontSize: 32 },
  cardLabel: { fontSize: 13, color: theme.text, textAlign: 'center', fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: theme.background },
  nextBtn: { backgroundColor: theme.primary, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#f2b8cc' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
