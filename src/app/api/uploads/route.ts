import { auth, currentUser } from "@clerk/nextjs/server";
import { upsertProfile } from "@/db/profiles";
import { createPendingRecording } from "@/db/recordings";
import { getArtistName } from "@/lib/artist-name";
import { createR2UploadUrl } from "@/lib/r2";
import {
  MAX_RECORDING_DURATION_SECONDS,
  validateArtworkFile,
  validateAudioFile,
  type UploadFileDescription,
} from "@/lib/upload-files";

type UploadRequest = {
  audio?: UploadFileDescription;
  artwork?: UploadFileDescription | null;
  durationSeconds?: number | null;
};

function isFileDescription(value: unknown): value is UploadFileDescription {
  if (!value || typeof value !== "object") return false;
  const file = value as Record<string, unknown>;

  return (
    typeof file.name === "string" &&
    typeof file.size === "number" &&
    typeof file.type === "string"
  );
}

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to upload." }, { status: 401 });
  }

  let payload: UploadRequest;

  try {
    payload = (await request.json()) as UploadRequest;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isFileDescription(payload.audio)) {
    return Response.json({ error: "Choose an audio file." }, { status: 400 });
  }

  const audio = validateAudioFile(payload.audio);
  if (!audio) {
    return Response.json(
      { error: "Use an MP3, WAV, AIFF, M4A, FLAC, OGG, or Opus file up to 30 MB." },
      { status: 400 },
    );
  }

  const artworkDescription = payload.artwork;
  if (
    artworkDescription !== null &&
    artworkDescription !== undefined &&
    !isFileDescription(artworkDescription)
  ) {
    return Response.json({ error: "Invalid cover file." }, { status: 400 });
  }

  const artwork = artworkDescription
    ? validateArtworkFile(artworkDescription)
    : null;
  if (artworkDescription && !artwork) {
    return Response.json(
      { error: "Use a JPG, PNG, WebP, or GIF cover up to 20 MB." },
      { status: 400 },
    );
  }

  const rawDuration = payload.durationSeconds;
  const durationSeconds =
    typeof rawDuration === "number" &&
    Number.isFinite(rawDuration) &&
    rawDuration > 0 &&
    rawDuration <= MAX_RECORDING_DURATION_SECONDS
      ? rawDuration
      : null;

  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Sign in to upload." }, { status: 401 });
  }

  const id = crypto.randomUUID();
  const audioKey = `recordings/${id}/audio.${audio.extension}`;
  const artworkKey = artwork
    ? `recordings/${id}/cover.${artwork.extension}`
    : null;
  const createdAt = new Date().toISOString();
  const artistName = getArtistName(user);

  try {
    const [audioUploadUrl, artworkUploadUrl] = await Promise.all([
      createR2UploadUrl(audioKey, audio.contentType),
      artworkKey && artwork
        ? createR2UploadUrl(artworkKey, artwork.contentType)
        : Promise.resolve(null),
    ]);

    await upsertProfile(userId, artistName, createdAt);
    await createPendingRecording({
      id,
      ownerId: userId,
      filename: payload.audio.name.trim(),
      audioKey,
      audioType: audio.contentType,
      audioSize: payload.audio.size,
      artworkKey,
      artworkType: artwork?.contentType ?? null,
      artworkSize: artworkDescription?.size ?? null,
      durationSeconds,
      status: "pending",
      createdAt,
    });

    return Response.json(
      {
        id,
        audio: { contentType: audio.contentType, uploadUrl: audioUploadUrl },
        artwork:
          artworkUploadUrl && artwork
            ? { contentType: artwork.contentType, uploadUrl: artworkUploadUrl }
            : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/uploads] failed to initialize upload", {
      error,
      userId,
    });
    return Response.json(
      { error: "The upload could not be prepared." },
      { status: 502 },
    );
  }
}
