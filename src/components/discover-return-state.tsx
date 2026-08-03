"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { RiverEntry } from "@/components/river-recording-row";

export type DiscoverReturnState = {
  anchorEntryId: string | null;
  anchorViewportTop: number | null;
  entries: RiverEntry[];
  nextCursor: string | null;
  scrollY: number;
};

type ArtistTrackOrigin = {
  artistId: string;
  trackId: string;
};

type ArtistFolderOrigin = {
  artistId: string;
  folderId: string;
};

type FolderTrackOrigin = {
  artistId: string;
  folderId: string;
  folderName: string;
  trackId: string;
};

type DiscoverReturnContextValue = {
  artistFolderOrigin: ArtistFolderOrigin | null;
  artistTrackOrigin: ArtistTrackOrigin | null;
  folderTrackOrigin: FolderTrackOrigin | null;
  returnState: DiscoverReturnState | null;
  originEntryId: string | null;
  updateDirectoryState: (
    entries: RiverEntry[],
    nextCursor: string | null,
  ) => void;
  markDirectoryNavigation: (
    entryId: string,
    scrollY: number,
    anchorViewportTop: number | null,
  ) => void;
  markArtistTrackNavigation: (trackId: string, artistId: string) => void;
  markArtistFolderNavigation: (folderId: string, artistId: string) => void;
  markFolderTrackNavigation: (origin: FolderTrackOrigin) => void;
  consumeArtistTrackNavigation: (
    trackId: string,
    artistId: string,
  ) => boolean;
  consumeArtistFolderNavigation: (
    folderId: string,
    artistId: string,
  ) => boolean;
  consumeFolderTrackNavigation: (
    trackId: string,
    folderId: string,
  ) => boolean;
  consumeReturnState: (entryId: string) => DiscoverReturnState | null;
};

const DiscoverReturnContext =
  createContext<DiscoverReturnContextValue | null>(null);

export function DiscoverReturnProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const artistFolderOriginRef = useRef<ArtistFolderOrigin | null>(null);
  const artistTrackOriginRef = useRef<ArtistTrackOrigin | null>(null);
  const folderTrackOriginRef = useRef<FolderTrackOrigin | null>(null);
  const returnStateRef = useRef<DiscoverReturnState | null>(null);
  const originEntryIdRef = useRef<string | null>(null);
  const [artistFolderOrigin, setArtistFolderOrigin] =
    useState<ArtistFolderOrigin | null>(null);
  const [artistTrackOrigin, setArtistTrackOrigin] =
    useState<ArtistTrackOrigin | null>(null);
  const [folderTrackOrigin, setFolderTrackOrigin] =
    useState<FolderTrackOrigin | null>(null);
  const [returnState, setReturnState] =
    useState<DiscoverReturnState | null>(null);
  const [originEntryId, setOriginEntryId] = useState<string | null>(null);

  const updateDirectoryState = useCallback(
    (entries: RiverEntry[], nextCursor: string | null) => {
      const nextState = {
        anchorEntryId: returnStateRef.current?.anchorEntryId ?? null,
        anchorViewportTop:
          returnStateRef.current?.anchorViewportTop ?? null,
        entries: [...entries],
        nextCursor,
        scrollY: returnStateRef.current?.scrollY ?? 0,
      };

      returnStateRef.current = nextState;
      setReturnState(nextState);
    },
    [],
  );

  const markDirectoryNavigation = useCallback(
    (
      entryId: string,
      scrollY: number,
      anchorViewportTop: number | null,
    ) => {
      const current = returnStateRef.current;

      if (current) {
        const nextState = {
          ...current,
          anchorEntryId: entryId,
          anchorViewportTop:
            anchorViewportTop !== null && Number.isFinite(anchorViewportTop)
              ? anchorViewportTop
              : null,
          scrollY: Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0,
        };
        returnStateRef.current = nextState;
        setReturnState(nextState);
      }

      originEntryIdRef.current = entryId;
      setOriginEntryId(entryId);
    },
    [],
  );

  const markArtistTrackNavigation = useCallback(
    (trackId: string, artistId: string) => {
      const nextOrigin = { artistId, trackId };
      artistTrackOriginRef.current = nextOrigin;
      setArtistTrackOrigin(nextOrigin);
    },
    [],
  );

  const markArtistFolderNavigation = useCallback(
    (folderId: string, artistId: string) => {
      const nextOrigin = { artistId, folderId };
      artistFolderOriginRef.current = nextOrigin;
      setArtistFolderOrigin(nextOrigin);
    },
    [],
  );

  const markFolderTrackNavigation = useCallback(
    (origin: FolderTrackOrigin) => {
      folderTrackOriginRef.current = origin;
      setFolderTrackOrigin(origin);
    },
    [],
  );

  const consumeArtistTrackNavigation = useCallback(
    (trackId: string, artistId: string) => {
      const currentOrigin = artistTrackOriginRef.current;

      if (
        currentOrigin?.trackId !== trackId ||
        currentOrigin.artistId !== artistId
      ) {
        return false;
      }

      artistTrackOriginRef.current = null;
      setArtistTrackOrigin(null);
      return true;
    },
    [],
  );

  const consumeArtistFolderNavigation = useCallback(
    (folderId: string, artistId: string) => {
      const currentOrigin = artistFolderOriginRef.current;

      if (
        currentOrigin?.folderId !== folderId ||
        currentOrigin.artistId !== artistId
      ) {
        return false;
      }

      artistFolderOriginRef.current = null;
      setArtistFolderOrigin(null);
      return true;
    },
    [],
  );

  const consumeFolderTrackNavigation = useCallback(
    (trackId: string, folderId: string) => {
      const currentOrigin = folderTrackOriginRef.current;

      if (
        currentOrigin?.trackId !== trackId ||
        currentOrigin.folderId !== folderId
      ) {
        return false;
      }

      folderTrackOriginRef.current = null;
      setFolderTrackOrigin(null);
      return true;
    },
    [],
  );

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    if (pathname !== "/" || previousPathname === "/") return;

    returnStateRef.current = null;
    originEntryIdRef.current = null;
    artistFolderOriginRef.current = null;
    artistTrackOriginRef.current = null;
    folderTrackOriginRef.current = null;
    setReturnState(null);
    setOriginEntryId(null);
    setArtistFolderOrigin(null);
    setArtistTrackOrigin(null);
    setFolderTrackOrigin(null);
  }, [pathname]);

  const consumeReturnState = useCallback((entryId: string) => {
    if (originEntryIdRef.current !== entryId) return null;

    originEntryIdRef.current = null;
    setOriginEntryId(null);
    return returnStateRef.current;
  }, []);

  const value = useMemo(
    () => ({
      artistFolderOrigin,
      artistTrackOrigin,
      folderTrackOrigin,
      returnState,
      originEntryId,
      updateDirectoryState,
      markDirectoryNavigation,
      markArtistTrackNavigation,
      markArtistFolderNavigation,
      markFolderTrackNavigation,
      consumeArtistTrackNavigation,
      consumeArtistFolderNavigation,
      consumeFolderTrackNavigation,
      consumeReturnState,
    }),
    [
      artistFolderOrigin,
      artistTrackOrigin,
      consumeArtistFolderNavigation,
      consumeArtistTrackNavigation,
      consumeFolderTrackNavigation,
      consumeReturnState,
      folderTrackOrigin,
      markArtistFolderNavigation,
      markArtistTrackNavigation,
      markDirectoryNavigation,
      markFolderTrackNavigation,
      originEntryId,
      returnState,
      updateDirectoryState,
    ],
  );

  return (
    <DiscoverReturnContext.Provider value={value}>
      {children}
    </DiscoverReturnContext.Provider>
  );
}

