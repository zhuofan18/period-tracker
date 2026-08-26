export const CYCLE_LENGTH  = 28;
export const PERIOD_LENGTH = 5;

export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(dateStr) {
  return parseLocal(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function getCurrentCycleStart(lastPeriodStartStr, cycleLength) {
  const daysSince = Math.floor(
    (new Date() - new Date(lastPeriodStartStr)) / (1000 * 60 * 60 * 24)
  );
  const cyclesPassed = Math.max(0, Math.floor(daysSince / cycleLength));
  return addDays(lastPeriodStartStr, cyclesPassed * cycleLength);
}

// The luteal phase (ovulation → next period) is relatively fixed across
// cycle lengths — it's the follicular phase (period → ovulation) that
// stretches or shrinks. So ovulation is calculated backward from the end
// of the cycle rather than pinned to a fixed day.
const LUTEAL_LENGTH = 14;

export function getOvulationDay(cycleLength = CYCLE_LENGTH, periodLength = PERIOD_LENGTH) {
  // Floored so ovulation can never land inside (or right after) the period
  // on unusually short cycles.
  return Math.max(cycleLength - LUTEAL_LENGTH, periodLength + 3);
}

// Fertile window = the ~5 days sperm can survive before ovulation, plus
// ovulation day itself.
export function getFertileWindow(cycleLength = CYCLE_LENGTH, periodLength = PERIOD_LENGTH) {
  const ovulationDay = getOvulationDay(cycleLength, periodLength);
  const start = Math.max(ovulationDay - 5, periodLength + 1);
  return { start, end: ovulationDay, ovulationDay };
}

export function getPhaseDates(cycleStart, cycleLength, periodLength) {
  const d = (dayNum) => fmtDate(addDays(cycleStart, dayNum - 1));
  const { start, ovulationDay } = getFertileWindow(cycleLength, periodLength);
  const follicularEnd = start - 1;
  return {
    period:     `${d(1)} – ${d(periodLength)}`,
    follicular: follicularEnd > periodLength ? `${d(periodLength + 1)} – ${d(follicularEnd)}` : d(periodLength + 1),
    fertile:    `${d(start)} – ${d(ovulationDay - 1)}`,
    ovulation:  d(ovulationDay),
    luteal:     `${d(ovulationDay + 1)} – ${d(cycleLength)}`,
    nextPeriod: d(cycleLength + 1),
  };
}

// A single cohesive family — same soft, muted saturation band across every
// hue so the phases read as one palette instead of five unrelated colors.
export const PHASES = {
  period:     { label: 'Menstrual Phase',  color: '#e75480', textColor: '#fff',    day: '1–5'   },
  follicular: { label: 'Follicular Phase', color: '#efbb5e', textColor: '#5a3b0a', day: '6–13'  },
  fertile:    { label: 'Fertile Window',   color: '#6fc498', textColor: '#0f3d24', day: '10–17' },
  ovulation:  { label: 'Ovulation',        color: '#e67f56', textColor: '#fff',    day: '14'    },
  luteal:     { label: 'Luteal Phase',     color: '#a98ae0', textColor: '#fff',    day: '15–28' },
};

export function getCycleDay(lastPeriodStart, cycleLength = CYCLE_LENGTH) {
  const start = new Date(lastPeriodStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return (diffDays % cycleLength) + 1;
}

export function getPhaseForDay(day, periodLength = PERIOD_LENGTH, cycleLength = CYCLE_LENGTH) {
  if (day >= 1 && day <= periodLength) return 'period';
  const { start, end, ovulationDay } = getFertileWindow(cycleLength, periodLength);
  if (day === ovulationDay)            return 'ovulation';
  if (day >= start && day <= end)      return 'fertile';
  if (day > periodLength && day < start) return 'follicular';
  return 'luteal';
}

// Predicts cycle length from real logged history instead of a fixed
// setting. Averages the gaps between consecutive period start dates
// (ignoring implausible gaps — under a day, or over 90, which usually
// mean a data-entry mistake rather than a real cycle). Falls back to
// `fallback` (the profile's manual cycle_length, or the app default)
// when there isn't at least 2 periods of real history to learn from.
export function getAvgCycleLength(periods, fallback = CYCLE_LENGTH) {
  if (!periods || periods.length < 2) return fallback;
  const sorted = [...periods].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i].start_date) - new Date(sorted[i - 1].start_date)) / (1000 * 60 * 60 * 24));
    if (diff > 0 && diff < 90) gaps.push(diff);
  }
  if (gaps.length === 0) return fallback;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function getDaysUntilNextPeriod(lastPeriodStart, cycleLength = CYCLE_LENGTH) {
  const cycleDay = getCycleDay(lastPeriodStart, cycleLength);
  return cycleLength - cycleDay + 1;
}

export function getNextPeriodDate(lastPeriodStart, cycleLength = CYCLE_LENGTH) {
  const cycleDay = getCycleDay(lastPeriodStart, cycleLength);
  const daysLeft = cycleLength - cycleDay + 1;
  const next = new Date();
  next.setDate(next.getDate() + daysLeft);
  return next.toDateString();
}
