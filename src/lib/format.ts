export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const dateFmtLong = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-AU", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(date: Date | string): string {
  return dateFmt.format(new Date(date));
}

export function formatDateLong(date: Date | string): string {
  return dateFmtLong.format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return timeFmt.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

export function formatDurationMin(min: number): string {
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const rest = min % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
