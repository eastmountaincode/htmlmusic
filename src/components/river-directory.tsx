"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useDiscoverReturnState } from "@/components/discover-return-state";
import {
  HtmlAudioControls,
  useAudioPlayer,
} from "@/components/persistent-audio-player";
import {
  RiverRecordingCells,
  RiverRecordingIcon,
  type RiverSong,
} from "@/components/river-recording-row";
import { RiverComments } from "@/components/river-comments";

function RiverFile({
  isCurrent,
  onOpenPage,
  song,
}: {
  isCurrent: boolean;
  onOpenPage: (trackId: string) => void;
  song: RiverSong;
}) {
  const trackDetailsRef = useRef<HTMLDetailsElement>(null);

  function handlePageLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    onOpenPage(song.id);
  }

  return (
    <li
      aria-current={isCurrent ? "true" : undefined}
      className="river-file"
      id={song.id}
    >
      <details name="river-player" ref={trackDetailsRef}>
        <summary className="river-file__summary">
          <RiverRecordingIcon song={song} />
          <RiverRecordingCells
            {...song}
            onArtistClick={handlePageLinkClick}
          />
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
            onProfileLinkClick={handlePageLinkClick}
            trackDetailsRef={trackDetailsRef}
            trackId={song.id}
          />
        </div>
      </details>
      <Link
        aria-label={`Open page for ${song.filename}`}
        className="river-file__permalink"
        href={`/recordings/${song.id}`}
        onClick={handlePageLinkClick}
        prefetch={false}
        title="Open track page"
      >
        →
      </Link>
    </li>
  );
}

export function RiverDirectory({
  initialNextCursor,
  initialSongs,
}: {
  initialNextCursor: string | null;
  initialSongs: RiverSong[];
}) {
  const { currentTrack, registerQueue } = useAudioPlayer();
  const {
    markRecordingNavigation,
    returnState,
    updateDirectoryState,
  } = useDiscoverReturnState();
  const [songs, setSongs] = useState(
    () => returnState?.songs ?? initialSongs,
  );
  const [nextCursor, setNextCursor] = useState(
    () => returnState?.nextCursor ?? initialNextCursor,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const restoreScrollYRef = useRef(returnState?.scrollY ?? null);
  const restoreAnchorRef = useRef(
    returnState?.anchorTrackId && returnState.anchorViewportTop !== null
      ? {
          trackId: returnState.anchorTrackId,
          viewportTop: returnState.anchorViewportTop,
        }
      : null,
  );

  function rememberRecordingNavigation(trackId: string) {
    const anchorViewportTop =
      document.getElementById(trackId)?.getBoundingClientRect().top ?? null;

    updateDirectoryState(songs, nextCursor);
    markRecordingNavigation(trackId, window.scrollY, anchorViewportTop);
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setLoadMoreError("");

    try {
      const response = await fetch(
        `/api/recordings?cursor=${encodeURIComponent(nextCursor)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        error?: string;
        nextCursor?: string | null;
        songs?: RiverSong[];
      };

      if (!response.ok || !payload.songs || payload.nextCursor === undefined) {
        throw new Error(payload.error ?? "More recordings could not be loaded.");
      }

      const nextSongs = payload.songs;
      const followingCursor = payload.nextCursor;
      setSongs((currentSongs) => [...currentSongs, ...nextSongs]);
      setNextCursor(followingCursor);
    } catch (loadError) {
      setLoadMoreError(
        loadError instanceof Error
          ? loadError.message
          : "More recordings could not be loaded.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    registerQueue(songs);
  }, [registerQueue, songs]);

  useEffect(() => {
    updateDirectoryState(songs, nextCursor);
  }, [nextCursor, songs, updateDirectoryState]);

  useEffect(() => {
    const scrollY = restoreScrollYRef.current;
    if (scrollY === null) return;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const anchor = restoreAnchorRef.current;
        const anchorElement = anchor
          ? document.getElementById(anchor.trackId)
          : null;
        const top = anchor && anchorElement
          ? window.scrollY +
            anchorElement.getBoundingClientRect().top -
            anchor.viewportTop
          : scrollY;

        window.scrollTo({ left: 0, top });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <section aria-label="Newest music" className="directory-index">
      <ol className="river-directory__list" id="discover-recordings">
        {songs.map((song) => {
          const isCurrent = currentTrack?.id === song.id;

          return (
            <RiverFile
              isCurrent={isCurrent}
              key={song.id}
              onOpenPage={rememberRecordingNavigation}
              song={song}
            />
          );
        })}
      </ol>
      {nextCursor ? (
        <p className="river-directory__more">
          <button
            aria-controls="discover-recordings"
            disabled={isLoadingMore}
            onClick={() => void loadMore()}
            type="button"
          >
            {isLoadingMore ? "loading..." : "load more"}
          </button>
        </p>
      ) : null}
      {loadMoreError ? (
        <p className="river-directory__error" role="status">
          {loadMoreError}
        </p>
      ) : null}
    </section>
  );
}
