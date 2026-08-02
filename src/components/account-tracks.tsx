"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HtmlAudioControls,
  useAudioPlayer,
} from "@/components/persistent-audio-player";
import {
  RiverRecordingCells,
  RiverRecordingIcon,
  type RiverSong,
} from "@/components/river-recording-row";

function AccountTrack({
  isCurrent,
  isDeleting,
  onDelete,
  song,
}: {
  isCurrent: boolean;
  isDeleting: boolean;
  onDelete: (song: RiverSong) => void;
  song: RiverSong;
}) {
  return (
    <li
      aria-current={isCurrent ? "true" : undefined}
      className="river-file account-track"
    >
      <details name="account-player">
        <summary className="river-file__summary">
          <RiverRecordingIcon song={song} />
          <RiverRecordingCells {...song} />
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
        </div>
      </details>
      <span className="account-track__actions">
        <Link
          aria-label={`Open page for ${song.filename}`}
          className="river-file__permalink"
          href={`/recordings/${song.id}`}
          prefetch={false}
          title="Open track page"
        >
          →
        </Link>
        <button
          aria-label={`Delete ${song.filename}`}
          disabled={isDeleting}
          onClick={() => onDelete(song)}
          type="button"
        >
          {isDeleting ? "deleting..." : "delete"}
        </button>
      </span>
    </li>
  );
}

export function AccountTracks({ initialTracks }: { initialTracks: RiverSong[] }) {
  const { currentTrack, registerQueue, stop } = useAudioPlayer();
  const [tracks, setTracks] = useState(initialTracks);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    registerQueue(tracks);
  }, [registerQueue, tracks]);

  async function deleteTrack(song: RiverSong) {
    if (deletingId) return;
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
    <fieldset className="plain-fieldset account-tracks">
      <legend>tracks</legend>
      {tracks.length > 0 ? (
        <ol className="river-directory__list">
          {tracks.map((song) => (
            <AccountTrack
              isCurrent={currentTrack?.id === song.id}
              isDeleting={deletingId === song.id}
              key={song.id}
              onDelete={(track) => void deleteTrack(track)}
              song={song}
            />
          ))}
        </ol>
      ) : (
        <p className="account-tracks__empty">no tracks uploaded</p>
      )}
      {errorMessage ? (
        <p className="account-tracks__error" role="status">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
