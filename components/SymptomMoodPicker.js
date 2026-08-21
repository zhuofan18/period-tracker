import { useState, useEffect, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontFamily } from '../theme/typography';

// ─── Data ─────────────────────────────────────────────────────────────────────

export const SYMPTOM_CATEGORIES = [
  {
    category: 'Head',
    items: [
      { label: 'Headache',   emoji: '🤕' },
      { label: 'Migraine',   emoji: '😖' },
      { label: 'Dizziness',  emoji: '😵' },
      { label: 'Acne',       emoji: '🧴' },
      { label: 'Fever',      emoji: '🥵' },
    ],
  },
  {
    category: 'Body',
    items: [
      { label: 'Cramps',         emoji: '😣' },
      { label: 'Bloating',       emoji: '🫃' },
      { label: 'Backache',       emoji: '💢' },
      { label: 'Muscle pain',    emoji: '💪' },
      { label: 'Neck aches',     emoji: '🦒' },
      { label: 'Tender breasts', emoji: '🩹' },
      { label: 'Fatigue',        emoji: '😴' },
      { label: 'Chills',         emoji: '🥶' },
      { label: 'Nausea',         emoji: '🤢' },
      { label: 'Rashes',         emoji: '🔴' },
      { label: 'Night sweats',   emoji: '💦' },
      { label: 'Hot flashes',    emoji: '🔥' },
      { label: 'Weight gain',    emoji: '⚖️' },
      { label: 'Influenza',      emoji: '🤧' },
      { label: 'Itchiness',      emoji: '🦟' },
    ],
  },
  {
    category: 'Cervix',
    items: [
      { label: 'Pelvic pain',       emoji: '😰' },
      { label: 'Cervical firmness', emoji: '💎' },
      { label: 'Cervical opening',  emoji: '🔓' },
      { label: 'Cervical mucus',    emoji: '💧' },
      { label: 'Flow',              emoji: '🩸' },
      { label: 'Spotting',          emoji: '🩺' },
      { label: 'Irritation',        emoji: '😤' },
    ],
  },
  {
    category: 'Abdomen',
    items: [
      { label: 'Constipation',   emoji: '😩' },
      { label: 'Diarrhea',       emoji: '🚽' },
      { label: 'Gas',            emoji: '💨' },
      { label: 'Hunger',         emoji: '🍽️' },
      { label: 'Cravings',       emoji: '🍫' },
      { label: 'Ovulation pain', emoji: '⚡' },
    ],
  },
  {
    category: 'Mental',
    items: [
      { label: 'Anxiety',       emoji: '😰' },
      { label: 'Insomnia',      emoji: '🌙' },
      { label: 'Stress',        emoji: '😤' },
      { label: 'Moodiness',     emoji: '🎭' },
      { label: 'Tension',       emoji: '😬' },
      { label: 'Irritability',  emoji: '😡' },
      { label: 'Brain fog',     emoji: '🌫️' },
      { label: 'Confusion',     emoji: '😕' },
      { label: 'Food cravings', emoji: '🍰' },
      { label: 'Mood swings',   emoji: '🌊' },
    ],
  },
];

export const MOODS = [
  { label: 'Happy',       emoji: '😊' },
  { label: 'Sad',         emoji: '😢' },
  { label: 'Anxious',     emoji: '😰' },
  { label: 'Calm',        emoji: '😌' },
  { label: 'Irritable',   emoji: '😤' },
  { label: 'Excited',     emoji: '🤩' },
  { label: 'Tired',       emoji: '😴' },
  { label: 'Stressed',    emoji: '😫' },
  { label: 'Emotional',   emoji: '😭' },
  { label: 'Confident',   emoji: '😎' },
  { label: 'Motivated',   emoji: '💪' },
  { label: 'Social',      emoji: '🥳' },
  { label: 'Low',         emoji: '😞' },
  { label: 'Hopeful',     emoji: '🌟' },
  { label: 'Grateful',    emoji: '🙏' },
  { label: 'Lonely',      emoji: '🥺' },
  { label: 'Frustrated',  emoji: '😡' },
  { label: 'Peaceful',    emoji: '🕊️' },
  { label: 'Energetic',   emoji: '⚡' },
  { label: 'Sluggish',    emoji: '🐌' },
  { label: 'Romantic',    emoji: '❤️' },
  { label: 'Confused',    emoji: '😕' },
  { label: 'Overwhelmed', emoji: '🌊' },
  { label: 'Depressed',   emoji: '😔' },
  { label: 'Playful',     emoji: '🎉' },
  { label: 'Proud',       emoji: '🦁' },
  { label: 'Relaxed',     emoji: '🧘' },
  { label: 'Worried',     emoji: '😟' },
  { label: 'Inspired',    emoji: '✨' },
  { label: 'Grumpy',      emoji: '😠' },
  { label: 'In love',     emoji: '🥰' },
  { label: 'Bored',       emoji: '😑' },
  { label: 'Sensitive',   emoji: '🫣' },
  { label: 'Okay',        emoji: '🙂' },
];

// Quick emoji lookup maps
export const SYMPTOM_EMOJI_MAP = {};
SYMPTOM_CATEGORIES.forEach(cat =>
  cat.items.forEach(item => { SYMPTOM_EMOJI_MAP[item.label] = item.emoji; })
);

