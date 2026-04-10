export type Role = 'PLAYER' | 'ORGANIZER';

export type EventType = 'TOURNAMENT' | 'CASH_GAME' | 'HOME_GAME';

export type EventStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED';

export type RegStatus = 'PENDING' | 'APPROVED' | 'DENIED';

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
  birthDate?: string | null;
  phone?: string | null;
  profession?: string | null;
  hendonMob?: string | null;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  events?: EventSummary[];
  _count?: {
    events: number;
    interests: number;
  };
}

export interface EventSummary {
  id: string;
  name: string;
  startsAt: string;
  status: EventStatus;
  type: EventType;
  buyIn: number;
}

export interface Event {
  id: string;
  name: string;
  type: EventType;
  description: string | null;
  buyIn: number;
  maxPlayers: number;
  startsAt: string;
  endsAt: string | null;
  isPrivate: boolean;
  isMajor: boolean;
  gtd: number | null;
  startingStack: string | null;
  levelDuration: string | null;
  rebuyPolicy: string | null;
  blinds: string | null;
  venueId: string | null;
  venue: Venue | null;
  organizerId: string;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
  };
}

export interface Registration {
  id: string;
  userId: string;
  user: User;
  eventId: string;
  event: Event;
  status: RegStatus;
  createdAt: string;
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
  scheduledAt: string;
  protocol: string;
  status: string;
  createdAt: string;
}

export type EventFilter = 'all' | 'venues' | 'TOURNAMENT' | 'CASH_GAME' | 'HOME_GAME';
export type TimeFilter = 'today' | 'week' | 'month';

export interface SearchResults {
  venues: Array<{ id: string; name: string; district: string; city: string }>;
  events: Array<{ id: string; name: string; startsAt: string; buyIn: number; status: EventStatus }>;
  players: Array<{ id: string; name: string; handle: string | null }>;
}
