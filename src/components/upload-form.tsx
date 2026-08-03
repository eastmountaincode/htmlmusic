"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { getArtistName } from "@/lib/artist-name";
import {
  MAX_ARTWORK_FILE_SIZE,
  MAX_AUDIO_FILE_SIZE,
} from "@/lib/upload-files";

type UploadTarget = {
  contentType: string;
  uploadUrl: string;
};

type UploadStage = "audio" | "artwork";

type InitializeUploadResponse = {
  id?: string;
  audio?: UploadTarget;
  artwork?: UploadTarget | null;
  error?: string;
};

type CompleteUploadResponse = {
  path?: string;
  error?: string;
};

async function readJsonResponse<T>(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function readAudioDuration(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<number | null>((resolve) => {
      const audio = new Audio();
      let timeout = 0;

      const finish = (duration: number | null) => {
        window.clearTimeout(timeout);
        audio.onloadedmetadata = null;
        audio.onerror = null;
        audio.removeAttribute("src");
        audio.load();
        resolve(duration);
      };

      timeout = window.setTimeout(() => finish(null), 15_000);
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        finish(
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : null,
        );
      };
      audio.onerror = () => finish(null);
      audio.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function storageHost(uploadUrl: string) {
  try {
    return new URL(uploadUrl).host;
  } catch {
    return "unknown";
  }
}

async function reportStorageFailure({
  attempt,
  error,
  file,
  recordingId,
  responseStatus,
  stage,
  target,
}: {
  attempt: number;
  error?: unknown;
  file: File;
  recordingId: string;
  responseStatus?: number;
  stage: UploadStage;
  target: UploadTarget;
}) {
  const errorName =
    error instanceof Error
      ? error.name
      : responseStatus
        ? "StorageResponse"
        : "UnknownError";
  const errorMessage =
    error instanceof Error
      ? error.message
      : responseStatus
        ? `HTTP ${responseStatus}`
        : String(error);

  try {
    await fetch("/api/uploads/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attempt,
        errorMessage,
        errorName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        recordingId,
        responseStatus,
        stage,
        storageHost: storageHost(target.uploadUrl),
      }),
      keepalive: true,
    });
  } catch {
    // The original storage error remains the useful message for the listener.
  }
}

async function cleanUpFailedUpload(recordingId: string) {
  try {
    await fetch(`/api/recordings/${encodeURIComponent(recordingId)}`, {
      method: "DELETE",
    });
  } catch {
    // A pending upload is hidden from Discover and can be cleaned up later.
  }
}

async function putFile(
  file: File,
  target: UploadTarget,
  { recordingId, stage }: { recordingId: string; stage: UploadStage },
) {
  const attempts = 2;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(target.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": target.contentType },
        body: file,
      });
    } catch (error) {
      if (attempt < attempts) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 750));
        continue;
      }

      await Promise.allSettled([
        reportStorageFailure({
          attempt,
          error,
          file,
          recordingId,
          stage,
          target,
        }),
        cleanUpFailedUpload(recordingId),
      ]);
      throw new Error(`${file.name} could not reach storage. Try again.`);
    }

    if (!response.ok) {
      await Promise.allSettled([
        reportStorageFailure({
          attempt,
          file,
          recordingId,
          responseStatus: response.status,
          stage,
          target,
        }),
        cleanUpFailedUpload(recordingId),
      ]);
      throw new Error(`${file.name} could not be uploaded.`);
    }

    return;
  }
}

