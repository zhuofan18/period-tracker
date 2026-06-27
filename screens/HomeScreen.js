import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { getCycleDay, getPhaseForDay, getDaysUntilNextPeriod, getNextPeriodDate, PHASES, CYCLE_LENGTH } from '../utils/cycleUtils';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getPhaseDescription(key) {
  return {
    period:     'Your period has started. Focus on rest and self-care. Stay hydrated and manage cramps with heat or light movement.',
    follicular: 'Your body is preparing for ovulation. Energy levels are rising — a great time to be active and social.',
    fertile:    'You are in your fertile window. Chances of conception are higher. Cervical mucus may become clear and stretchy.',
    ovulation:  'Ovulation day! Your egg is being released. You may feel a slight twinge or increased energy and libido.',
    luteal:     'Post-ovulation phase. Progesterone rises. You may experience PMS symptoms as your body prepares for the next cycle.',
  }[key] ?? '';
}

const today = new Date().toISOString().split('T')[0];

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  const [lastPeriodStart, setLastPeriodStart] = useState('2026-06-16');
  const [modalVisible, setModalVisible]       = useState(false);
  const [pickedDate, setPickedDate]           = useState(null);
  const [displayName, setDisplayName]         = useState('');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('profiles').select('first_name, username').eq('id', user.id).single();
        if (profile) setDisplayName(profile.first_name || profile.username || '');
        const { data: periods } = await supabase
          .from('periods')
          .select('start_date')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false })
          .limit(1);
        if (periods && periods.length > 0) setLastPeriodStart(periods[0].start_date);
      };
      load();
    }, [])
  );

  const cycleDay   = getCycleDay(lastPeriodStart);
  const phaseKey   = getPhaseForDay(cycleDay);
  const phase      = PHASES[phaseKey];
  const daysLeft   = getDaysUntilNextPeriod(lastPeriodStart);
  const nextPeriod = getNextPeriodDate(lastPeriodStart);

  const openModal = () => {
    setPickedDate(today);
    setModalVisible(true);
  };

  const confirmPeriod = async () => {
    if (!pickedDate) return;
    setLastPeriodStart(pickedDate);
    setModalVisible(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('periods').insert({ user_id: user.id, start_date: pickedDate });
  };

  const days = Array.from({ length: CYCLE_LENGTH }, (_, i) => i + 1);

  return (
    <View style={s.screen}>
      <View style={[s.header, { backgroundColor: phase.color }]}>
        <Text style={s.greeting}>{getGreeting()}{displayName ? `, ${displayName}` : ''} 👋</Text>
        <Text style={s.headerSub}>Here's your cycle overview for today</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Main card */}
        <View style={s.mainCard}>
          <View style={s.mainCardSide}>
            <Text style={s.cardLabel}>Cycle Day</Text>
            <Text style={[s.bigNum, { color: phase.color }]}>{cycleDay}</Text>
            <View style={[s.phasePill, { backgroundColor: phase.color + '22', borderColor: phase.color }]}>
              <View style={[s.phaseDot, { backgroundColor: phase.color }]} />
              <Text style={[s.phasePillText, { color: phase.color }]}>{phase.label}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.mainCardSide}>
            <Text style={s.cardLabel}>Next Period In</Text>
            <Text style={[s.bigNum, { color: phase.color }]}>{daysLeft}</Text>
            <Text style={s.unit}>days</Text>
            <Text style={s.nextDate}>{nextPeriod}</Text>
          </View>
        </View>

        {/* 28-day strip */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your Cycle</Text>
          <View style={s.strip}>
            {days.map((d) => {
              const pk = getPhaseForDay(d);
              const color = PHASES[pk]?.color ?? '#eee';
              return (
                <View key={d} style={[s.stripDay, { backgroundColor: color }, d === cycleDay && s.stripDayCurrent]} />
              );
            })}
          </View>
          <View style={s.stripLabels}>
            <Text style={s.stripLabel}>Day 1</Text>
            <Text style={s.stripLabel}>Day 14</Text>
            <Text style={s.stripLabel}>Day 28</Text>
          </View>
          <View style={s.legend}>
            {Object.entries(PHASES).map(([key, val]) => (
              <View key={key} style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: val.color }]} />
                <Text style={s.legendText}>{val.label}</Text>
                <Text style={s.legendDay}>Day {val.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Phase info */}
        <View style={[s.phaseInfo, { borderLeftColor: phase.color }]}>
          <Text style={[s.phaseInfoTitle, { color: phase.color }]}>{phase.label}</Text>
          <Text style={s.phaseInfoText}>{getPhaseDescription(phaseKey)}</Text>
        </View>

        {/* Quick actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: phase.color }]} onPress={() => navigation.navigate('Log')}>
            <Text style={s.actionBtnText}>📝  Log Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtnOutline, { borderColor: phase.color }]} onPress={() => navigation.navigate('Calendar')}>
            <Text style={[s.actionBtnOutlineText, { color: phase.color }]}>📅  Calendar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.periodBtn} onPress={openModal} activeOpacity={0.8}>
          <Text style={s.periodBtnEmoji}>🩸</Text>
          <View>
            <Text style={s.periodBtnLabel}>My period started</Text>
            <Text style={s.periodBtnSub}>Tap to log your period start date</Text>
          </View>
          <Text style={s.periodBtnChevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Period start modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>When did your period start?</Text>
            <Text style={s.modalSub}>Select a date below</Text>

            <Calendar
              current={today}
              maxDate={today}
              onDayPress={(day) => setPickedDate(day.dateString)}
              markingType="simple"
              markedDates={pickedDate ? { [pickedDate]: { selected: true, selectedColor: '#e75480' } } : {}}
              theme={{
                backgroundColor:     theme.card,
                calendarBackground:  theme.card,
                todayTextColor:      theme.primary,
                arrowColor:          theme.primary,
                monthTextColor:      theme.text,
                textMonthFontWeight: 'bold',
                textDayFontSize:     14,
                dayTextColor:        theme.text,
                textDisabledColor:   theme.muted,
                selectedDayTextColor: '#fff',
              }}
              style={{ borderRadius: 12, overflow: 'hidden' }}
            />

            {pickedDate && (
              <Text style={s.modalPicked}>
                Selected: {new Date(pickedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.8}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalConfirmBtn, !pickedDate && s.modalConfirmDisabled]}
                onPress={confirmPeriod}
                disabled={!pickedDate}
                activeOpacity={0.8}
              >
                <Text style={s.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 16, gap: 16 },
  mainCard: {
    backgroundColor: theme.card, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 } }),
  },
  mainCardSide: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 80, backgroundColor: theme.border, marginHorizontal: 16 },
  cardLabel: { fontSize: 12, color: theme.muted, marginBottom: 4, fontWeight: '500' },
  bigNum: { fontSize: 52, fontWeight: '800', lineHeight: 60 },
  unit: { fontSize: 13, color: theme.muted },
  nextDate: { fontSize: 11, color: theme.muted, marginTop: 4, textAlign: 'center' },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginTop: 6 },
  phaseDot: { width: 7, height: 7, borderRadius: 4 },
  phasePillText: { fontSize: 11, fontWeight: '600' },
  section: {
    backgroundColor: theme.card, borderRadius: 20, padding: 18,
    ...Platform.select({ web: { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 } }),
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 },
  strip: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', gap: 1, marginBottom: 4 },
  stripDay: { flex: 1 },
  stripDayCurrent: { borderWidth: 2, borderColor: theme.text, borderRadius: 2 },
  stripLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  stripLabel: { fontSize: 10, color: theme.muted },
  legend: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { flex: 1, fontSize: 13, color: theme.text },
  legendDay: { fontSize: 11, color: theme.muted },
  phaseInfo: {
    backgroundColor: theme.card, borderRadius: 16, padding: 16, borderLeftWidth: 4,
    ...Platform.select({ web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 } }),
  },
  phaseInfoTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  phaseInfoText: { fontSize: 13, color: theme.subtext, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  actionBtnOutline: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 2, backgroundColor: theme.card },
  actionBtnOutlineText: { fontSize: 14, fontWeight: '600' },
  periodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.card, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#e75480' + '44',
    marginBottom: 8,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(231,84,128,0.08)' }, default: { shadowColor: '#e75480', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 } }),
  },
  periodBtnEmoji: { fontSize: 28 },
  periodBtnLabel: { fontSize: 14, fontWeight: '700', color: '#e75480' },
  periodBtnSub:   { fontSize: 12, color: theme.muted, marginTop: 2 },
  periodBtnChevron: { marginLeft: 'auto', fontSize: 22, color: theme.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: theme.card, borderRadius: 20, padding: 20, width: '100%', maxWidth: 420 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 4 },
  modalSub:   { fontSize: 13, color: theme.muted, marginBottom: 16 },
  modalPicked: { fontSize: 13, color: theme.primary, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn:  { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.optionBg },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: theme.subtext },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#e75480' },
  modalConfirmDisabled: { backgroundColor: '#f2b8cc' },
  modalConfirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
