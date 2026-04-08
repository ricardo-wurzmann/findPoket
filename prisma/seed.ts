import { PrismaClient, Role, EventType, EventStatus, RegStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🃏 Seeding FindPoker database...");

  // Clean existing data
  await prisma.registration.deleteMany();
  await prisma.playerStats.deleteMany();
  await prisma.event.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const player = await prisma.user.create({
    data: {
      id: "player-001",
      supabaseId: "supabase-player-001",
      email: "ripperl@findpoker.com.br",
      name: "Ripper L.",
      handle: "ripperl",
      city: "São Paulo",
      role: Role.PLAYER,
      bio: "Jogador profissional de poker há 8 anos. Especialista em MTTs e PLO.",
    },
  });

  const organizer = await prisma.user.create({
    data: {
      id: "organizer-001",
      supabaseId: "supabase-organizer-001",
      email: "contato@kingsclub.com.br",
      name: "King's Club",
      handle: "kingsclub",
      city: "São Paulo",
      role: Role.ORGANIZER,
      bio: "O melhor clube de poker de São Paulo desde 2015.",
    },
  });

  // Player stats
  await prisma.playerStats.create({
    data: {
      userId: player.id,
      tournaments: 247,
      itm: 23.4,
      totalPrize: 184500,
      roi: 31.2,
      bestFinish: "1º BSOP São Paulo 2023 — R$ 48.000",
    },
  });

  // Venues
  const venue1 = await prisma.venue.create({
    data: {
      id: "venue-001",
      name: "PokerStars Live SP",
      city: "São Paulo",
      district: "Vila Olímpia",
      address: "R. Funchal, 418 — Vila Olímpia",
      whatsapp: "5511999990001",
      website: "https://pokerstars.com",
      openTime: "14:00",
      closeTime: "04:00",
      tableCount: "24",
      lat: -23.5955,
      lng: -46.6889,
      ownerId: organizer.id,
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      id: "venue-002",
      name: "King's Poker Club",
      city: "São Paulo",
      district: "Pinheiros",
      address: "R. dos Pinheiros, 1200 — Pinheiros",
      whatsapp: "5511999990002",
      website: "https://kingsclub.com.br",
      openTime: "16:00",
      closeTime: "06:00",
      tableCount: "18",
      lat: -23.5616,
      lng: -46.6858,
      ownerId: organizer.id,
    },
  });

  const venue3 = await prisma.venue.create({
    data: {
      id: "venue-003",
      name: "Red Dragon Casino",
      city: "São Paulo",
      district: "Moema",
      address: "Av. Ibirapuera, 2907 — Moema",
      whatsapp: "5511999990003",
      openTime: "15:00",
      closeTime: "05:00",
      tableCount: "12",
      lat: -23.6020,
      lng: -46.6633,
      ownerId: organizer.id,
    },
  });

  const venue4 = await prisma.venue.create({
    data: {
      id: "venue-004",
      name: "Club Poker Paulista",
      city: "São Paulo",
      district: "Itaim Bibi",
      address: "R. Itaim Bibi, 503 — Itaim Bibi",
      whatsapp: "5511999990004",
      openTime: "18:00",
      closeTime: "03:00",
      tableCount: "8",
      lat: -23.5854,
      lng: -46.6779,
      ownerId: organizer.id,
    },
  });

  // Events
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(19, 0, 0, 0);
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  inTwoDays.setHours(20, 0, 0, 0);
  const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  inFiveDays.setHours(14, 0, 0, 0);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  nextWeek.setHours(12, 0, 0, 0);
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  inTwoWeeks.setHours(13, 0, 0, 0);

  const event1 = await prisma.event.create({
    data: {
      id: "event-001",
      name: "King's Friday Night — Main Event",
      type: EventType.TOURNAMENT,
      description: "O maior torneio semanal de São Paulo. Stack profundo, estrutura lenta. Re-entry permitido até o nível 8.",
      buyIn: 550,
      maxPlayers: 120,
      startsAt: now,
      isMajor: true,
      gtd: 50000,
      startingStack: "30.000 fichas",
      levelDuration: "30 minutos",
      rebuyPolicy: "Re-entry até o nível 8",
      venueId: venue2.id,
      organizerId: organizer.id,
      lat: -23.5616,
      lng: -46.6858,
      locationLabel: "King's Poker Club — Pinheiros",
      status: EventStatus.LIVE,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      id: "event-002",
      name: "Cash NL200 — Mesa Aberta",
      type: EventType.CASH_GAME,
      description: "Mesa de cash game No-Limit Hold'em com blinds 1/2. Compra mínima R$200, máxima R$600.",
      buyIn: 200,
      maxPlayers: 9,
      startsAt: inOneHour,
      venueId: venue1.id,
      organizerId: organizer.id,
      lat: -23.5955,
      lng: -46.6889,
      locationLabel: "PokerStars Live SP — Vila Olímpia",
      status: EventStatus.LIVE,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      id: "event-003",
      name: "BSOP São Paulo — Etapa #4",
      type: EventType.TOURNAMENT,
      description: "Etapa do Brazilian Series of Poker em São Paulo. Torneio com estrutura deep stack e garantido R$200.000.",
      buyIn: 1650,
      maxPlayers: 300,
      startsAt: tomorrow,
      isMajor: true,
      gtd: 200000,
      startingStack: "50.000 fichas",
      levelDuration: "40 minutos",
      rebuyPolicy: "Um re-entry por nível até o nível 12",
      venueId: venue1.id,
      organizerId: organizer.id,
      lat: -23.5955,
      lng: -46.6889,
      locationLabel: "PokerStars Live SP — Vila Olímpia",
      status: EventStatus.UPCOMING,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      id: "event-004",
      name: "Home Game — Quinta Fechada",
      type: EventType.HOME_GAME,
      description: "Home game privado para convidados. NLHE com re-entry. Ambiente descontraído.",
      buyIn: 200,
      maxPlayers: 18,
      startsAt: inThreeHours,
      isPrivate: true,
      venueId: venue4.id,
      organizerId: organizer.id,
      lat: -23.5854,
      lng: -46.6779,
      locationLabel: "Club Poker Paulista — Itaim Bibi",
      status: EventStatus.UPCOMING,
    },
  });

  const event5 = await prisma.event.create({
    data: {
      id: "event-005",
      name: "Sit & Go Turbo NL100",
      type: EventType.SIT_AND_GO,
      description: "Sit & Go turbo para 9 jogadores. Estrutura acelerada, 10 minutos por nível.",
      buyIn: 100,
      maxPlayers: 9,
      startsAt: inTwoDays,
      venueId: venue3.id,
      organizerId: organizer.id,
      lat: -23.6020,
      lng: -46.6633,
      locationLabel: "Red Dragon Casino — Moema",
      status: EventStatus.UPCOMING,
    },
  });

  const event6 = await prisma.event.create({
    data: {
      id: "event-006",
      name: "KSOP Santos — Etapa Principal",
      type: EventType.TOURNAMENT,
      description: "King's Series of Poker etapa Santos. Torneio com GTD R$80.000 e estrutura profissional.",
      buyIn: 880,
      maxPlayers: 200,
      startsAt: inFiveDays,
      isMajor: true,
      gtd: 80000,
      startingStack: "40.000 fichas",
      levelDuration: "35 minutos",
      rebuyPolicy: "Re-entry ilimitado até o nível 10",
      venueId: venue2.id,
      organizerId: organizer.id,
      lat: -23.5616,
      lng: -46.6858,
      locationLabel: "King's Poker Club — Pinheiros",
      status: EventStatus.UPCOMING,
    },
  });

  const event7 = await prisma.event.create({
    data: {
      id: "event-007",
      name: "Cash PLO4 Hi-Lo — Nightly",
      type: EventType.CASH_GAME,
      description: "Mesa fixa de Pot-Limit Omaha Hi-Lo, 8 ou melhor. Blinds 2/4, compra R$400-R$1.200.",
      buyIn: 400,
      maxPlayers: 8,
      startsAt: nextWeek,
      venueId: venue3.id,
      organizerId: organizer.id,
      lat: -23.6020,
      lng: -46.6633,
      locationLabel: "Red Dragon Casino — Moema",
      status: EventStatus.UPCOMING,
    },
  });

  const event8 = await prisma.event.create({
    data: {
      id: "event-008",
      name: "WPT Brasil Qualifying — Satélite",
      type: EventType.TOURNAMENT,
      description: "Satélite para o WPT Brasil com 3 pacotes garantidos avaliados em R$5.500 cada.",
      buyIn: 330,
      maxPlayers: 60,
      startsAt: inTwoWeeks,
      isMajor: true,
      gtd: 16500,
      startingStack: "20.000 fichas",
      levelDuration: "20 minutos",
      rebuyPolicy: "Um re-entry por level até o nível 6",
      venueId: venue1.id,
      organizerId: organizer.id,
      lat: -23.5955,
      lng: -46.6889,
      locationLabel: "PokerStars Live SP — Vila Olímpia",
      status: EventStatus.UPCOMING,
    },
  });

  // Registrations
  await prisma.registration.createMany({
    data: [
      { userId: player.id, eventId: event1.id, status: RegStatus.APPROVED },
      { userId: player.id, eventId: event3.id, status: RegStatus.APPROVED },
      { userId: player.id, eventId: event6.id, status: RegStatus.PENDING },
      { userId: player.id, eventId: event4.id, status: RegStatus.PENDING },
    ],
  });

  // Add some mock registrations to fill up events
  const mockUsers = [];
  for (let i = 1; i <= 10; i++) {
    const u = await prisma.user.create({
      data: {
        id: `mock-user-${i.toString().padStart(3, "0")}`,
        supabaseId: `supabase-mock-${i.toString().padStart(3, "0")}`,
        email: `player${i}@example.com`,
        name: `Jogador ${i}`,
        role: Role.PLAYER,
      },
    });
    mockUsers.push(u);
  }

  const bulkRegistrations = [
    ...mockUsers.slice(0, 8).map((u) => ({
      userId: u.id,
      eventId: event1.id,
      status: RegStatus.APPROVED,
    })),
    ...mockUsers.slice(0, 5).map((u) => ({
      userId: u.id,
      eventId: event3.id,
      status: RegStatus.APPROVED,
    })),
    ...mockUsers.slice(0, 3).map((u) => ({
      userId: u.id,
      eventId: event6.id,
      status: RegStatus.APPROVED,
    })),
    { userId: mockUsers[0].id, eventId: event4.id, status: RegStatus.PENDING },
    { userId: mockUsers[1].id, eventId: event4.id, status: RegStatus.PENDING },
  ];

  await prisma.registration.createMany({ data: bulkRegistrations });

  console.log("✅ Seed complete!");
  console.log(`   Users: 2 main + 10 mock`);
  console.log(`   Venues: 4`);
  console.log(`   Events: 8`);
  console.log(`   Registrations: seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
