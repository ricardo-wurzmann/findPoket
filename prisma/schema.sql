-- FindPoker — Schema completo
-- Cole e execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/mzjsacaomzkxwapgsefi/sql/new

-- Enums
CREATE TYPE "Role" AS ENUM ('PLAYER', 'ORGANIZER');
CREATE TYPE "EventType" AS ENUM ('TOURNAMENT', 'CASH_GAME', 'HOME_GAME', 'SIT_AND_GO');
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'LIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE "RegStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- Users
CREATE TABLE "User" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "supabaseId"  TEXT        NOT NULL,
  "email"       TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "handle"      TEXT,
  "city"        TEXT,
  "role"        "Role"      NOT NULL DEFAULT 'PLAYER',
  "bio"         TEXT,
  "avatarUrl"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- PlayerStats
CREATE TABLE "PlayerStats" (
  "id"          TEXT    NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"      TEXT    NOT NULL,
  "tournaments" INTEGER NOT NULL DEFAULT 0,
  "itm"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalPrize"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "roi"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bestFinish"  TEXT,
  CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlayerStats_userId_key" ON "PlayerStats"("userId");
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Venue
CREATE TABLE "Venue" (
  "id"          TEXT    NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT    NOT NULL,
  "city"        TEXT    NOT NULL,
  "district"    TEXT    NOT NULL,
  "address"     TEXT    NOT NULL,
  "whatsapp"    TEXT    NOT NULL,
  "website"     TEXT,
  "openTime"    TEXT    NOT NULL,
  "closeTime"   TEXT    NOT NULL,
  "tableCount"  TEXT    NOT NULL,
  "lat"         DOUBLE PRECISION NOT NULL,
  "lng"         DOUBLE PRECISION NOT NULL,
  "ownerId"     TEXT    NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Event
CREATE TABLE "Event" (
  "id"            TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "name"          TEXT          NOT NULL,
  "type"          "EventType"   NOT NULL,
  "description"   TEXT,
  "buyIn"         DOUBLE PRECISION NOT NULL,
  "maxPlayers"    INTEGER       NOT NULL,
  "startsAt"      TIMESTAMP(3)  NOT NULL,
  "isPrivate"     BOOLEAN       NOT NULL DEFAULT false,
  "isMajor"       BOOLEAN       NOT NULL DEFAULT false,
  "gtd"           DOUBLE PRECISION,
  "startingStack" TEXT,
  "levelDuration" TEXT,
  "rebuyPolicy"   TEXT,
  "venueId"       TEXT,
  "organizerId"   TEXT          NOT NULL,
  "lat"           DOUBLE PRECISION,
  "lng"           DOUBLE PRECISION,
  "locationLabel" TEXT,
  "status"        "EventStatus" NOT NULL DEFAULT 'UPCOMING',
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey"
  FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey"
  FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Registration
CREATE TABLE "Registration" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL,
  "eventId"   TEXT        NOT NULL,
  "status"    "RegStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Registration_userId_eventId_key" ON "Registration"("userId", "eventId");
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DealerRequest
CREATE TABLE "DealerRequest" (
  "id"          TEXT    NOT NULL DEFAULT gen_random_uuid()::text,
  "gameType"    TEXT    NOT NULL,
  "dealerQty"   INTEGER NOT NULL,
  "duration"    TEXT    NOT NULL,
  "address"     TEXT    NOT NULL,
  "district"    TEXT    NOT NULL,
  "city"        TEXT    NOT NULL,
  "venueName"   TEXT,
  "reference"   TEXT,
  "whatsapp"    TEXT    NOT NULL,
  "notes"       TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "protocol"    TEXT    NOT NULL,
  "status"      TEXT    NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealerRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DealerRequest_protocol_key" ON "DealerRequest"("protocol");

-- Auto-update updatedAt for User
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "User_updatedAt" BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER "Event_updatedAt" BEFORE UPDATE ON "Event"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed data: organizer user
INSERT INTO "User" ("id", "supabaseId", "email", "name", "handle", "city", "role", "bio")
VALUES (
  'organizer-001',
  'supabase-organizer-001',
  'contato@kingsclub.com.br',
  'King''s Club',
  'kingsclub',
  'São Paulo',
  'ORGANIZER',
  'O melhor clube de poker de São Paulo desde 2015.'
);

-- Seed data: player user
INSERT INTO "User" ("id", "supabaseId", "email", "name", "handle", "city", "role", "bio")
VALUES (
  'player-001',
  'supabase-player-001',
  'ripperl@findpoker.com.br',
  'Ripper L.',
  'ripperl',
  'São Paulo',
  'PLAYER',
  'Jogador profissional de poker há 8 anos. Especialista em MTTs e PLO.'
);

-- Player stats
INSERT INTO "PlayerStats" ("userId", "tournaments", "itm", "totalPrize", "roi", "bestFinish")
VALUES (
  'player-001', 247, 23.4, 184500, 31.2,
  '1º BSOP São Paulo 2023 — R$ 48.000'
);

-- Venues
INSERT INTO "Venue" ("id","name","city","district","address","whatsapp","website","openTime","closeTime","tableCount","lat","lng","ownerId") VALUES
('venue-001','PokerStars Live SP','São Paulo','Vila Olímpia','R. Funchal, 418 — Vila Olímpia','5511999990001','https://pokerstars.com','14:00','04:00','24',-23.5955,-46.6889,'organizer-001'),
('venue-002','King''s Poker Club','São Paulo','Pinheiros','R. dos Pinheiros, 1200 — Pinheiros','5511999990002','https://kingsclub.com.br','16:00','06:00','18',-23.5616,-46.6858,'organizer-001'),
('venue-003','Red Dragon Casino','São Paulo','Moema','Av. Ibirapuera, 2907 — Moema','5511999990003',NULL,'15:00','05:00','12',-23.6020,-46.6633,'organizer-001'),
('venue-004','Club Poker Paulista','São Paulo','Itaim Bibi','R. Itaim Bibi, 503 — Itaim Bibi','5511999990004',NULL,'18:00','03:00','8',-23.5854,-46.6779,'organizer-001');

-- Events (8 events with varied statuses)
INSERT INTO "Event" ("id","name","type","description","buyIn","maxPlayers","startsAt","isMajor","gtd","startingStack","levelDuration","rebuyPolicy","venueId","organizerId","lat","lng","locationLabel","status") VALUES
(
  'event-001',
  'King''s Friday Night — Main Event',
  'TOURNAMENT',
  'O maior torneio semanal de São Paulo. Stack profundo, estrutura lenta. Re-entry permitido até o nível 8.',
  550, 120, NOW(), true, 50000,
  '30.000 fichas','30 minutos','Re-entry até o nível 8',
  'venue-002','organizer-001',-23.5616,-46.6858,
  'King''s Poker Club — Pinheiros','LIVE'
),
(
  'event-002',
  'Cash NL200 — Mesa Aberta',
  'CASH_GAME',
  'Mesa de cash game No-Limit Hold''em com blinds 1/2. Compra mínima R$200, máxima R$600.',
  200, 9, NOW() + interval '1 hour', false, NULL,
  NULL,NULL,NULL,
  'venue-001','organizer-001',-23.5955,-46.6889,
  'PokerStars Live SP — Vila Olímpia','LIVE'
),
(
  'event-003',
  'BSOP São Paulo — Etapa #4',
  'TOURNAMENT',
  'Etapa do Brazilian Series of Poker em São Paulo. Torneio com estrutura deep stack e garantido R$200.000.',
  1650, 300, NOW() + interval '1 day', true, 200000,
  '50.000 fichas','40 minutos','Um re-entry por nível até o nível 12',
  'venue-001','organizer-001',-23.5955,-46.6889,
  'PokerStars Live SP — Vila Olímpia','UPCOMING'
),
(
  'event-004',
  'Home Game — Quinta Fechada',
  'HOME_GAME',
  'Home game privado para convidados. NLHE com re-entry. Ambiente descontraído.',
  200, 18, NOW() + interval '3 hours', false, NULL,
  NULL,NULL,NULL,
  'venue-004','organizer-001',-23.5854,-46.6779,
  'Club Poker Paulista — Itaim Bibi','UPCOMING'
),
(
  'event-005',
  'Sit & Go Turbo NL100',
  'SIT_AND_GO',
  'Sit & Go turbo para 9 jogadores. Estrutura acelerada, 10 minutos por nível.',
  100, 9, NOW() + interval '2 days', false, NULL,
  NULL,NULL,NULL,
  'venue-003','organizer-001',-23.6020,-46.6633,
  'Red Dragon Casino — Moema','UPCOMING'
),
(
  'event-006',
  'KSOP Santos — Etapa Principal',
  'TOURNAMENT',
  'King''s Series of Poker etapa Santos. Torneio com GTD R$80.000 e estrutura profissional.',
  880, 200, NOW() + interval '5 days', true, 80000,
  '40.000 fichas','35 minutos','Re-entry ilimitado até o nível 10',
  'venue-002','organizer-001',-23.5616,-46.6858,
  'King''s Poker Club — Pinheiros','UPCOMING'
),
(
  'event-007',
  'Cash PLO4 Hi-Lo — Nightly',
  'CASH_GAME',
  'Mesa fixa de Pot-Limit Omaha Hi-Lo, 8 ou melhor. Blinds 2/4, compra R$400-R$1.200.',
  400, 8, NOW() + interval '7 days', false, NULL,
  NULL,NULL,NULL,
  'venue-003','organizer-001',-23.6020,-46.6633,
  'Red Dragon Casino — Moema','UPCOMING'
),
(
  'event-008',
  'WPT Brasil Qualifying — Satélite',
  'TOURNAMENT',
  'Satélite para o WPT Brasil com 3 pacotes garantidos avaliados em R$5.500 cada.',
  330, 60, NOW() + interval '14 days', true, 16500,
  '20.000 fichas','20 minutos','Um re-entry por level até o nível 6',
  'venue-001','organizer-001',-23.5955,-46.6889,
  'PokerStars Live SP — Vila Olímpia','UPCOMING'
);

-- Registrations
INSERT INTO "Registration" ("userId","eventId","status") VALUES
('player-001','event-001','APPROVED'),
('player-001','event-003','APPROVED'),
('player-001','event-006','PENDING'),
('player-001','event-004','PENDING');
