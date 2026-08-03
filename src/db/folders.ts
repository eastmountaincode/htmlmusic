import "server-only";

import { queryD1, runD1 } from "@/db/d1";

export type StoredFolder = {
  id: string;
  ownerId: string;
  artist: string;
  name: string;
  trackCount: number;
  activityAt: string | null;
  createdAt: string;
};

type FolderRow = {
  id: string;
  owner_id: string;
  artist: string;
  name: string;
  track_count: number;
  activity_at: string | null;
  created_at: string;
};

const folderColumns = `
  folder.id, folder.owner_id, profile.artist_name AS artist,
  folder.name, folder.created_at,
  COUNT(recording.id) AS track_count,
  MAX(COALESCE(recording.folder_added_at, recording.created_at)) AS activity_at
`;

function fromFolderRow(row: FolderRow): StoredFolder {
  return {
    id: row.id,
    ownerId: row.owner_id,
    artist: row.artist,
    name: row.name,
    trackCount: Number(row.track_count),
    activityAt: row.activity_at,
    createdAt: row.created_at,
  };
}

export async function createFolder(folder: {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}) {
  await runD1(
    `INSERT INTO folders (id, owner_id, name, created_at)
     VALUES (?, ?, ?, ?)`,
    [folder.id, folder.ownerId, folder.name, folder.createdAt],
  );
}

export async function getOwnedFolder(id: string, ownerId: string) {
  const rows = await queryD1<FolderRow>(
    `SELECT ${folderColumns}
     FROM folders AS folder
     INNER JOIN profiles AS profile ON profile.user_id = folder.owner_id
     LEFT JOIN recordings AS recording
       ON recording.folder_id = folder.id AND recording.status = 'ready'
     WHERE folder.id = ? AND folder.owner_id = ?
     GROUP BY folder.id
     LIMIT 1`,
    [id, ownerId],
  );

  return rows[0] ? fromFolderRow(rows[0]) : null;
}

export async function getPublishedFolder(id: string, ownerId: string) {
  const folder = await getOwnedFolder(id, ownerId);
  return folder?.trackCount ? folder : null;
}

export async function listOwnedFolders(ownerId: string, limit = 500) {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const rows = await queryD1<FolderRow>(
    `SELECT ${folderColumns}
     FROM folders AS folder
     INNER JOIN profiles AS profile ON profile.user_id = folder.owner_id
     LEFT JOIN recordings AS recording
       ON recording.folder_id = folder.id AND recording.status = 'ready'
     WHERE folder.owner_id = ?
     GROUP BY folder.id
     ORDER BY folder.name COLLATE NOCASE, folder.id
     LIMIT ?`,
    [ownerId, safeLimit],
  );

  return rows.map(fromFolderRow);
}

export async function listPublishedFolders(
  ownerId: string | null = null,
  limit = 500,
) {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const ownerClause = ownerId ? "AND folder.owner_id = ?" : "";
  const params = ownerId ? [ownerId, safeLimit] : [safeLimit];
  const rows = await queryD1<FolderRow>(
    `SELECT ${folderColumns}
     FROM folders AS folder
     INNER JOIN profiles AS profile ON profile.user_id = folder.owner_id
     INNER JOIN recordings AS recording
       ON recording.folder_id = folder.id AND recording.status = 'ready'
     WHERE 1 = 1 ${ownerClause}
     GROUP BY folder.id
     ORDER BY activity_at DESC, folder.id DESC
     LIMIT ?`,
    params,
  );

  return rows.map(fromFolderRow);
}

export async function updateOwnedFolderName(
  id: string,
  ownerId: string,
  name: string,
) {
  await runD1(
    `UPDATE folders
     SET name = ?
     WHERE id = ? AND owner_id = ?`,
    [name, id, ownerId],
  );
}

export async function deleteOwnedFolder(id: string, ownerId: string) {
  await runD1(
    `UPDATE recordings
     SET folder_id = NULL, folder_added_at = NULL
     WHERE folder_id = ? AND owner_id = ?`,
    [id, ownerId],
  );
  await runD1(
    `DELETE FROM folders
     WHERE id = ? AND owner_id = ?`,
    [id, ownerId],
  );
}
