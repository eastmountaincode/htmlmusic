import { auth } from "@clerk/nextjs/server";
import {
  deleteOwnedRecording,
  getOwnedRecording,
  updateOwnedRecordingFolder,
} from "@/db/recordings";
import { getOwnedFolder } from "@/db/folders";
import { deleteR2Objects } from "@/lib/r2";

type UpdateRecordingRequest = {
  folderId?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to update a track." }, { status: 401 });
  }

  let payload: UpdateRecordingRequest;

  try {
    payload = (await request.json()) as UpdateRecordingRequest;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    payload.folderId !== null &&
    payload.folderId !== undefined &&
    typeof payload.folderId !== "string"
  ) {
    return Response.json({ error: "Invalid folder." }, { status: 400 });
  }

  const { id } = await params;
  const recording = await getOwnedRecording(id, userId);

  if (!recording) {
    return Response.json({ error: "Track not found." }, { status: 404 });
  }

  const folderId = payload.folderId?.trim() || null;
  const folder = folderId ? await getOwnedFolder(folderId, userId) : null;

  if (folderId && !folder) {
    return Response.json({ error: "Folder not found." }, { status: 400 });
  }

  try {
    await updateOwnedRecordingFolder(
      id,
      userId,
      folder?.id ?? null,
      folder
        ? recording.folderId === folder.id
          ? recording.folderAddedAt ?? recording.createdAt
          : new Date().toISOString()
        : null,
    );
  } catch (error) {
    console.error("[api/recordings/update] failed to update folder", {
      error,
      id,
      userId,
    });
    return Response.json(
      { error: "The track could not be updated." },
      { status: 502 },
    );
  }

  return Response.json({
    id,
    folderId: folder?.id ?? null,
    folderName: folder?.name ?? null,
  });
}

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
