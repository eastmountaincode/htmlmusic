import "server-only";

import { runD1 } from "@/db/d1";

export async function upsertProfile(
  userId: string,
  artistName: string,
  updatedAt = new Date().toISOString(),
) {
  await runD1(
    `INSERT INTO profiles (user_id, artist_name, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       artist_name = excluded.artist_name,
       updated_at = excluded.updated_at`,
    [userId, artistName, updatedAt],
  );
}
