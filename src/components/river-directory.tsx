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
import { RiverFolderFile } from "@/components/river-folder-row";
import {
  HtmlAudioControls,
  useAudioPlayer,
} from "@/components/persistent-audio-player";
import {
  riverEntryId,
  type RiverEntry,
  RiverRecordingCells,
  RiverRecordingIcon,
  type RiverSong,
} from "@/components/river-recording-row";
import { RiverComments } from "@/components/river-comments";

export function RiverFile({
  isCurrent,
  onOpenPage,
  onOpenTrackPage,
  song,
}: {
  isCurrent: boolean;
  onOpenPage?: (trackId: string) => void;
  onOpenTrackPage?: (trackId: string) => void;
  song: RiverSong;
}) {
  const trackDetailsRef = useRef<HTMLDetailsElement>(null);

  function handlePageLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();

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

    onOpenPage?.(song.id);
  }

  function handleTrackPageLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    handlePageLinkClick(event);

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

    onOpenTrackPage?.(song.id);
  }

  return (
    <li
      aria-current={isCurrent ? "true" : undefined}
      className="river-file"
      id={`track:${song.id}`}
    >
      <details name="river-player" ref={trackDetailsRef}>
        <summary className="river-file__summary river-file__summary--with-permalink">
          <RiverRecordingIcon song={song} />
          <RiverRecordingCells
            {...song}
            onArtistClick={handlePageLinkClick}
          />
          <Link
            aria-label={`Open page for ${song.filename}`}
            className="river-file__permalink"
            href={`/recordings/${song.id}`}
            onClick={handleTrackPageLinkClick}
            prefetch={false}
            title="Open track page"
          >
            →
          </Link>
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
    </li>
  );
}

export function RiverDirectory({
  initialNextCursor,
  initialEntries,
}: {
  initialNextCursor: string | null;
  initialEntries: RiverEntry[];
}) {
  const { currentTrack, registerQueue } = useAudioPlayer();
  const {
    markDirectoryNavigation,
    returnState,
    updateDirectoryState,
  } = useDiscoverReturnState();
  const [entries, setEntries] = useState(
    () => returnState?.entries ?? initialEntries,
  );
  const [nextCursor, setNextCursor] = useState(
    () => returnState?.nextCursor ?? initialNextCursor,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const restoreScrollYRef = useRef(returnState?.scrollY ?? null);
  const restoreAnchorRef = useRef(
    returnState?.anchorEntryId && returnState.anchorViewportTop !== null
      ? {
          entryId: returnState.anchorEntryId,
          viewportTop: returnState.anchorViewportTop,
        }
      : null,
  );

  function rememberDirectoryNavigation(entryId: string) {
    const anchorViewportTop =
      document.getElementById(entryId)?.getBoundingClientRect().top ?? null;

    updateDirectoryState(entries, nextCursor);
    markDirectoryNavigation(entryId, window.scrollY, anchorViewportTop);
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
        entries?: RiverEntry[];
      };

      if (!response.ok || !payload.entries || payload.nextCursor === undefined) {
        throw new Error(payload.error ?? "More recordings could not be loaded.");
      }

      const nextEntries = payload.entries;
      const followingCursor = payload.nextCursor;
      setEntries((currentEntries) => [...currentEntries, ...nextEntries]);
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
    registerQueue(
      entries.flatMap((entry) =>
        entry.kind === "track" ? [entry.song] : [],
      ),
    );
  }, [entries, registerQueue]);

  useEffect(() => {
    updateDirectoryState(entries, nextCursor);
  }, [entries, nextCursor, updateDirectoryState]);

  useEffect(() => {
    const scrollY = restoreScrollYRef.current;
    if (scrollY === null) return;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const anchor = restoreAnchorRef.current;
        const anchorElement = anchor
          ? document.getElementById(anchor.entryId)
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
        {entries.map((entry) => {
          if (entry.kind === "folder") {
            return (
              <RiverFolderFile
                folder={entry.folder}
                key={riverEntryId(entry)}
                onOpenPage={rememberDirectoryNavigation}
              />
            );
          }

          const { song } = entry;
          return (
            <RiverFile
              isCurrent={currentTrack?.id === song.id}
              key={riverEntryId(entry)}
              onOpenPage={(trackId) =>
                rememberDirectoryNavigation(`track:${trackId}`)
              }
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
