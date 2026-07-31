import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Modal, Platform, Linking } from 'react-native';
import FadeInView from '../components/FadeInView';
import BloomButton from '../components/BloomButton';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { getCycleDay, getPhaseForDay, getDaysUntilNextPeriod, getNextPeriodDate, PHASES, CYCLE_LENGTH, PERIOD_LENGTH, getCurrentCycleStart, getPhaseDates } from '../utils/cycleUtils';
import { EDUCATION_VIDEOS, HEALTH_FACTS } from '../utils/educationData';

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

// ─── Education sub-components ─────────────────────────────────────────────────

function VideoCard({ video, s }) {
  const [imgError, setImgError] = useState(false);
  const open = () => Linking.openURL(video.url).catch(() => {});
  return (
    <TouchableOpacity style={s.videoCard} onPress={open} activeOpacity={0.85}>
      <View style={s.videoThumbWrap}>
        {imgError ? (
          <View style={[s.videoThumbFallback, { backgroundColor: video.color + '22' }]}>
            <Text style={s.videoThumbEmoji}>{video.emoji}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg` }}
            style={s.videoThumb}
            onError={() => setImgError(true)}
            resizeMode="cover"
          />
        )}
        {/* Play button overlay */}
        <View style={s.playOverlay}>
          <View style={s.playBtn}>
            <Text style={s.playBtnIcon}>▶</Text>
          </View>
        </View>
        {/* Category badge */}
        <View style={[s.vidCatBadge, { backgroundColor: video.color }]}>
          <Text style={s.vidCatText}>{video.category}</Text>
        </View>
      </View>
      <Text style={s.videoTitle} numberOfLines={2}>{video.title}</Text>
      <Text style={s.videoChannel}>{video.channel}</Text>
    </TouchableOpacity>
  );
}

function FactCard({ fact, s }) {
  return (
    <View style={[s.factCard, { borderTopColor: fact.color }]}>
      <Text style={s.factEmoji}>{fact.emoji}</Text>
      <Text style={s.factTitle}>{fact.title}</Text>
      <Text style={s.factBody} numberOfLines={4}>{fact.body}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  const [lastPeriodStart, setLastPeriodStart] = useState(null);
  const [latestPeriodId, setLatestPeriodId]   = useState(null);
  const [periodEnded, setPeriodEnded]         = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [modalVisible, setModalVisible]       = useState(false);
  const [pickedDate, setPickedDate]           = useState(null);
  const [displayName, setDisplayName]         = useState('');
  const [cycleLength, setCycleLength]         = useState(CYCLE_LENGTH);
  const [periodLength, setPeriodLength]       = useState(PERIOD_LENGTH);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: profile } = await supabase.from('profiles').select('first_name, username, cycle_length, period_length').eq('id', user.id).single();
        if (profile) {
          setDisplayName(profile.first_name || profile.username || '');
          if (profile.cycle_length)  setCycleLength(profile.cycle_length);
          if (profile.period_length) setPeriodLength(profile.period_length);
        }
        const { data: periods } = await supabase
          .from('periods')
          .select('id, start_date, end_date')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false })
          .limit(1);
        if (periods && periods.length > 0) {
          setLastPeriodStart(periods[0].start_date);
          setLatestPeriodId(periods[0].id);
          setPeriodEnded(!!periods[0].end_date);
        } else {
          setLastPeriodStart(null);
          setLatestPeriodId(null);
          setPeriodEnded(false);
        }
        setLoading(false);
      };
      load();
    }, [])
  );

  const cycleDay          = lastPeriodStart ? getCycleDay(lastPeriodStart, cycleLength) : null;
  const phaseKey          = cycleDay ? getPhaseForDay(cycleDay, periodLength) : 'follicular';
  const phase             = PHASES[phaseKey];
  const daysLeft          = lastPeriodStart ? getDaysUntilNextPeriod(lastPeriodStart, cycleLength) : null;
  const nextPeriod        = lastPeriodStart ? getNextPeriodDate(lastPeriodStart, cycleLength) : null;
  const currentCycleStart = lastPeriodStart ? getCurrentCycleStart(lastPeriodStart, cycleLength) : null;
  const phaseDates        = currentCycleStart ? getPhaseDates(currentCycleStart, cycleLength, periodLength) : null;

  const openModal = () => {
    setPickedDate(today);
    setModalVisible(true);
  };

  const confirmPeriod = async () => {
    if (!pickedDate) return;
    setLastPeriodStart(pickedDate);
    setPeriodEnded(false);
    setModalVisible(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('periods')
      .insert({ user_id: user.id, start_date: pickedDate })
      .select('id')
      .single();
    if (data) setLatestPeriodId(data.id);
  };

  const endPeriod = async () => {
    if (!latestPeriodId) return;
    setPeriodEnded(true);
    await supabase
      .from('periods')
      .update({ end_date: today })
      .eq('id', latestPeriodId);
  };

  const days = Array.from({ length: cycleLength }, (_, i) => i + 1);

  return (
    <FadeInView style={s.screen}>
      <View style={[s.header, { backgroundColor: phase.color }]}>
        <View style={s.headerTopRow}>
          <Text style={s.greeting}>{getGreeting()}{displayName ? `, ${displayName}` : ''} 👋</Text>
          <BloomButton onPress={() => navigation.navigate('Chat')} />
        </View>
        <Text style={s.headerSub}>Here's your cycle overview for today</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Main card */}
        {!loading && !lastPeriodStart ? (
          <View style={s.gettingStartedCard}>
            <Text style={s.gsWelcome}>Welcome to Luna 🌸</Text>
            <Text style={s.gsSub}>Follow these steps to unlock your cycle insights.</Text>

            <TouchableOpacity style={s.gsStep} onPress={openModal} activeOpacity={0.85}>
              <View style={[s.gsStepNum, { backgroundColor: '#e75480' }]}>
                <Text style={s.gsStepNumText}>1</Text>
              </View>
              <View style={s.gsStepBody}>
                <Text style={s.gsStepTitle}>Log your first period</Text>
                <Text style={s.gsStepDesc}>Tap here to record when your last period started.</Text>
              </View>
              <Text style={s.gsStepArrow}>›</Text>
            </TouchableOpacity>

            <View style={[s.gsStep, s.gsStepLocked]}>
              <View style={[s.gsStepNum, { backgroundColor: theme.border }]}>
                <Text style={s.gsStepNumText}>2</Text>
              </View>
              <View style={s.gsStepBody}>
                <Text style={[s.gsStepTitle, { color: theme.muted }]}>Log daily symptoms</Text>
                <Text style={s.gsStepDesc}>Track how you feel each day for trends over time.</Text>
              </View>
            </View>

            <View style={[s.gsStep, s.gsStepLocked, { borderBottomWidth: 0 }]}>
              <View style={[s.gsStepNum, { backgroundColor: theme.border }]}>
                <Text style={s.gsStepNumText}>3</Text>
              </View>
              <View style={s.gsStepBody}>
                <Text style={[s.gsStepTitle, { color: theme.muted }]}>Unlock cycle statistics</Text>
                <Text style={s.gsStepDesc}>After 2 periods, see your avg. length and regularity.</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={s.mainCard}>
            <View style={s.mainCardSide}>
              <Text style={s.cardLabel}>Cycle Day</Text>
              <Text style={[s.bigNum, { color: phase.color }]}>{loading ? '—' : cycleDay}</Text>
              <View style={[s.phasePill, { backgroundColor: phase.color + '22', borderColor: phase.color }]}>
                <View style={[s.phaseDot, { backgroundColor: phase.color }]} />
                <Text style={[s.phasePillText, { color: phase.color }]}>{phase.label}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.mainCardSide}>
              <Text style={s.cardLabel}>Next Period In</Text>
              <Text style={[s.bigNum, { color: phase.color }]}>{loading ? '—' : daysLeft}</Text>
              <Text style={s.unit}>days</Text>
              <Text style={s.nextDate}>{loading ? '' : nextPeriod}</Text>
            </View>
          </View>
        )}

        {/* 28-day strip */}
        {lastPeriodStart && <View style={s.section}>
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
                <Text style={s.legendDay}>
                  {phaseDates ? phaseDates[key] : `Day ${val.day}`}
                </Text>
              </View>
            ))}
          </View>
        </View>}

        {/* Phase info */}
        {lastPeriodStart && <View style={[s.phaseInfo, { borderLeftColor: phase.color }]}>
          <Text style={[s.phaseInfoTitle, { color: phase.color }]}>{phase.label}</Text>
          <Text style={s.phaseInfoText}>{getPhaseDescription(phaseKey)}</Text>
        </View>}

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

        {/* End period — only shown while in period phase */}
        {lastPeriodStart && phaseKey === 'period' && (
          periodEnded ? (
            <View style={s.periodEndedCard}>
              <Text style={s.periodEndedEmoji}>✓</Text>
              <View>
                <Text style={s.periodEndedLabel}>Period logged as ended</Text>
                <Text style={s.periodEndedSub}>Logged today · tap "My period started" to start a new one</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.endPeriodBtn} onPress={endPeriod} activeOpacity={0.8}>
              <Text style={s.endPeriodEmoji}>🌿</Text>
              <View>
                <Text style={s.endPeriodLabel}>My period has ended</Text>
                <Text style={s.endPeriodSub}>Tap to log your period end date</Text>
              </View>
              <Text style={s.endPeriodChevron}>›</Text>
            </TouchableOpacity>
          )
        )}

        {/* ── Learn & Discover ── */}
        <View style={s.eduSectionHeader}>
          <Text style={s.eduSectionTitle}>Learn & Discover</Text>
          <Text style={s.eduSectionSub}>Tap any card to watch on YouTube</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.videoRow}
        >
          {EDUCATION_VIDEOS.map(video => (
            <VideoCard key={video.id} video={video} s={s} />
          ))}
        </ScrollView>

        {/* ── Quick Health Facts ── */}
        <View style={[s.eduSectionHeader, { marginTop: 8 }]}>
          <Text style={s.eduSectionTitle}>Did You Know?</Text>
          <Text style={s.eduSectionSub}>Scroll for health facts</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.factRow}
        >
          {HEALTH_FACTS.map(fact => (
            <FactCard key={fact.id} fact={fact} s={s} />
          ))}
        </ScrollView>

        <View style={{ height: 16 }} />
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
    </FadeInView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1 },
  chatBtn: { padding: 4, marginTop: -2 },
  chatBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 26, letterSpacing: 2, fontWeight: '300' },
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
  gettingStartedCard: {
    backgroundColor: theme.card, borderRadius: 20, padding: 20,
    ...Platform.select({ web: { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 } }),
  },
  gsWelcome:      { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4 },
  gsSub:          { fontSize: 13, color: theme.muted, marginBottom: 20 },
  gsStep: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  gsStepLocked:   { opacity: 0.45 },
  gsStepNum:      { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  gsStepNumText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  gsStepBody:     { flex: 1 },
  gsStepTitle:    { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 2 },
  gsStepDesc:     { fontSize: 12, color: theme.muted, lineHeight: 18 },
  gsStepArrow:    { fontSize: 22, color: '#e75480' },
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
  periodBtnEmoji:   { fontSize: 28 },
  periodBtnLabel:   { fontSize: 14, fontWeight: '700', color: '#e75480' },
  periodBtnSub:     { fontSize: 12, color: theme.muted, marginTop: 2 },
  periodBtnChevron: { marginLeft: 'auto', fontSize: 22, color: theme.muted },
  endPeriodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.card, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#34d399' + '55',
    marginBottom: 8,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(52,211,153,0.08)' }, default: { shadowColor: '#34d399', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 } }),
  },
  endPeriodEmoji:   { fontSize: 28 },
  endPeriodLabel:   { fontSize: 14, fontWeight: '700', color: '#34d399' },
  endPeriodSub:     { fontSize: 12, color: theme.muted, marginTop: 2 },
  endPeriodChevron: { marginLeft: 'auto', fontSize: 22, color: theme.muted },
  periodEndedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#34d399' + '15', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#34d399' + '44',
    marginBottom: 8,
  },
  periodEndedEmoji: { fontSize: 24, color: '#34d399' },
  periodEndedLabel: { fontSize: 14, fontWeight: '700', color: '#34d399' },
  periodEndedSub:   { fontSize: 12, color: theme.muted, marginTop: 2 },
  // ── Education section ──
  eduSectionHeader: { marginTop: 4, marginBottom: 10 },
  eduSectionTitle:  { fontSize: 16, fontWeight: '800', color: theme.text },
  eduSectionSub:    { fontSize: 12, color: theme.muted, marginTop: 2 },

  videoRow: { paddingLeft: 2, paddingRight: 16, gap: 12, paddingBottom: 4 },
  videoCard: {
    width: 190,
    backgroundColor: theme.card, borderRadius: 16, overflow: 'hidden',
    ...Platform.select({
      web:     { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    }),
  },
  videoThumbWrap:     { width: 190, height: 107, position: 'relative' },
  videoThumb:         { width: 190, height: 107 },
  videoThumbFallback: { width: 190, height: 107, alignItems: 'center', justifyContent: 'center' },
  videoThumbEmoji:    { fontSize: 40 },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnIcon:  { fontSize: 14, color: '#111', marginLeft: 2 },
  vidCatBadge:  {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  vidCatText:   { fontSize: 9, color: '#fff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  videoTitle:   { fontSize: 12, fontWeight: '700', color: theme.text, margin: 10, marginBottom: 4, lineHeight: 17 },
  videoChannel: { fontSize: 11, color: theme.muted, marginHorizontal: 10, marginBottom: 10 },

  factRow: { paddingLeft: 2, paddingRight: 16, gap: 12, paddingBottom: 4 },
  factCard: {
    width: 175, padding: 14, backgroundColor: theme.card, borderRadius: 16,
    borderTopWidth: 3,
    ...Platform.select({
      web:     { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    }),
  },
  factEmoji: { fontSize: 26, marginBottom: 8 },
  factTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 6, lineHeight: 17 },
  factBody:  { fontSize: 11, color: theme.subtext, lineHeight: 16 },

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
