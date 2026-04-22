/** True if event is marked LIVE or current time is within [startsAt, endsAt]. */
export function isEventLive(event: {
  status: string;
  startsAt: Date;
  endsAt: Date | null;
}): boolean {
  if (event.status === "LIVE") return true;
  const now = new Date();
  if (event.endsAt) {
    return now >= new Date(event.startsAt) && now <= new Date(event.endsAt);
  }
  return false;
}