export function UploadForm() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [artworkPreview, setArtworkPreview] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      if (artworkPreview) {
        URL.revokeObjectURL(artworkPreview.url);
      }
    };
  }, [artworkPreview]);

  function updateArtworkPreview(event: ChangeEvent<HTMLInputElement>) {
    const artwork = event.currentTarget.files?.[0];

    setArtworkPreview(
      artwork
        ? { name: artwork.name, url: URL.createObjectURL(artwork) }
        : null,
    );
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const audio = formData.get("audio");
    const artworkValue = formData.get("artwork");
    const artwork =
      artworkValue instanceof File && artworkValue.size > 0
        ? artworkValue
        : null;

    if (!(audio instanceof File) || audio.size < 1) {
      setErrorMessage("Choose an audio file.");
      return;
    }

    if (audio.size > MAX_AUDIO_FILE_SIZE) {
      setErrorMessage("The recording must be 30 MB or smaller.");
      return;
    }

    if (artwork && artwork.size > MAX_ARTWORK_FILE_SIZE) {
      setErrorMessage("The cover must be 20 MB or smaller.");
      return;
    }

    setIsUploading(true);
    setProgress(1);
    setStatus("preparing upload");
    setErrorMessage("");

    try {
      const durationSeconds = await readAudioDuration(audio);
      let initializeResponse: Response;

      try {
        initializeResponse = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: { name: audio.name, size: audio.size, type: audio.type },
            artwork: artwork
              ? { name: artwork.name, size: artwork.size, type: artwork.type }
              : null,
            durationSeconds,
          }),
        });
      } catch {
        throw new Error("HTML Music could not prepare the upload. Try again.");
      }
      const initialized =
        await readJsonResponse<InitializeUploadResponse>(initializeResponse);

      if (!initializeResponse.ok || !initialized?.id || !initialized.audio) {
        throw new Error(
          initialized?.error ?? "The upload could not be prepared.",
        );
      }

      setProgress(2);
      setStatus("uploading recording");
      await putFile(audio, initialized.audio, {
        recordingId: initialized.id,
        stage: "audio",
      });

      if (artwork && initialized.artwork) {
        setProgress(3);
        setStatus("uploading cover");
        await putFile(artwork, initialized.artwork, {
          recordingId: initialized.id,
          stage: "artwork",
        });
      }

      setProgress(4);
      setStatus("finishing upload");
      let completeResponse: Response;

      try {
        completeResponse = await fetch(
          `/api/uploads/${encodeURIComponent(initialized.id)}/complete`,
          { method: "POST" },
        );
      } catch {
        throw new Error("HTML Music could not finish the upload. Try again.");
      }
      const completed =
        await readJsonResponse<CompleteUploadResponse>(completeResponse);

      if (!completeResponse.ok || !completed?.path) {
        throw new Error(
          completed?.error ?? "The upload could not be completed.",
        );
      }

      setProgress(5);
      setStatus("uploaded");
      form.reset();
      setArtworkPreview(null);
      router.push(completed.path);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The upload failed.",
      );
      setProgress(0);
      setStatus("");
    } finally {
      setIsUploading(false);
    }
  }

  if (!isLoaded) {
    return (
      <fieldset className="plain-fieldset">
        <legend>Upload</legend>
        <p>loading</p>
      </fieldset>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <fieldset className="plain-fieldset">
        <legend>Upload</legend>
        <p>
          <Link className="plain-link" href="/sign-in">
            sign in
          </Link>{" "}
          to upload a recording.
        </p>
      </fieldset>
    );
  }

  return (
    <fieldset className="plain-fieldset">
      <legend>Upload</legend>
      <form className="upload-form" onSubmit={submitUpload}>
        <table className="plain-table upload-table">
          <tbody>
            <tr>
              <th scope="row">
                <label htmlFor="upload-audio">recording</label>
              </th>
              <td>
                <input
                  accept=".mp3,.wav,.aif,.aiff,.m4a,.flac,.ogg,.oga,.opus,audio/*"
                  disabled={isUploading}
                  id="upload-audio"
                  name="audio"
                  required
                  type="file"
                />
              </td>
            </tr>
            <tr>
              <th scope="row">
                <label htmlFor="upload-artwork">cover</label>
              </th>
              <td>
                <div className="upload-form__cover-field">
                  <input
                    accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                    disabled={isUploading}
                    id="upload-artwork"
                    name="artwork"
                    onChange={updateArtworkPreview}
                    type="file"
                  />
                  {artworkPreview ? (
                    <Image
                      alt={`Selected cover: ${artworkPreview.name}`}
                      className="upload-form__cover-preview"
                      height={128}
                      src={artworkPreview.url}
                      unoptimized
                      width={128}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">artist</th>
              <td>{getArtistName(user)}</td>
            </tr>
          </tbody>
        </table>
        <p className="upload-form__actions">
          <button aria-busy={isUploading} disabled={isUploading} type="submit">
            {isUploading ? "uploading..." : "upload"}
          </button>
          {status ? <span aria-live="polite">{status}</span> : null}
        </p>
        {isUploading ? (
          <progress aria-label={status} max="5" value={progress} />
        ) : null}
        {errorMessage ? (
          <p aria-live="polite" className="upload-form__error">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </fieldset>
  );
}
