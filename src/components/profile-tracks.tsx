"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import {
  HtmlAudioControls,
  useAudioPlayer,
} from "@/components/persistent-audio-player";
import { RiverComments } from "@/components/river-comments";
import { RiverFile } from "@/components/river-directory";
import { useDiscoverReturnState } from "@/components/discover-return-state";
import {
  RiverRecordingCells,
  RiverRecordingIcon,
  type RiverSong,
} from "@/components/river-recording-row";

function ProfileTrack({
  folders,
  isCurrent,
  isDeleting,
  isMoving,
  onDelete,
  onMoveFolder,
  song,
}: {
  folders?: { id: string; name: string }[];
  isCurrent: boolean;
  isDeleting: boolean;
  isMoving?: boolean;
  onDelete?: (song: RiverSong) => void;
  onMoveFolder?: (song: RiverSong, folderId: string | null) => void;
  song: RiverSong;
}) {
  const trackDetailsRef = useRef<HTMLDetailsElement>(null);

  function keepDetailsOpen(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
  }

  function moveFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const formData = new FormData(event.currentTarget);
    const folderId = String(formData.get("folderId") ?? "").trim() || null;
    onMoveFolder?.(song, folderId);
  }

  return (
    <li
      aria-current={isCurrent ? "true" : undefined}
      className="river-file profile-track"
    >
      <details name="profile-player" ref={trackDetailsRef}>
        <summary className="river-file__summary river-file__summary--with-actions">
          <RiverRecordingIcon song={song} />
          <RiverRecordingCells {...song} />
          <span className="profile-track__actions">
            <Link
              aria-label={`Open page for ${song.filename}`}
              className="river-file__permalink"
              href={`/recordings/${song.id}`}
              onClick={keepDetailsOpen}
              prefetch={false}
              title="Open track page"
            >
              →
            </Link>
            {onDelete ? (
              <button
                aria-label={`Delete ${song.filename}`}
                disabled={isDeleting}
                onClick={(event) => {
                  keepDetailsOpen(event);
                  onDelete(song);
                }}
                type="button"
              >
                {isDeleting ? "deleting..." : "delete"}
              </button>
            ) : null}
          </span>
        </summary>
        <div
          className={`river-file__player${
            song.artwork ? " river-file__player--with-artwork" : ""
          }`}
        >
          {song.artwork ? (
            <Image
              alt=""
              className="river-file__artwork"
              height={96}
              src={song.artwork}
              unoptimized
              width={96}
            />
          ) : null}
          <HtmlAudioControls track={song} />
          <RiverComments
            trackDetailsRef={trackDetailsRef}
            trackId={song.id}
          />
          {onMoveFolder ? (
            <form className="profile-track__folder" onSubmit={moveFolder}>
              <label htmlFor={`track-folder-${song.id}`}>folder</label>
              <select
                defaultValue={song.folderId ?? ""}
                disabled={isMoving}
                id={`track-folder-${song.id}`}
                name="folderId"
              >
                <option value="">no folder</option>
                {folders?.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <button aria-busy={isMoving} disabled={isMoving} type="submit">
                {isMoving ? "saving..." : "save"}
              </button>
            </form>
          ) : null}
        </div>
      </details>
    </li>
  );
}

export function ProfileTracks({
  allowDelete = false,
  allowFolderManagement = false,
  folders = [],
  folderOrigin,
  initialTracks,
  legend = "tracks",
}: {
  allowDelete?: boolean;
  allowFolderManagement?: boolean;
  folders?: { id: string; name: string }[];
  folderOrigin?: { id: string; name: string; artistId: string };
  initialTracks: RiverSong[];
  legend?: string;
}) {
  const { currentTrack, registerQueue, stop } = useAudioPlayer();
  const {
    markArtistTrackNavigation,
    markFolderTrackNavigation,
  } = useDiscoverReturnState();
  const [tracks, setTracks] = useState(initialTracks);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    registerQueue(tracks);
  }, [registerQueue, tracks]);

  async function deleteTrack(song: RiverSong) {
    if (!allowDelete || deletingId) return;
    if (!window.confirm(`Delete “${song.filename}”? This cannot be undone.`)) {
      return;
    }

    setDeletingId(song.id);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/recordings/${encodeURIComponent(song.id)}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { error?: string; id?: string };

      if (!response.ok || payload.id !== song.id) {
        throw new Error(payload.error ?? "The track could not be deleted.");
      }

      if (currentTrack?.id === song.id) stop();
      setTracks((currentTracks) =>
        currentTracks.filter((track) => track.id !== song.id),
      );
    } catch (deleteError) {
      setErrorMessage(
        deleteError instanceof Error
          ? deleteError.message
          : "The track could not be deleted.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function moveTrack(song: RiverSong, folderId: string | null) {
    if (!allowFolderManagement || movingId) return;

    setMovingId(song.id);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/recordings/${encodeURIComponent(song.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId }),
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        folderId?: string | null;
        folderName?: string | null;
        id?: string;
      };

      if (!response.ok || payload.id !== song.id) {
        throw new Error(payload.error ?? "The track could not be updated.");
      }

      setTracks((currentTracks) =>
        currentTracks.map((track) =>
          track.id === song.id
            ? {
                ...track,
                folderId: payload.folderId ?? null,
                folderName: payload.folderName ?? null,
              }
            : track,
        ),
      );
    } catch (moveError) {
      setErrorMessage(
        moveError instanceof Error
          ? moveError.message
          : "The track could not be updated.",
      );
    } finally {
      setMovingId(null);
    }
  }

  return (
    <fieldset className="plain-fieldset profile-tracks">
      <legend>{legend}</legend>
      {tracks.length > 0 ? (
        <ol className="river-directory__list">
          {tracks.map((song) => (
            allowDelete ? (
              <ProfileTrack
                folders={folders}
                isCurrent={currentTrack?.id === song.id}
                isDeleting={deletingId === song.id}
                isMoving={movingId === song.id}
                key={song.id}
                onDelete={(track) => void deleteTrack(track)}
                onMoveFolder={
                  allowFolderManagement
                    ? (track, folderId) => void moveTrack(track, folderId)
                    : undefined
                }
                song={song}
              />
            ) : (
              <RiverFile
                isCurrent={currentTrack?.id === song.id}
                key={song.id}
                onOpenTrackPage={(trackId) =>
                  folderOrigin
                    ? markFolderTrackNavigation({
                        artistId: folderOrigin.artistId,
                        folderId: folderOrigin.id,
                        folderName: folderOrigin.name,
                        trackId,
                      })
                    : markArtistTrackNavigation(trackId, song.artistId)
                }
                song={song}
              />
            )
          ))}
        </ol>
      ) : (
        <p className="profile-tracks__empty">no tracks uploaded</p>
      )}
      {errorMessage ? (
        <p className="profile-tracks__error" role="status">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
