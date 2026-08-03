import "server-only";

import type {
  RiverEntry,
  RiverFolder,
  RiverSong,
} from "@/components/river-recording-row";
import { listPublishedFolders, type StoredFolder } from "@/db/folders";
import {
  getPublishedRecording,
  listPublishedRecordingsByOwner,
  listPublishedLooseRecordings,
  listPublishedRecordingsByFolder,
  publishedRecordingExists,
  type StoredRecording,
} from "@/db/recordings";

export const RIVER_PAGE_SIZE = 35;

function formatDuration(durationSeconds: number | null) {
  if (!durationSeconds || !Number.isFinite(durationSeconds)) return "--:--";

  const wholeSeconds = Math.max(0, Math.round(durationSeconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPosted(createdAt: string) {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000),
  );

  if (elapsedSeconds < 60) return "just now";

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function storedRecordingToRiverSong(
  recording: StoredRecording,
): RiverSong {
  return {
    id: recording.id,
    filename: recording.filename,
    artist: recording.artist,
    artistId: recording.ownerId,
    folderId: recording.folderId,
    folderName: recording.folderName,
    src: `/api/media/${encodeURIComponent(recording.id)}/audio`,
    artwork: recording.artworkKey
      ? `/api/media/${encodeURIComponent(recording.id)}/artwork`
      : undefined,
    duration: recording.durationSeconds ?? undefined,
    length: formatDuration(recording.durationSeconds),
    posted: formatPosted(recording.createdAt),
    postedAt: recording.createdAt,
  };
}

export function storedFolderToRiverFolder(folder: StoredFolder): RiverFolder {
  const activityAt = folder.activityAt ?? folder.createdAt;

  return {
    id: folder.id,
    name: folder.name,
    artist: folder.artist,
    artistId: folder.ownerId,
    trackCount: folder.trackCount,
    posted: formatPosted(activityAt),
    postedAt: activityAt,
  };
}

export async function getRiverSong(id: string) {
  const recording = await getPublishedRecording(id);
  return recording ? storedRecordingToRiverSong(recording) : null;
}

export async function isKnownRiverTrack(id: string) {
  return publishedRecordingExists(id);
}

export async function getArtistRiverSongs(ownerId: string) {
  return (await listPublishedRecordingsByOwner(ownerId)).map(
    storedRecordingToRiverSong,
  );
}

export async function getFolderRiverSongs(folderId: string, ownerId: string) {
  return (await listPublishedRecordingsByFolder(folderId, ownerId)).map(
    storedRecordingToRiverSong,
  );
}

export async function getArtistRiverEntries(ownerId: string) {
  return getAllRiverEntries(ownerId);
}

async function getAllRiverEntries(ownerId: string | null = null) {
  const [recordings, folders] = await Promise.all([
    listPublishedLooseRecordings(ownerId),
    listPublishedFolders(ownerId),
  ]);
  const entries: RiverEntry[] = [
    ...recordings.map(
      (recording): RiverEntry => ({
        kind: "track",
        song: storedRecordingToRiverSong(recording),
      }),
    ),
    ...folders.map(
      (folder): RiverEntry => ({
        kind: "folder",
        folder: storedFolderToRiverFolder(folder),
      }),
    ),
  ];

  return entries.sort((left, right) => {
    const leftDate =
      left.kind === "track" ? left.song.postedAt : left.folder.postedAt;
    const rightDate =
      right.kind === "track" ? right.song.postedAt : right.folder.postedAt;
    const dateOrder = rightDate.localeCompare(leftDate);

    if (dateOrder !== 0) return dateOrder;

    const leftId = left.kind === "track" ? left.song.id : left.folder.id;
    const rightId = right.kind === "track" ? right.song.id : right.folder.id;
    return rightId.localeCompare(leftId);
  });
}

export async function getRiverPage(cursor: string | null) {
  const entries = await getAllRiverEntries();
  const cursorIndex = cursor
    ? entries.findIndex((entry) => {
        const id = entry.kind === "track" ? entry.song.id : entry.folder.id;
        return `${entry.kind}:${id}` === cursor;
      })
    : -1;

  if (cursor && cursorIndex === -1) return null;

  const startIndex = cursorIndex + 1;
  const pageEntries = entries.slice(startIndex, startIndex + RIVER_PAGE_SIZE);
  const lastEntry = pageEntries.at(-1);
  const hasMore = startIndex + pageEntries.length < entries.length;
  const nextCursor = lastEntry
    ? `${lastEntry.kind}:${
        lastEntry.kind === "track" ? lastEntry.song.id : lastEntry.folder.id
      }`
    : null;

  return {
    entries: pageEntries,
    nextCursor: hasMore ? nextCursor : null,
  };
}
