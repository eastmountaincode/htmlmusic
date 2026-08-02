import "server-only";

import { queryD1, runD1 } from "@/db/d1";

export type StoredRecording = {
  id: string;
  ownerId: string;
  filename: string;
  artist: string;
  audioKey: string;
  audioType: string;
  audioSize: number;
  artworkKey: string | null;
  artworkType: string | null;
  artworkSize: number | null;
  durationSeconds: number | null;
  status: "pending" | "ready";
  createdAt: string;
};

type RecordingRow = {
  id: string;
  owner_id: string;
  filename: string;
  artist: string;
  audio_key: string;
  audio_type: string;
  audio_size: number;
  artwork_key: string | null;
  artwork_type: string | null;
  artwork_size: number | null;
  duration_seconds: number | null;
  status: "pending" | "ready";
  created_at: string;
};

const recordingColumns = `
  recording.id, recording.owner_id, recording.filename,
  profile.artist_name AS artist,
  recording.audio_key, recording.audio_type, recording.audio_size,
  recording.artwork_key, recording.artwork_type, recording.artwork_size,
  recording.duration_seconds, recording.status, recording.created_at
`;

function fromRecordingRow(row: RecordingRow): StoredRecording {
  return {
    id: row.id,
    ownerId: row.owner_id,
    filename: row.filename,
    artist: row.artist,
    audioKey: row.audio_key,
    audioType: row.audio_type,
    audioSize: row.audio_size,
    artworkKey: row.artwork_key,
    artworkType: row.artwork_type,
    artworkSize: row.artwork_size,
    durationSeconds: row.duration_seconds,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createPendingRecording(
  recording: Omit<StoredRecording, "artist">,
) {
  await runD1(
    `INSERT INTO recordings (
       id, owner_id, filename, audio_key, audio_type, audio_size,
       artwork_key, artwork_type, artwork_size, duration_seconds, status, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recording.id,
      recording.ownerId,
      recording.filename,
      recording.audioKey,
      recording.audioType,
      recording.audioSize,
      recording.artworkKey,
      recording.artworkType,
      recording.artworkSize,
      recording.durationSeconds,
      recording.status,
      recording.createdAt,
    ],
  );
}

export async function getOwnedPendingRecording(id: string, ownerId: string) {
  const rows = await queryD1<RecordingRow>(
    `SELECT ${recordingColumns}
     FROM recordings AS recording
     INNER JOIN profiles AS profile ON profile.user_id = recording.owner_id
     WHERE recording.id = ?
       AND recording.owner_id = ?
       AND recording.status = 'pending'
     LIMIT 1`,
    [id, ownerId],
  );

  return rows[0] ? fromRecordingRow(rows[0]) : null;
}

export async function completeOwnedRecording(id: string, ownerId: string) {
  await runD1(
    `UPDATE recordings
     SET status = 'ready'
     WHERE id = ? AND owner_id = ? AND status = 'pending'`,
    [id, ownerId],
  );
}

export async function getPublishedRecording(id: string) {
  const rows = await queryD1<RecordingRow>(
    `SELECT ${recordingColumns}
     FROM recordings AS recording
     INNER JOIN profiles AS profile ON profile.user_id = recording.owner_id
     WHERE recording.id = ? AND recording.status = 'ready'
     LIMIT 1`,
    [id],
  );

  return rows[0] ? fromRecordingRow(rows[0]) : null;
}

export async function listPublishedRecordings(limit = 500) {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const rows = await queryD1<RecordingRow>(
    `SELECT ${recordingColumns}
     FROM recordings AS recording
     INNER JOIN profiles AS profile ON profile.user_id = recording.owner_id
     WHERE recording.status = 'ready'
     ORDER BY recording.created_at DESC, recording.id DESC
     LIMIT ?`,
    [safeLimit],
  );

  return rows.map(fromRecordingRow);
}

export async function publishedRecordingExists(id: string) {
  const rows = await queryD1<{ found: number }>(
    `SELECT 1 AS found
     FROM recordings
     WHERE id = ? AND status = 'ready'
     LIMIT 1`,
    [id],
  );

  return rows.length > 0;
}
