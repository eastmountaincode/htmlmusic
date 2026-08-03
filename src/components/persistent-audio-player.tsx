"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type RefObject,
} from "react";
import { useDiscoverReturnState } from "@/components/discover-return-state";

export type AudioTrack = {
  id: string;
  filename: string;
  artist: string;
  artistId: string;
  src: string;
  artwork?: string;
  duration?: number;
};

type AudioPlayerContextValue = {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTrack: AudioTrack | null;
  currentTime: number;
  duration: number;
  error: string | null;
  isPlaying: boolean;
  pause: () => void;
  playTrack: (track: AudioTrack) => Promise<void>;
  registerQueue: (tracks: AudioTrack[]) => void;
  resume: () => Promise<void>;
  seekTo: (time: number, fastSeek?: boolean) => void;
  stop: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

function updateMediaPosition(audio: HTMLAudioElement) {
  if (!("mediaSession" in navigator)) return;
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

  const position = Math.min(
    Math.max(audio.currentTime, 0),
    audio.duration,
  );

  try {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate || 1,
      position,
    });
  } catch {
    // A browser may expose Media Session without position-state support.
  }
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrackRef = useRef<AudioTrack | null>(null);
  const queueRef = useRef<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const registerQueue = useCallback((tracks: AudioTrack[]) => {
    queueRef.current = tracks;
  }, []);

  const playTrack = useCallback(async (track: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    currentTrackRef.current = track;
    setCurrentTrack(track);

    const resolvedSource = new URL(track.src, window.location.href).href;
    if (audio.currentSrc !== resolvedSource) {
      setCurrentTime(0);
      setDuration(0);
      audio.src = track.src;
      audio.load();
    }

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
      setError("Playback could not start. Try pressing play again.");
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrackRef.current) return;

    setError(null);
    try {
      await audio.play();
    } catch {
      setError("Playback could not start. Try pressing play again.");
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    currentTrackRef.current = null;
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsPlaying(false);
  }, []);

  const playAdjacent = useCallback(
    (direction: -1 | 1) => {
      const queue = queueRef.current;
      if (queue.length === 0) return;

      const currentIndex = queue.findIndex(
        (track) => track.id === currentTrackRef.current?.id,
      );
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + direction + queue.length) % queue.length;

      void playTrack(queue[nextIndex]);
    },
    [playTrack],
  );

  const seekTo = useCallback((time: number, fastSeek = false) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;

    const nextTime = Math.min(Math.max(time, 0), audio.duration);
    if (fastSeek && typeof audio.fastSeek === "function") {
      audio.fastSeek(nextTime);
    } else {
      audio.currentTime = nextTime;
    }
    setCurrentTime(nextTime);
    updateMediaPosition(audio);
  }, []);

  const seekBy = useCallback(
    (offset: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      seekTo(audio.currentTime + offset);
    },
    [seekTo],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setError(null);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      playAdjacent(1);
    };
    const handleError = () => {
      if (!audio.currentSrc) return;
      setIsPlaying(false);
      setError("This audio file could not be loaded.");
    };
    const handlePositionChange = () => {
      setCurrentTime(audio.currentTime);
      setDuration(
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : 0,
      );
      updateMediaPosition(audio);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("durationchange", handlePositionChange);
    audio.addEventListener("loadedmetadata", handlePositionChange);
    audio.addEventListener("ratechange", handlePositionChange);
    audio.addEventListener("seeked", handlePositionChange);
    audio.addEventListener("timeupdate", handlePositionChange);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("durationchange", handlePositionChange);
      audio.removeEventListener("loadedmetadata", handlePositionChange);
      audio.removeEventListener("ratechange", handlePositionChange);
      audio.removeEventListener("seeked", handlePositionChange);
      audio.removeEventListener("timeupdate", handlePositionChange);
    };
  }, [playAdjacent]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const setAction = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Support varies by browser and operating system.
      }
    };

    setAction("play", () => void resume());
    setAction("pause", pause);
    setAction("stop", stop);
    setAction("previoustrack", () => playAdjacent(-1));
    setAction("nexttrack", () => playAdjacent(1));
    setAction("seekbackward", ({ seekOffset }) =>
      seekBy(-(seekOffset ?? 15)),
    );
    setAction("seekforward", ({ seekOffset }) => seekBy(seekOffset ?? 15));
    setAction("seekto", ({ fastSeek, seekTime }) => {
      if (typeof seekTime === "number") seekTo(seekTime, fastSeek);
    });

    return () => {
      setAction("play", null);
      setAction("pause", null);
      setAction("stop", null);
      setAction("previoustrack", null);
      setAction("nexttrack", null);
      setAction("seekbackward", null);
      setAction("seekforward", null);
      setAction("seekto", null);
    };
  }, [pause, playAdjacent, resume, seekBy, seekTo, stop]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!currentTrack) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      try {
        navigator.mediaSession.setPositionState();
      } catch {
        // Position state is optional in Media Session implementations.
      }
      return;
    }

    const artworkSource = currentTrack.artwork ?? "/icon.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      artist: currentTrack.artist,
      artwork: [
        {
          src: new URL(artworkSource, window.location.origin).href,
          sizes: currentTrack.artwork ? "256x256" : "128x128",
        },
      ],
      title: currentTrack.filename,
    });
  }, [currentTrack]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = currentTrack
      ? isPlaying
        ? "playing"
        : "paused"
      : "none";
  }, [currentTrack, isPlaying]);

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      audioRef,
      currentTrack,
      currentTime,
      duration,
      error,
      isPlaying,
      pause,
      playTrack,
      registerQueue,
      resume,
      seekTo,
      stop,
    }),
    [
      currentTrack,
      currentTime,
      duration,
      error,
      isPlaying,
      pause,
      playTrack,
      registerQueue,
      resume,
      seekTo,
      stop,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function PersistentAudioPlayer() {
  const { audioRef, currentTrack, error, stop } = useAudioPlayer();
  const pathname = usePathname();
  const { markRecordingNavigation } = useDiscoverReturnState();

  function handleArtistLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      pathname !== "/" ||
      !currentTrack ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const anchorViewportTop =
      document.getElementById(currentTrack.id)?.getBoundingClientRect().top ??
      null;

    markRecordingNavigation(
      currentTrack.id,
      window.scrollY,
      anchorViewportTop,
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="persistent-audio-player__spacer"
        hidden={!currentTrack}
      />
      <section
        aria-label="Persistent audio player"
        className="persistent-audio-player"
        hidden={!currentTrack}
      >
        <div className="persistent-audio-player__inner">
          <fieldset className="persistent-audio-player__fieldset">
            <div className="persistent-audio-player__row">
              <div className="persistent-audio-player__track">
                <Image
                  alt="[SND]"
                  className={
                    currentTrack?.artwork
                      ? "persistent-audio-player__artwork"
                      : undefined
                  }
                  height={22}
                  src={currentTrack?.artwork ?? "/apache-icons/sound2.gif"}
                  unoptimized
                  width={currentTrack?.artwork ? 22 : 20}
                />
                <span className="persistent-audio-player__metadata">
                  <strong>
                    {currentTrack?.filename ?? "No file selected"}
                  </strong>
                  {currentTrack ? (
                    <span>
                      <Link
                        href={`/artists/${encodeURIComponent(
                          currentTrack.artistId,
                        )}`}
                        onClick={handleArtistLinkClick}
                        prefetch={false}
                      >
                        {currentTrack.artist}
                      </Link>
                    </span>
                  ) : null}
                </span>
              </div>
              {currentTrack ? (
                <HtmlAudioControls
                  className="persistent-audio-player__controls"
                  track={currentTrack}
                />
              ) : null}
              <button
                aria-label="Close audio player"
                className="persistent-audio-player__close"
                onClick={stop}
                title="Close audio player"
                type="button"
              >
                ×
              </button>
            </div>
            {error ? (
              <p className="persistent-audio-player__error" role="status">
                {error}
              </p>
            ) : null}
          </fieldset>
        </div>
      </section>
      <audio
        aria-label={
          currentTrack
            ? `${currentTrack.filename} by ${currentTrack.artist}`
            : "Audio player"
        }
        className="persistent-audio-player__media"
        preload="metadata"
        ref={audioRef}
      />
    </>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function HtmlAudioControls({
  className = "",
  track,
}: {
  className?: string;
  track: AudioTrack;
}) {
  const {
    currentTime,
    currentTrack,
    duration,
    isPlaying,
    pause,
    playTrack,
    resume,
    seekTo,
  } = useAudioPlayer();
  const isCurrent = currentTrack?.id === track.id;
  const displayDuration = isCurrent && duration > 0 ? duration : track.duration ?? 0;
  const displayTime = isCurrent ? currentTime : 0;
  const canSeek = isCurrent && duration > 0;

  const togglePlayback = () => {
    if (!isCurrent) {
      void playTrack(track);
      return;
    }
    if (isPlaying) {
      pause();
      return;
    }
    void resume();
  };

  return (
    <div className={`html-audio-controls ${className}`.trim()}>
      <button
        aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${track.filename}`}
        onClick={togglePlayback}
        type="button"
      >
        {isCurrent && isPlaying ? "pause" : "play"}
      </button>
      <input
        aria-label={`Scrub ${track.filename}`}
        disabled={!canSeek}
        max={displayDuration || 1}
        min="0"
        onChange={(event) => seekTo(Number(event.currentTarget.value))}
        step="0.1"
        type="range"
        value={Math.min(displayTime, displayDuration || 1)}
      />
      <output>
        {formatTime(displayTime)} / {formatTime(displayDuration)}
      </output>
    </div>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  }
  return context;
}
