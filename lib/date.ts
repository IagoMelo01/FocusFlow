import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfWeek
} from "date-fns";

export function parseDateInput(value?: string | null) {
  if (!value) return null;
  const date = value.length === 10 ? parseISO(`${value}T00:00:00`) : parseISO(value);
  return isValid(date) ? date : null;
}

export function dateOnly(value?: string | Date | null) {
  if (!value) return startOfDay(new Date());
  if (value instanceof Date) return startOfDay(value);
  return startOfDay(parseDateInput(value) ?? new Date());
}

export function formatDateInput(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : parseDateInput(value);
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function todayRange() {
  const today = new Date();
  return {
    start: startOfDay(today),
    end: endOfDay(today)
  };
}

export function weekRange(base = new Date()) {
  const start = startOfWeek(base, { weekStartsOn: 1 });
  const end = endOfWeek(base, { weekStartsOn: 1 });
  return { start: startOfDay(start), end: endOfDay(end) };
}

export function daysOfCurrentWeek(base = new Date()) {
  const { start } = weekRange(base);
  return Array.from({ length: 7 }, (_, index) => startOfDay(addDays(start, index)));
}
