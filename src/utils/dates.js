import { format, parseISO, differenceInDays, isValid, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return '-';
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch {
    return '-';
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return '-';
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return '-';
  }
}

export function formatRelative(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return '-';
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return '-';
  }
}

export function daysBetween(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  try {
    const start = typeof startStr === 'string' ? parseISO(startStr) : startStr;
    const end = typeof endStr === 'string' ? parseISO(endStr) : endStr;
    return differenceInDays(end, start);
  } catch {
    return 0;
  }
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function nowISO() {
  return new Date().toISOString();
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    const today = format(new Date(), 'yyyy-MM-dd');
    const dateFormatted = format(date, 'yyyy-MM-dd');
    return today === dateFormatted;
  } catch {
    return false;
  }
}
