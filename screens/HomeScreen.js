import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FadeInView from '../components/FadeInView';
import BloomButton from '../components/BloomButton';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { getCycleDay, getPhaseForDay, getDaysUntilNextPeriod, getNextPeriodDate, getAvgCycleLength, PHASES, CYCLE_LENGTH, PERIOD_LENGTH, getCurrentCycleStart, getPhaseDates } from '../utils/cycleUtils';
import { EDUCATION_TOPICS, HEALTH_FACTS } from '../utils/educationData';
import { space, radius, shadow } from '../theme/spacing';
import { fontFamily, type } from '../theme/typography';

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

function ArticleCard({ topic, onPress, s }) {
  return (
    <TouchableOpacity style={s.articleCard} onPress={() => onPress(topic)} activeOpacity={0.85}>
      <View style={[s.articleIconWrap, { backgroundColor: topic.color + '1c' }]}>
        <Text style={s.articleEmoji}>{topic.emoji}</Text>
        <View style={[s.articleCatBadge, { backgroundColor: topic.color }]}>
          <Text style={s.articleCatText}>{topic.category}</Text>
        </View>
      </View>
      <Text style={s.articleTitle} numberOfLines={2}>{topic.title}</Text>
      <Text style={s.articleMeta}>📖 {topic.readTime}</Text>
    </TouchableOpacity>
  );
}

