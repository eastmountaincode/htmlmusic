import { auth } from "@clerk/nextjs/server";
import {
  deleteOwnedRecording,
  getOwnedRecording,
} from "@/db/recordings";
import { deleteR2Objects } from "@/lib/r2";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to delete a track." }, { status: 401 });
  }

  const { id } = await params;
  const recording = await getOwnedRecording(id, userId);

  if (!recording) {
    return Response.json({ error: "Track not found." }, { status: 404 });
  }

  try {
    await deleteOwnedRecording(id, userId);
  } catch (error) {
    console.error("[api/recordings/delete] failed to delete database record", {
      error,
      id,
      userId,
    });
    return Response.json(
      { error: "The track could not be deleted." },
      { status: 502 },
    );
  }

  try {
    await deleteR2Objects(
      [recording.audioKey, recording.artworkKey].filter(
        (key): key is string => Boolean(key),
      ),
    );
  } catch (error) {
    console.error("[api/recordings/delete] failed to clean up storage", {
      error,
      id,
      userId,
    });
  }

  return Response.json({ id });
}
