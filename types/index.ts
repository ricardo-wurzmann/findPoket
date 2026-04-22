export type Role = "PLAYER" | "ORGANIZER";

export type EventType = "TOURNAMENT" | "CASH_GAME" | "HOME_GAME";

export type EventStatus = "UPCOMING" | "LIVE" | "FINISHED" | "CANCELLED";

export type RegStatus = "PENDING" | "APPROVED" | "DENIED";

export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name: string;
  handle: string | null;
  city: string | null;
  role: Role;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStats {
  id: string;
  userId: string;
  tournaments: number;
  itm: number;
  totalPrize: number;
  roi: number;
  bestFinish: string | null;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  whatsapp: string;
  website: string | null;
  openTime: string;
  closeTime: string;
  tableCount: string;
  lat: number;
  lng: number;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SeriesSummary {
  id: string;
  name: string;
  city: string;
  district: string | null;
  address: string;
  startsAt: Date;
  endsAt: Date | null;
  lat: number | null;
  lng: number | null;
}

export interface BlindStructureLevel {
  type?: string;
  dur?: number;
  sb?: number;
  bb?: number;
  ante?: number;
  label?: string;
}

export interface Event {
  id: string;
  name: string;
  type: EventType;
  description: string | null;
  buyIn: number;
  maxPlayers: number;
  startsAt: Date;
  endsAt: Date | null;
  isPrivate: boolean;
  isMajor: boolean;
  gtd: number | null;
  startingStack: string | null;
  levelDuration: string | null;
  rebuyPolicy: string | null;
  blinds: string | null;
  venueId: string | null;
  venue: Venue | null;
  seriesId: string | null;
  series: SeriesSummary | null;
  organizerId: string;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    registrations: number;
  };
  /** Parsed from API / Prisma JSON */
  blindStructure?: BlindStructureLevel[] | null;
  startStack?: number | null;
  rebuyEnabled?: boolean | null;
  rebuyStack?: number | null;
  rebuyPrice?: number | null;
  addonEnabled?: boolean | null;
  addonStack?: number | null;
  addonPrice?: number | null;
  blindType?: string | null;
  sbValue?: number | null;
  bbValue?: number | null;
  btnValue?: number | null;
  buyinMin?: number | null;
  buyinMax?: number | null;
  rake?: number | null;
  rakeCap?: number | null;
  hideRake?: boolean | null;
}

export interface Registration {
  id: string;
  userId: string;
  user: User;
  eventId: string;
  event: Event;
  status: RegStatus;
  createdAt: Date;
}

export interface DealerRequest {
  id: string;
  gameType: string;
  dealerQty: number;
  duration: string;
  address: string;
  district: string;
  city: string;
  venueName: string | null;
  reference: string | null;
  whatsapp: string;
  notes: string | null;
  scheduledAt: Date;
  protocol: string;
  status: string;
  createdAt: Date;
}

export interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
}

export type ViewMode = "map" | "list";
export type EventFilter = "all" | "venues" | "series" | "TOURNAMENT" | "CASH_GAME" | "HOME_GAME";
export type TimeFilter = "today" | "week" | "month";
