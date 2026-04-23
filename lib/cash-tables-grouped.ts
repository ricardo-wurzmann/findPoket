import type { CashTable } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type GroupedVenueTables = {
  venue: { id: string; name: string; district: string; city: string };
  tables: CashTable[];
};

export async function fetchGroupedActiveCashTables(): Promise<GroupedVenueTables[]> {
  const rows = await prisma.cashTable.findMany({
    where: { isActive: true },
    include: {
      venue: { select: { id: true, name: true, district: true, city: true } },
    },
    orderBy: [{ venue: { name: "asc" } }, { name: "asc" }],
  });

  const map = new Map<string, GroupedVenueTables>();
  for (const t of rows) {
    const vid = t.venue.id;
    if (!map.has(vid)) {
      map.set(vid, {
        venue: { id: t.venue.id, name: t.venue.name, district: t.venue.district, city: t.venue.city },
        tables: [],
      });
    }
    const { venue: _venue, ...table } = t;
    map.get(vid)!.tables.push(table);
  }
  return Array.from(map.values());
}
