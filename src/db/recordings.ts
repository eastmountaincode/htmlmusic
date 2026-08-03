import "server-only";

import { queryD1, runD1 } from "@/db/d1";

export type StoredRecording = {
  id: string;
  ownerId: string;
  folderId: string | null;
  folderName: string | null;
  folderAddedAt: string | null;
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
  folder_id: string | null;
  folder_name: string | null;
  folder_added_at: string | null;
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
  recording.id, recording.owner_id, recording.folder_id,
  folder.name AS folder_name, recording.folder_added_at, recording.filename,
  profile.artist_name AS artist,
  recording.audio_key, recording.audio_type, recording.audio_size,
  recording.artwork_key, recording.artwork_type, recording.artwork_size,
  recording.duration_seconds, recording.status, recording.created_at
`;

function fromRecordingRow(row: RecordingRow): StoredRecording {
  return {
    id: row.id,
    ownerId: row.owner_id,
    folderId: row.folder_id,
    folderName: row.folder_name,
    folderAddedAt: row.folder_added_at,
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
       id, owner_id, folder_id, folder_added_at, filename,
       audio_key, audio_type, audio_size,
       artwork_key, artwork_type, artwork_size, duration_seconds, status, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recording.id,
      recording.ownerId,
      recording.folderId,
      recording.folderAddedAt,
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
     LEFT JOIN folders AS folder ON folder.id = recording.folder_id
     WHERE recording.id = ?
       AND recording.owner_id = ?
       AND recording.status = 'pending'
     LIMIT 1`,
    [id, ownerId],
  );

  return rows[0] ? fromRecordingRow(rows[0]) : null;
}

export async function getOwnedRecording(id: string, ownerId: string) {
  const rows = await queryD1<RecordingRow>(
    `SELECT ${recordingColumns}
     FROM recordings AS recording
     INNER JOIN profiles AS profile ON profile.user_id = recording.owner_id
     LEFT JOIN folders AS folder ON folder.id = recording.folder_id
     WHERE recording.id = ? AND recording.owner_id = ?
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
     LEFT JOIN folders AS folder ON folder.id = recording.folder_id
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
     LEFT JOIN folders AS folder ON folder.id = recording.folder_id
     WHERE recording.status = 'ready'
     ORDER BY recording.created_at DESC, recording.id DESC
     LIMIT ?`,
    [safeLimit],
  );

  return rows.map(fromRecordingRow);
}

export async function listPublishedRecordingsByOwner(
  ownerId: string,
  limit = 500,
) {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const rows = await queryD1<RecordingRow>(
    `SELECT ${recordingColumns}
     FROM recordings AS recording
     INNER JOIN profiles AS profile ON profile.user_id = recording.owner_id
     LEFT JOIN folders AS folder ON folder.id = recording.folder_id
     WHERE recording.owner_id = ? AND recording.status = 'ready'
     ORDER BY recording.created_at DESC, recording.id DESC
     LIMIT ?`,
    [ownerId, safeLimit],
  );

  return rows.map(fromRecordingRow);
}

export async function listPublishedLooseRecordings(
  ownerId: string | null = null,
  limit = 500,
) {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const ownerClause = ownerId ? "AND recording.owner_id = ?" : "";
  const params = ownerId ? [ownerId, safeLimit] : [safeLimit];
  const rows = await queryD1<RecordingRow>(
    `SELECT ${recordingColumns}
     FROM recordings AS recording
     INNER JOIN profiles AS profile ON profile.user_id = recording.owner_id
     LEFT JOIN folders AS folder ON folder.id = recording.folder_id
     WHERE recording.status = 'ready'
       AND recording.folder_id IS NULL
       ${ownerClause}
     ORDER BY recording.created_at DESC, recording.id DESC
     LIMIT ?`,
    params,
  );

  return rows.map(fromRecordingRow);
}

export async function listPublishedRecordingsByFolder(
  folderId: string,
  ownerId: string,
  limit = 500,
) {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const rows = await queryD1<RecordingRow>(
    `SELECT ${recordingColumns}
     FROM recordings AS recording
     INNER JOIN profiles AS profile ON profile.user_id = recording.owner_id
     LEFT JOIN folders AS folder ON folder.id = recording.folder_id
     WHERE recording.folder_id = ?
       AND recording.owner_id = ?
       AND recording.status = 'ready'
     ORDER BY recording.created_at DESC, recording.id DESC
     LIMIT ?`,
    [folderId, ownerId, safeLimit],
  );

  return rows.map(fromRecordingRow);
}

export async function updateOwnedRecordingFolder(
  id: string,
  ownerId: string,
  folderId: string | null,
  folderAddedAt: string | null,
) {
  await runD1(
    `UPDATE recordings
     SET folder_id = ?, folder_added_at = ?
     WHERE id = ? AND owner_id = ?`,
    [folderId, folderAddedAt, id, ownerId],
  );
}

export async function deleteOwnedRecording(id: string, ownerId: string) {
  await runD1(
    `DELETE FROM comments
     WHERE track_id = ?
       AND EXISTS (
         SELECT 1 FROM recordings
         WHERE recordings.id = ? AND recordings.owner_id = ?
       )`,
    [id, id, ownerId],
  );
  await runD1(
    `DELETE FROM recordings
     WHERE id = ? AND owner_id = ?`,
    [id, ownerId],
  );
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