function ArticleModal({ topic, visible, onClose, s, theme }) {
  if (!topic) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.articleModalCard}>
          <View style={[s.articleModalHeader, { backgroundColor: topic.color + '1c' }]}>
            <TouchableOpacity onPress={onClose} style={s.articleCloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[s.articleCloseText, { color: topic.color }]}>✕</Text>
            </TouchableOpacity>
            <Text style={s.articleModalEmoji}>{topic.emoji}</Text>
            <View style={[s.articleCatBadge, { backgroundColor: topic.color }]}>
              <Text style={s.articleCatText}>{topic.category}</Text>
            </View>
            <Text style={s.articleModalTitle}>{topic.title}</Text>
            <Text style={s.articleModalMeta}>📖 {topic.readTime}</Text>
          </View>
          <ScrollView style={s.articleModalBody} contentContainerStyle={{ padding: space.xl }}>
            {topic.sections.map((sec) => (
              <View key={sec.heading} style={s.articleSection}>
                <Text style={[s.articleSectionHeading, { color: topic.color }]}>{sec.heading}</Text>
                <Text style={s.articleSectionBody}>{sec.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  const { theme, isDark } = useTheme();
  const s = styles(theme);

  const [lastPeriodStart, setLastPeriodStart] = useState(null);
  const [latestPeriodId, setLatestPeriodId]   = useState(null);
  const [periodEnded, setPeriodEnded]         = useState(false);
  const [periodCount, setPeriodCount]         = useState(0);
  const [loading, setLoading]                 = useState(true);
  const [modalVisible, setModalVisible]       = useState(false);
  const [pickedDate, setPickedDate]           = useState(null);
  const [displayName, setDisplayName]         = useState('');
  const [cycleLength, setCycleLength]         = useState(CYCLE_LENGTH);
  const [periodLength, setPeriodLength]       = useState(PERIOD_LENGTH);
  const [activeArticle, setActiveArticle]     = useState(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: profile } = await supabase.from('profiles').select('first_name, username, cycle_length, period_length').eq('id', user.id).single();
        if (profile) {
          setDisplayName(profile.first_name || profile.username || '');
          if (profile.period_length) setPeriodLength(profile.period_length);
        }
        // Pull recent history (not just the latest period) so cycle length can be
        // learned from real data instead of relying on the static profile setting.
        const { data: periods } = await supabase
          .from('periods')
          .select('id, start_date, end_date')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false })
          .limit(12);
        if (periods && periods.length > 0) {
          setLastPeriodStart(periods[0].start_date);
          setLatestPeriodId(periods[0].id);
          setPeriodEnded(!!periods[0].end_date);
          setPeriodCount(periods.length);
          setCycleLength(getAvgCycleLength(periods, profile?.cycle_length || CYCLE_LENGTH));
        } else {
          setLastPeriodStart(null);
          setLatestPeriodId(null);
          setPeriodEnded(false);
          setPeriodCount(0);
          setCycleLength(profile?.cycle_length || CYCLE_LENGTH);
        }
        setLoading(false);
      };
      load();
    }, [])
  );

  const cycleDay          = lastPeriodStart ? getCycleDay(lastPeriodStart, cycleLength) : null;
  const phaseKey          = cycleDay ? getPhaseForDay(cycleDay, periodLength, cycleLength) : 'follicular';
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
      <LinearGradient
        colors={[phase.color, theme.surface]}
        locations={[0, 1]}
        style={s.header}
      >
        <View style={s.headerTopRow}>
          <Text style={[s.greeting, { color: phase.textColor }]}>{getGreeting()}{displayName ? `, ${displayName}` : ''} 👋</Text>
          <BloomButton onPress={() => navigation.navigate('Chat')} />
        </View>
        <Text style={[s.headerSub, { color: phase.textColor, opacity: 0.85 }]}>Here's your cycle overview for today</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content}>
        {/* Main card */}
        {!loading && !lastPeriodStart ? (
          <View style={s.gettingStartedCard}>
            <Text style={s.gsWelcome}>Welcome to Luna 🌸</Text>
            <Text style={s.gsSub}>Follow these steps to unlock your cycle insights.</Text>

            <TouchableOpacity style={s.gsStep} onPress={openModal} activeOpacity={0.85}>
              <View style={[s.gsStepNum, { backgroundColor: theme.primary }]}>
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
              {periodCount >= 2 && (
                <Text style={s.predictionNote}>Based on your last {Math.min(periodCount - 1, 11)} cycle{periodCount - 1 > 1 ? 's' : ''}</Text>
              )}
            </View>
          </View>
        )}

        {/* 28-day strip */}
        {lastPeriodStart && <View style={s.section}>
          <Text style={s.sectionTitle}>Your Cycle</Text>
          <View style={s.strip}>
            {days.map((d) => {
              const pk = getPhaseForDay(d, periodLength, cycleLength);
              const color = PHASES[pk]?.color ?? '#eee';
              return (
                <View key={d} style={[s.stripDay, { backgroundColor: color }, d === cycleDay && s.stripDayCurrent]} />
              );
            })}
          </View>
          <View style={s.stripLabels}>
            <Text style={s.stripLabel}>Day 1</Text>
            <Text style={s.stripLabel}>Day {Math.round(cycleLength / 2)}</Text>
            <Text style={s.stripLabel}>Day {cycleLength}</Text>
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
            <Text style={[s.actionBtnText, { color: phase.textColor }]}>📝  Log Today</Text>
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
          <Text style={s.eduSectionSub}>Tap any card to read a quick guide</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.videoRow}
        >
          {EDUCATION_TOPICS.map(topic => (
            <ArticleCard key={topic.id} topic={topic} onPress={setActiveArticle} s={s} />
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
              key={isDark ? 'dark' : 'light'}
              current={today}
              maxDate={today}
              onDayPress={(day) => setPickedDate(day.dateString)}
              markingType="simple"
              markedDates={pickedDate ? { [pickedDate]: { selected: true, selectedColor: theme.primary } } : {}}
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

      <ArticleModal
        topic={activeArticle}
        visible={!!activeArticle}
        onClose={() => setActiveArticle(null)}
        s={s}
        theme={theme}
      />
    </FadeInView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  header: { paddingHorizontal: space.xl, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: space.xxl },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space.xs },
  greeting: { ...type.h1, flex: 1 },
  chatBtn: { padding: 4, marginTop: -2 },
  chatBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 26, letterSpacing: 2, fontFamily: fontFamily.regular },
  headerSub: { ...type.small },
  content: { padding: space.xl, gap: space.xl },
  mainCard: {
    backgroundColor: theme.card, borderRadius: radius.xl, padding: space.xl, flexDirection: 'row', alignItems: 'center',
    ...Platform.select(shadow),
  },
  mainCardSide: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 80, backgroundColor: theme.border, marginHorizontal: space.lg },
  cardLabel: { ...type.label, color: theme.muted, marginBottom: space.xs, textTransform: 'uppercase' },
  bigNum: { fontFamily: fontFamily.extrabold, fontSize: 52, lineHeight: 58 },
  unit: { ...type.small, color: theme.muted },
  nextDate: { ...type.caption, color: theme.muted, marginTop: space.xs, textAlign: 'center' },
  predictionNote: { ...type.caption, fontSize: 10, color: theme.muted, opacity: 0.8, marginTop: 2, textAlign: 'center' },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: space.sm + 2, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, marginTop: space.xs + 2 },
  phaseDot: { width: 7, height: 7, borderRadius: 4 },
  phasePillText: { ...type.caption, fontFamily: fontFamily.semibold },
  section: {
    backgroundColor: theme.card, borderRadius: radius.xl, padding: space.lg + 2,
    ...Platform.select(shadow),
  },
  sectionTitle: { ...type.h3, color: theme.text, marginBottom: space.md },
  strip: { flexDirection: 'row', height: 16, borderRadius: radius.sm, overflow: 'hidden', gap: 1, marginBottom: space.xs },
  stripDay: { flex: 1 },
  stripDayCurrent: { borderWidth: 2, borderColor: theme.text, borderRadius: 2 },
  stripLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md },
  stripLabel: { ...type.caption, color: theme.muted },
  legend: { gap: space.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { ...type.body, flex: 1, color: theme.text },
  legendDay: { ...type.caption, color: theme.muted },
  phaseInfo: {
    backgroundColor: theme.card, borderRadius: radius.lg, padding: space.lg, borderLeftWidth: 4,
    ...Platform.select(shadow),
  },
  phaseInfoTitle: { ...type.h3, marginBottom: space.xs + 2 },
  phaseInfoText: { ...type.body, color: theme.subtext, lineHeight: 21 },
  gettingStartedCard: {
    backgroundColor: theme.card, borderRadius: radius.xl, padding: space.xl,
    ...Platform.select(shadow),
  },
  gsWelcome:      { ...type.h2, color: theme.text, marginBottom: space.xs },
  gsSub:          { ...type.small, color: theme.muted, marginBottom: space.xl },
  gsStep: {
    flexDirection: 'row', alignItems: 'center', gap: space.md + 2,
    paddingVertical: space.md + 2, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  gsStepLocked:   { opacity: 0.45 },
  gsStepNum:      { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  gsStepNumText:  { color: '#fff', fontFamily: fontFamily.bold, fontSize: 14 },
  gsStepBody:     { flex: 1 },
  gsStepTitle:    { ...type.h3, color: theme.text, marginBottom: 2 },
  gsStepDesc:     { ...type.small, color: theme.muted, lineHeight: 18 },
  gsStepArrow:    { fontSize: 22, color: theme.primary },
  actionsRow: { flexDirection: 'row', gap: space.md },
  actionBtn: { flex: 1, paddingVertical: space.md + 2, borderRadius: radius.md, alignItems: 'center' },
  actionBtnText: { ...type.bodyMedium, fontFamily: fontFamily.semibold, color: '#fff' },
  actionBtnOutline: { flex: 1, paddingVertical: space.md + 2, borderRadius: radius.md, alignItems: 'center', borderWidth: 2, backgroundColor: theme.card },
  actionBtnOutlineText: { ...type.bodyMedium, fontFamily: fontFamily.semibold },
  periodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space.md + 2,
    backgroundColor: theme.card, borderRadius: radius.lg, padding: space.lg,
    borderWidth: 1.5, borderColor: theme.primary + '33',
    marginBottom: space.sm,
    ...Platform.select(shadow),
  },
  periodBtnEmoji:   { fontSize: 28 },
  periodBtnLabel:   { ...type.h3, color: theme.primary },
  periodBtnSub:     { ...type.small, color: theme.muted, marginTop: 2 },
  periodBtnChevron: { marginLeft: 'auto', fontSize: 22, color: theme.muted },
  endPeriodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space.md + 2,
    backgroundColor: theme.card, borderRadius: radius.lg, padding: space.lg,
    borderWidth: 1.5, borderColor: '#34d399' + '44',
    marginBottom: space.sm,
    ...Platform.select(shadow),
  },
  endPeriodEmoji:   { fontSize: 28 },
  endPeriodLabel:   { ...type.h3, color: '#34d399' },
  endPeriodSub:     { ...type.small, color: theme.muted, marginTop: 2 },
  endPeriodChevron: { marginLeft: 'auto', fontSize: 22, color: theme.muted },
  periodEndedCard: {
    flexDirection: 'row', alignItems: 'center', gap: space.md + 2,
    backgroundColor: '#34d399' + '15', borderRadius: radius.lg, padding: space.lg,
    borderWidth: 1.5, borderColor: '#34d399' + '33',
    marginBottom: space.sm,
  },
  periodEndedEmoji: { fontSize: 24, color: '#34d399' },
  periodEndedLabel: { ...type.h3, color: '#34d399' },
  periodEndedSub:   { ...type.small, color: theme.muted, marginTop: 2 },
  // ── Education section ──
  eduSectionHeader: { marginTop: space.xs, marginBottom: space.md - 2 },
  eduSectionTitle:  { ...type.h2, color: theme.text },
  eduSectionSub:    { ...type.small, color: theme.muted, marginTop: 2 },

  videoRow: { paddingLeft: 2, paddingRight: space.lg, gap: space.md, paddingBottom: space.xs },
  articleCard: {
    width: 190,
    backgroundColor: theme.card, borderRadius: radius.lg, overflow: 'hidden',
    ...Platform.select(shadow),
  },
  articleIconWrap: { width: 190, height: 92, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  articleEmoji:    { fontSize: 36 },
  articleCatBadge: {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  articleCatText: { ...type.caption, fontFamily: fontFamily.bold, fontSize: 9, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.4 },
  articleTitle:   { ...type.h3, fontSize: 12, color: theme.text, marginHorizontal: space.sm + 2, marginTop: space.sm + 2, marginBottom: 4, lineHeight: 17 },
  articleMeta:    { ...type.caption, color: theme.muted, marginHorizontal: space.sm + 2, marginBottom: space.sm + 2 },

  // ── Article reader modal ──
  articleModalCard: {
    backgroundColor: theme.card, borderRadius: radius.xl, width: '100%', maxWidth: 460, maxHeight: '82%', overflow: 'hidden',
  },
  articleModalHeader: { padding: space.xl, paddingTop: space.lg },
  articleCloseBtn:  { position: 'absolute', top: space.md, right: space.md, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  articleCloseText: { fontSize: 14, fontFamily: fontFamily.bold },
  articleModalEmoji: { fontSize: 34, marginBottom: space.sm },
  articleModalTitle: { ...type.h1, fontSize: 19, color: theme.text, marginTop: space.sm, marginBottom: 4 },
  articleModalMeta:  { ...type.small, color: theme.muted },
  articleModalBody:  { flexGrow: 0 },
  articleSection:        { marginBottom: space.lg },
  articleSectionHeading: { ...type.h3, marginBottom: space.xs },
  articleSectionBody:    { ...type.body, color: theme.subtext, lineHeight: 21 },

  factRow: { paddingLeft: 2, paddingRight: space.lg, gap: space.md, paddingBottom: space.xs },
  factCard: {
    width: 175, padding: space.md + 2, backgroundColor: theme.card, borderRadius: radius.lg,
    borderTopWidth: 3,
    ...Platform.select(shadow),
  },
  factEmoji: { fontSize: 26, marginBottom: space.sm },
  factTitle: { ...type.h3, fontSize: 13, color: theme.text, marginBottom: space.xs + 2, lineHeight: 17 },
  factBody:  { ...type.caption, color: theme.subtext, lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: space.xl },
  modalCard: { backgroundColor: theme.card, borderRadius: radius.xl, padding: space.xl, width: '100%', maxWidth: 420 },
  modalTitle: { ...type.h2, color: theme.text, marginBottom: space.xs },
  modalSub:   { ...type.small, color: theme.muted, marginBottom: space.lg },
  modalPicked: { ...type.small, fontFamily: fontFamily.semibold, color: theme.primary, textAlign: 'center', marginTop: space.md },
  modalActions: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  modalCancelBtn:  { flex: 1, paddingVertical: space.md + 2, borderRadius: radius.md, alignItems: 'center', backgroundColor: theme.optionBg },
  modalCancelText: { ...type.bodyMedium, fontFamily: fontFamily.semibold, color: theme.subtext },
  modalConfirmBtn: { flex: 1, paddingVertical: space.md + 2, borderRadius: radius.md, alignItems: 'center', backgroundColor: theme.primary },
  modalConfirmDisabled: { backgroundColor: '#f2b8cc' },
  modalConfirmText: { ...type.bodyMedium, fontFamily: fontFamily.semibold, color: '#fff' },
});
