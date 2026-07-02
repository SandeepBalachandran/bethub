export type Countdown = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasStarted: boolean;
};

export function getCountdown(kickoffTime: Date, now: Date = new Date()): Countdown {
  const totalMs = kickoffTime.getTime() - now.getTime();
  const hasStarted = totalMs <= 0;
  const clamped = Math.max(totalMs, 0);

  const days = Math.floor(clamped / (24 * 60 * 60 * 1000));
  const hours = Math.floor((clamped / (60 * 60 * 1000)) % 24);
  const minutes = Math.floor((clamped / (60 * 1000)) % 60);
  const seconds = Math.floor((clamped / 1000) % 60);

  return { totalMs, days, hours, minutes, seconds, hasStarted };
}
