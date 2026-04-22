import { format, formatDistanceToNow, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventFilter, TimeFilter, Event } from '@/types';

export function formatCurrency(value: number): string {
  if (value === 0) return 'Gratuito';
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "d 'de' MMM", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "d MMM, HH:mm", { locale: ptBR });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm');
}

export function formatDayMonth(date: string | Date): { day: string; month: string } {
  const d = new Date(date);
  return {
    day: format(d, 'd'),
    month: format(d, 'MMM', { locale: ptBR }).toUpperCase(),
  };
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function filterEventsByTime(events: Event[], filter: TimeFilter): Event[] {
  return events.filter((event) => {
    const date = new Date(event.startsAt);
    if (filter === 'today') return isToday(date);
    if (filter === 'week') return isThisWeek(date, { locale: ptBR });
    if (filter === 'month') return isThisMonth(date);
    return true;
  });
}

export function filterEventsByType(events: Event[], filter: EventFilter): Event[] {
  if (filter === 'all') return events;
  if (filter === 'venues') return events.filter((e) => e.venueId !== null);
  if (filter === 'series') return [];
  return events.filter((e) => e.type === filter);
}

export function isVenueOpen(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const current = hours * 60 + minutes;

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;

  if (close < open) {
    // Crosses midnight
    return current >= open || current <= close;
  }
  return current >= open && current <= close;
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
