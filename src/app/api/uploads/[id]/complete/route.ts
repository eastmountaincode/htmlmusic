import { auth } from "@clerk/nextjs/server";
import {
  completeOwnedRecording,
  getOwnedPendingRecording,
} from "@/db/recordings";
import { headR2Object } from "@/lib/r2";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to upload." }, { status: 401 });
  }

  const { id } = await params;
  const recording = await getOwnedPendingRecording(id, userId);

  if (!recording) {
    return Response.json({ error: "Unknown upload." }, { status: 404 });
  }

  try {
    const [audioObject, artworkObject] = await Promise.all([
      headR2Object(recording.audioKey),
      recording.artworkKey
        ? headR2Object(recording.artworkKey)
        : Promise.resolve(null),
    ]);

    const audioMatches =
      audioObject.contentLength === recording.audioSize &&
      audioObject.contentType === recording.audioType;
    const artworkMatches = recording.artworkKey
      ? artworkObject?.contentLength === recording.artworkSize &&
        artworkObject.contentType === recording.artworkType
      : artworkObject === null;

    if (!audioMatches || !artworkMatches) {
      return Response.json(
        { error: "The uploaded files did not match the selected files." },
        { status: 400 },
      );
    }

    await completeOwnedRecording(id, userId);

    return Response.json({ id, path: `/recordings/${id}` });
  } catch (error) {
    console.error("[api/uploads/complete] failed to verify upload", {
      error,
      id,
      userId,
    });
    return Response.json(
      { error: "The upload could not be verified." },
      { status: 502 },
    );
  }
}
