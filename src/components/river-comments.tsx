"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import type { RiverComment } from "@/db/comments";

type LoadStatus = "idle" | "loading" | "loaded" | "error";

async function readJsonResponse<T>(response: Response) {
  const responseText = await response.text();

  if (!responseText) return null;

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return null;
  }
}

async function requestComments(trackId: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/comments?trackId=${encodeURIComponent(trackId)}`,
    { cache: "no-store", signal },
  );
  const payload = await readJsonResponse<{
    comments?: RiverComment[];
    error?: string;
  }>(response);

  if (!response.ok || !payload?.comments) {
    throw new Error(payload?.error ?? "Comments could not be loaded.");
  }

  return payload.comments;
}

function formatCommentTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RiverComments({
  loadImmediately = false,
  trackDetailsRef,
  trackId,
}: {
  loadImmediately?: boolean;
  trackDetailsRef?: RefObject<HTMLDetailsElement | null>;
  trackId: string;
}) {
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const isLoadingRef = useRef(false);
  const [body, setBody] = useState("");
  const [comments, setComments] = useState<RiverComment[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(() =>
    loadImmediately ? "loading" : "idle",
  );

  const loadComments = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoadStatus("loading");
    setError("");

    try {
      const nextComments = await requestComments(trackId);
      setComments(nextComments);
      setLoadStatus("loaded");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Comments could not be loaded.",
      );
      setLoadStatus("error");
    } finally {
      isLoadingRef.current = false;
    }
  }, [trackId]);

  useEffect(() => {
    if (!loadImmediately || loadStatus !== "loading") return;

    const controller = new AbortController();

    void requestComments(trackId, controller.signal)
      .then((nextComments) => {
        setComments(nextComments);
        setLoadStatus("loaded");
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Comments could not be loaded.",
        );
        setLoadStatus("error");
      });

    return () => controller.abort();
  }, [loadImmediately, loadStatus, trackId]);

  useEffect(() => {
    if (!trackDetailsRef) return;

    const trackDetails = trackDetailsRef.current;
    if (!trackDetails) return;

    function handleTrackToggle() {
      if (
        trackDetails?.open &&
        (loadStatus === "idle" || loadStatus === "error")
      ) {
        void loadComments();
      }
    }

    trackDetails.addEventListener("toggle", handleTrackToggle);
    return () => trackDetails.removeEventListener("toggle", handleTrackToggle);
  }, [loadComments, loadStatus, trackDetailsRef]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: nextBody, trackId }),
      });
      const payload = await readJsonResponse<{
        comment?: RiverComment;
        error?: string;
      }>(response);

      if (!response.ok || !payload?.comment) {
        throw new Error(payload?.error ?? "Comment could not be posted.");
      }

      setComments((current) => [...current, payload.comment as RiverComment]);
      setBody("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Comment could not be posted.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const summary =
    loadStatus === "loaded" ? `comments (${comments.length})` : "comments";

  return (
    <details
      className="river-comments"
      onToggle={(event) => {
        if (
          event.currentTarget.open &&
          (loadStatus === "idle" || loadStatus === "error")
        ) {
          if (loadImmediately) {
            setError("");
            setLoadStatus("loading");
          } else {
            void loadComments();
          }
        }
      }}
    >
      <summary>{summary}</summary>
      <div className="river-comments__body">
        {loadStatus === "loading" ? <p>...</p> : null}
        {loadStatus === "loaded" && comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : null}
        {comments.length > 0 ? (
          <ol className="river-comments__list">
            {comments.map((comment) => (
              <li key={comment.id}>
                <p className="river-comments__text">{comment.body}</p>
                <div className="river-comments__metadata">
                  {comment.authorName},{" "}
                  <time dateTime={comment.createdAt}>
                    {formatCommentTime(comment.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        {loadStatus === "loaded" && isUserLoaded ? (
          isSignedIn ? (
            <form className="river-comments__form" onSubmit={submitComment}>
              <label htmlFor={`comment-${trackId}`}>add a comment</label>
              <textarea
                id={`comment-${trackId}`}
                maxLength={1000}
                onChange={(event) => setBody(event.currentTarget.value)}
                required
                rows={2}
                value={body}
              />
              <button disabled={!body.trim() || isSubmitting} type="submit">
                {isSubmitting ? "posting..." : "post"}
              </button>
            </form>
          ) : (
            <p>
              <Link href="/sign-in">sign in to comment</Link>
            </p>
          )
        ) : null}
        {error ? (
          <p className="river-comments__error" role="status">
            {error}
          </p>
        ) : null}
      </div>
    </details>
  );
}
