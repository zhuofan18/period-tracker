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

export function getPhaseDates(cycleStart, cycleLength, periodLength) {
  const d = (n) => fmtDate(addDays(cycleStart, n));
  return {
    period:     `${d(0)} – ${d(periodLength - 1)}`,
    follicular: `${d(periodLength)} – ${d(12)}`,
    fertile:    `${d(9)} – ${d(16)}`,
    ovulation:  d(13),
    luteal:     `${d(14)} – ${d(cycleLength - 1)}`,
    nextPeriod: d(cycleLength),
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

export function getPhaseForDay(day, periodLength = PERIOD_LENGTH) {
  if (day >= 1 && day <= periodLength) return 'period';
  if (day === 14)                      return 'ovulation';
  if (day >= 10 && day <= 17)          return 'fertile';
  if (day >= 6 && day <= 13)           return 'follicular';
  return 'luteal';
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
