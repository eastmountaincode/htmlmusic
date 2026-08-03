import "server-only";

import { queryD1, runD1 } from "@/db/d1";

export type ArtistProfile = {
  userId: string;
  artistName: string;
};

type ProfileRow = {
  user_id: string;
  artist_name: string;
};

export async function getArtistProfile(
  userId: string,
): Promise<ArtistProfile | null> {
  const rows = await queryD1<ProfileRow>(
    `SELECT user_id, artist_name
     FROM profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );
  const profile = rows[0];

  return profile
    ? {
        userId: profile.user_id,
        artistName: profile.artist_name,
      }
    : null;
}

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