export const MOOD_EMOJI_MAP = {};
MOODS.forEach(m => { MOOD_EMOJI_MAP[m.label] = m.emoji; });

// ─── Picker Modal ─────────────────────────────────────────────────────────────

export default function SymptomMoodPicker({ visible, onClose, onSave, selected = [], mode = 'symptom' }) {
  const { theme } = useTheme();
  const s = styles(theme);
  const [search, setSearch]             = useState('');
  const [localSelected, setLocalSelected] = useState(selected);

  useEffect(() => {
    if (visible) {
      setLocalSelected(selected);
      setSearch('');
    }
  }, [visible]);

  const toggle = (label) => {
    setLocalSelected(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleSave = () => {
    onSave(localSelected);
    onClose();
  };

  const handleClose = () => {
    setLocalSelected(selected);
    onClose();
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return SYMPTOM_CATEGORIES;
    const q = search.toLowerCase();
    return SYMPTOM_CATEGORIES
      .map(cat => ({ ...cat, items: cat.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(cat => cat.items.length > 0);
  }, [search]);

  const filteredMoods = useMemo(() => {
    if (!search.trim()) return MOODS;
    const q = search.toLowerCase();
    return MOODS.filter(m => m.label.toLowerCase().includes(q));
  }, [search]);

  const renderItem = (item) => {
    const active = localSelected.includes(item.label);
    return (
      <TouchableOpacity
        key={item.label}
        style={[s.item, active && s.itemActive]}
        onPress={() => toggle(item.label)}
        activeOpacity={0.75}
      >
        {active && (
          <View style={s.checkBadge}>
            <Text style={s.checkText}>✓</Text>
          </View>
        )}
        <Text style={s.itemEmoji}>{item.emoji}</Text>
        <Text style={[s.itemLabel, active && s.itemLabelActive]} numberOfLines={2}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      {...(Platform.OS === 'ios' ? { presentationStyle: 'pageSheet' } : {})}
      onRequestClose={handleClose}
    >
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.title}>{mode === 'mood' ? '😊  Add Mood' : '🩹  Add Symptoms'}</Text>
          <TouchableOpacity onPress={handleSave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder={mode === 'mood' ? 'Search moods...' : 'Search symptoms...'}
            placeholderTextColor={theme.muted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selection count + clear */}
        {localSelected.length > 0 && (
          <View style={s.selectionRow}>
            <Text style={s.selectionCount}>{localSelected.length} selected</Text>
            <TouchableOpacity onPress={() => setLocalSelected([])}>
              <Text style={s.clearAll}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {mode === 'mood' ? (
            <>
              {filteredMoods.length === 0 && (
                <Text style={s.noResults}>No moods found for "{search}"</Text>
              )}
              <View style={s.grid}>{filteredMoods.map(renderItem)}</View>
            </>
          ) : (
            <>
              {filteredCategories.length === 0 && (
                <Text style={s.noResults}>No symptoms found for "{search}"</Text>
              )}
              {filteredCategories.map(cat => (
                <View key={cat.category}>
                  <Text style={s.categoryTitle}>{cat.category}</Text>
                  <View style={s.grid}>{cat.items.map(renderItem)}</View>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={s.saveBtnText}>
              Save{localSelected.length > 0 ? ` (${localSelected.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const PINK = '#e75480';

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: theme.card,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  title:      { fontSize: 16, fontFamily: fontFamily.bold, color: theme.text },
  cancelText: { fontSize: 15, color: theme.muted, minWidth: 60 },
  doneText:   { fontSize: 15, color: PINK, fontFamily: fontFamily.bold, minWidth: 60, textAlign: 'right' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.card, margin: 12, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'web' ? 10 : 10,
    borderWidth: 1, borderColor: theme.border,
  },
  searchIcon:  { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: theme.text, ...Platform.select({ web: { outline: 'none' }, default: {} }) },
  clearText:   { fontSize: 13, color: theme.muted },

  selectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 4,
  },
  selectionCount: { fontSize: 13, color: theme.muted },
  clearAll:       { fontSize: 13, color: PINK, fontFamily: fontFamily.semibold },

  scrollContent: { padding: 12, paddingBottom: 110 },
  categoryTitle: {
    fontSize: 13, fontFamily: fontFamily.bold, color: theme.subtext,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: 14, marginBottom: 10, marginLeft: 2,
  },
  noResults: { textAlign: 'center', color: theme.muted, marginTop: 48, fontSize: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  item: {
    width: 78, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4,
    borderRadius: 14, backgroundColor: theme.card,
    borderWidth: 1.5, borderColor: theme.border, position: 'relative',
  },
  itemActive:      { borderColor: PINK, backgroundColor: PINK + '14' },
  checkBadge: {
    position: 'absolute', top: 5, right: 5,
    width: 15, height: 15, borderRadius: 8,
    backgroundColor: PINK, alignItems: 'center', justifyContent: 'center',
  },
  checkText:       { color: '#fff', fontSize: 8, fontFamily: fontFamily.extrabold },
  itemEmoji:       { fontSize: 26, marginBottom: 5 },
  itemLabel:       { fontSize: 10, color: theme.subtext, textAlign: 'center', lineHeight: 13 },
  itemLabelActive: { color: PINK, fontFamily: fontFamily.semibold },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: theme.surface,
    borderTopWidth: 1, borderTopColor: theme.border,
  },
  saveBtn:     { backgroundColor: PINK, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: fontFamily.bold },
});
