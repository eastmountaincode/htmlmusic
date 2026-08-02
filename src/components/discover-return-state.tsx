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
import type { RiverSong } from "@/components/river-directory";

export type DiscoverReturnState = {
  anchorTrackId: string | null;
  anchorViewportTop: number | null;
  songs: RiverSong[];
  nextCursor: string | null;
  scrollY: number;
};

type DiscoverReturnContextValue = {
  returnState: DiscoverReturnState | null;
  originTrackId: string | null;
  updateDirectoryState: (
    songs: RiverSong[],
    nextCursor: string | null,
  ) => void;
  markRecordingNavigation: (
    trackId: string,
    scrollY: number,
    anchorViewportTop: number | null,
  ) => void;
  consumeReturnState: (trackId: string) => DiscoverReturnState | null;
};

const DiscoverReturnContext =
  createContext<DiscoverReturnContextValue | null>(null);

export function DiscoverReturnProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const returnStateRef = useRef<DiscoverReturnState | null>(null);
  const originTrackIdRef = useRef<string | null>(null);
  const [returnState, setReturnState] =
    useState<DiscoverReturnState | null>(null);
  const [originTrackId, setOriginTrackId] = useState<string | null>(null);

  const updateDirectoryState = useCallback(
    (songs: RiverSong[], nextCursor: string | null) => {
      const nextState = {
        anchorTrackId: returnStateRef.current?.anchorTrackId ?? null,
        anchorViewportTop:
          returnStateRef.current?.anchorViewportTop ?? null,
        songs: [...songs],
        nextCursor,
        scrollY: returnStateRef.current?.scrollY ?? 0,
      };

      returnStateRef.current = nextState;
      setReturnState(nextState);
    },
    [],
  );

  const markRecordingNavigation = useCallback(
    (
      trackId: string,
      scrollY: number,
      anchorViewportTop: number | null,
    ) => {
      const current = returnStateRef.current;

      if (current) {
        const nextState = {
          ...current,
          anchorTrackId: trackId,
          anchorViewportTop:
            anchorViewportTop !== null && Number.isFinite(anchorViewportTop)
              ? anchorViewportTop
              : null,
          scrollY: Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0,
        };
        returnStateRef.current = nextState;
        setReturnState(nextState);
      }

      originTrackIdRef.current = trackId;
      setOriginTrackId(trackId);
    },
    [],
  );

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    if (pathname !== "/" || previousPathname === "/") return;

    returnStateRef.current = null;
    originTrackIdRef.current = null;
    setReturnState(null);
    setOriginTrackId(null);
  }, [pathname]);

  const consumeReturnState = useCallback((trackId: string) => {
    if (originTrackIdRef.current !== trackId) return null;

    originTrackIdRef.current = null;
    setOriginTrackId(null);
    return returnStateRef.current;
  }, []);

  const value = useMemo(
    () => ({
      returnState,
      originTrackId,
      updateDirectoryState,
      markRecordingNavigation,
      consumeReturnState,
    }),
    [
      consumeReturnState,
      markRecordingNavigation,
      originTrackId,
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

export function BackToDiscover({ trackId }: { trackId: string }) {
  const router = useRouter();
  const { consumeReturnState } = useDiscoverReturnState();

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

    if (consumeReturnState(trackId)) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <Link href="/" onClick={handleClick}>
      ← discover
    </Link>
  );
}
