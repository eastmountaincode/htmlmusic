import "server-only";

import type { RiverSong } from "@/components/river-recording-row";
import {
  getPublishedRecording,
  listOwnedPublishedRecordings,
  listPublishedRecordings,
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

export async function getRiverSong(id: string) {
  const recording = await getPublishedRecording(id);
  return recording ? storedRecordingToRiverSong(recording) : null;
}

export async function isKnownRiverTrack(id: string) {
  return publishedRecordingExists(id);
}

export async function getOwnedRiverSongs(ownerId: string) {
  return (await listOwnedPublishedRecordings(ownerId)).map(
    storedRecordingToRiverSong,
  );
}

async function getAllRiverSongs() {
  return (await listPublishedRecordings()).map(storedRecordingToRiverSong);
}

export async function getRiverPage(cursor: string | null) {
  const riverSongs = await getAllRiverSongs();
  const cursorIndex = cursor
    ? riverSongs.findIndex((song) => song.id === cursor)
    : -1;

  if (cursor && cursorIndex === -1) return null;

  const startIndex = cursorIndex + 1;
  const songs = riverSongs.slice(startIndex, startIndex + RIVER_PAGE_SIZE);
  const lastSong = songs.at(-1);
  const hasMore = startIndex + songs.length < riverSongs.length;

  return {
    nextCursor: hasMore && lastSong ? lastSong.id : null,
    songs,
  };
}
