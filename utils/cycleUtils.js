export const CYCLE_LENGTH = 28;
export const PERIOD_LENGTH = 5;

export const PHASES = {
  period:      { label: 'Menstrual Phase',   color: '#e75480', textColor: '#fff',    day: '1–5'   },
  follicular:  { label: 'Follicular Phase',  color: '#fbbf24', textColor: '#78350f', day: '6–13'  },
  fertile:     { label: 'Fertile Window',    color: '#86efac', textColor: '#14532d', day: '10–17' },
  ovulation:   { label: 'Ovulation',         color: '#fb923c', textColor: '#fff',    day: '14'    },
  luteal:      { label: 'Luteal Phase',      color: '#c084fc', textColor: '#fff',    day: '15–28' },
};

export function getCycleDay(lastPeriodStart) {
  const start = new Date(lastPeriodStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return (diffDays % CYCLE_LENGTH) + 1;
}

export function getPhaseForDay(day) {
  if (day >= 1 && day <= 5)   return 'period';
  if (day === 14)              return 'ovulation';
  if (day >= 10 && day <= 17) return 'fertile';
  if (day >= 6 && day <= 13)  return 'follicular';
  return 'luteal';
}

export function getDaysUntilNextPeriod(lastPeriodStart) {
  const cycleDay = getCycleDay(lastPeriodStart);
  return CYCLE_LENGTH - cycleDay + 1;
}

export function getNextPeriodDate(lastPeriodStart) {
  const start = new Date(lastPeriodStart);
  const cycleDay = getCycleDay(lastPeriodStart);
  const daysLeft = CYCLE_LENGTH - cycleDay + 1;
  const next = new Date();
  next.setDate(next.getDate() + daysLeft);
  return next.toDateString();
}
