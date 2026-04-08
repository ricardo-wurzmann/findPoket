import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM", { locale: ptBR });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm", { locale: ptBR });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM yyyy", { locale: ptBR });
}

export function generateProtocol(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `#FP-${year}-${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    TOURNAMENT: "Torneio",
    CASH_GAME: "Cash Game",
    HOME_GAME: "Home Game",
    SIT_AND_GO: "Sit & Go",
  };
  return labels[type] ?? type;
}

export function eventStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UPCOMING: "Em Breve",
    LIVE: "Ao Vivo",
    FINISHED: "Encerrado",
    CANCELLED: "Cancelado",
  };
  return labels[status] ?? status;
}