export function useDiscoverReturnState() {
  const context = useContext(DiscoverReturnContext);

  if (!context) {
    throw new Error(
      "useDiscoverReturnState must be used within DiscoverReturnProvider.",
    );
  }

  return context;
}

export function BackToDiscover({ entryId }: { entryId?: string }) {
  const router = useRouter();
  const { consumeReturnState, originEntryId } = useDiscoverReturnState();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
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

    event.preventDefault();

    if (entryId && consumeReturnState(entryId)) {
      router.back();
    } else {
      if (!entryId && originEntryId) consumeReturnState(originEntryId);
      router.push("/");
    }
  }

  return (
    <Link href="/" onClick={handleClick}>
      ← discover
    </Link>
  );
}

export function FolderPageBackLink({
  artistId,
  artistName,
  folderId,
}: {
  artistId: string;
  artistName: string;
  folderId: string;
}) {
  const router = useRouter();
  const {
    artistFolderOrigin,
    consumeArtistFolderNavigation,
  } = useDiscoverReturnState();
  const isFromArtist =
    artistFolderOrigin?.artistId === artistId &&
    artistFolderOrigin.folderId === folderId;

  if (!isFromArtist) {
    return <BackToDiscover entryId={`folder:${folderId}`} />;
  }

  function handleArtistClick(event: MouseEvent<HTMLAnchorElement>) {
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

    event.preventDefault();

    if (consumeArtistFolderNavigation(folderId, artistId)) {
      router.back();
    } else {
      router.push(`/artists/${encodeURIComponent(artistId)}`);
    }
  }

  return (
    <Link
      href={`/artists/${encodeURIComponent(artistId)}`}
      onClick={handleArtistClick}
    >
      ← {artistName}
    </Link>
  );
}

export function RecordingPageBackLink({
  artistId,
  artistName,
  trackId,
}: {
  artistId: string;
  artistName: string;
  trackId: string;
}) {
  const router = useRouter();
  const {
    artistTrackOrigin,
    consumeArtistTrackNavigation,
    consumeFolderTrackNavigation,
    folderTrackOrigin,
  } = useDiscoverReturnState();
  const isFromFolder = folderTrackOrigin?.trackId === trackId;
  const isFromArtist =
    artistTrackOrigin?.artistId === artistId &&
    artistTrackOrigin.trackId === trackId;

  if (!isFromFolder && !isFromArtist) {
    return <BackToDiscover entryId={`track:${trackId}`} />;
  }

  const href = isFromFolder
    ? `/artists/${encodeURIComponent(folderTrackOrigin.artistId)}/folders/${encodeURIComponent(folderTrackOrigin.folderId)}`
    : `/artists/${encodeURIComponent(artistId)}`;
  const label = isFromFolder ? folderTrackOrigin.folderName : artistName;

  function handleOriginClick(event: MouseEvent<HTMLAnchorElement>) {
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

    event.preventDefault();

    const consumed = isFromFolder
      ? consumeFolderTrackNavigation(trackId, folderTrackOrigin.folderId)
      : consumeArtistTrackNavigation(trackId, artistId);

    if (consumed) {
      router.back();
    } else {
      router.push(href);
    }
  }

  return (
    <Link href={href} onClick={handleOriginClick}>
      ← {label}
    </Link>
  );
}
