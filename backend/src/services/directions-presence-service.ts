import { pool } from '../db/pool';

export const DIRECTIONS_PRESENCE_TTL_SECONDS = 45;

function uniqueToiletIds(toiletIds: string[]) {
  return Array.from(new Set(toiletIds.map((id) => id.trim()).filter(Boolean)));
}

export async function getActiveDirectionCounts(toiletIds: string[]) {
  const ids = uniqueToiletIds(toiletIds).slice(0, 100);
  if (ids.length === 0) return {};

  const result = await pool.query<{ toilet_id: string; count: number }>(
    `
      SELECT toilet_id, COUNT(*)::int AS count
      FROM public.toilet_direction_presence
      WHERE toilet_id = ANY($1::varchar[])
        AND last_seen_at > CURRENT_TIMESTAMP - ($2 * INTERVAL '1 second')
      GROUP BY toilet_id;
    `,
    [ids, DIRECTIONS_PRESENCE_TTL_SECONDS]
  );

  return Object.fromEntries(result.rows.map((row) => [row.toilet_id, row.count]));
}

export async function touchDirectionPresence(toiletId: string, visitorId: string) {
  await pool.query(
    `
      INSERT INTO public.toilet_direction_presence (toilet_id, visitor_id, last_seen_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (toilet_id, visitor_id)
      DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP;
    `,
    [toiletId, visitorId]
  );

  const counts = await getActiveDirectionCounts([toiletId]);
  return counts[toiletId] ?? 0;
}

export async function removeDirectionPresence(toiletId: string, visitorId: string) {
  await pool.query(
    `DELETE FROM public.toilet_direction_presence WHERE toilet_id = $1 AND visitor_id = $2;`,
    [toiletId, visitorId]
  );

  const counts = await getActiveDirectionCounts([toiletId]);
  return counts[toiletId] ?? 0;
}
