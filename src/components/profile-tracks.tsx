"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
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
  isCurrent,
  isDeleting,
  onDelete,
  song,
}: {
  isCurrent: boolean;
  isDeleting: boolean;
  onDelete?: (song: RiverSong) => void;
  song: RiverSong;
}) {
  const trackDetailsRef = useRef<HTMLDetailsElement>(null);

  function keepDetailsOpen(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
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
        </div>
      </details>
    </li>
  );
}

export function ProfileTracks({
  allowDelete = false,
  initialTracks,
  legend = "tracks",
}: {
  allowDelete?: boolean;
  initialTracks: RiverSong[];
  legend?: string;
}) {
  const { currentTrack, registerQueue, stop } = useAudioPlayer();
  const { markArtistTrackNavigation } = useDiscoverReturnState();
  const [tracks, setTracks] = useState(initialTracks);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  return (
    <fieldset className="plain-fieldset profile-tracks">
      <legend>{legend}</legend>
      {tracks.length > 0 ? (
        <ol className="river-directory__list">
          {tracks.map((song) => (
            allowDelete ? (
              <ProfileTrack
                isCurrent={currentTrack?.id === song.id}
                isDeleting={deletingId === song.id}
                key={song.id}
                onDelete={(track) => void deleteTrack(track)}
                song={song}
              />
            ) : (
              <RiverFile
                isCurrent={currentTrack?.id === song.id}
                key={song.id}
                onOpenTrackPage={(trackId) =>
                  markArtistTrackNavigation(trackId, song.artistId)
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
