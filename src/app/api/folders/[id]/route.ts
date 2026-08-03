import { auth } from "@clerk/nextjs/server";
import {
  deleteOwnedFolder,
  getOwnedFolder,
  updateOwnedFolderName,
} from "@/db/folders";
import { FOLDER_NAME_MAX_LENGTH } from "@/lib/folders";

type UpdateFolderRequest = {
  name?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to rename a folder." }, { status: 401 });
  }

  let payload: UpdateFolderRequest;

  try {
    payload = (await request.json()) as UpdateFolderRequest;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!name || name.length > FOLDER_NAME_MAX_LENGTH) {
    return Response.json(
      { error: `Folder names must be 1–${FOLDER_NAME_MAX_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const { id } = await params;
  const folder = await getOwnedFolder(id, userId);

  if (!folder) {
    return Response.json({ error: "Folder not found." }, { status: 404 });
  }

  if (folder.name === name) {
    return Response.json({ folder: { id, name } });
  }

  try {
    await updateOwnedFolderName(id, userId, name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("UNIQUE constraint failed")) {
      return Response.json(
        { error: "You already have a folder with that name." },
        { status: 409 },
      );
    }

    console.error("[api/folders/update] failed to rename folder", {
      error,
      id,
      userId,
    });
    return Response.json(
      { error: "The folder could not be renamed." },
      { status: 502 },
    );
  }

  return Response.json({ folder: { id, name } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to delete a folder." }, { status: 401 });
  }

  const { id } = await params;
  const folder = await getOwnedFolder(id, userId);

  if (!folder) {
    return Response.json({ error: "Folder not found." }, { status: 404 });
  }

  try {
    await deleteOwnedFolder(id, userId);
  } catch (error) {
    console.error("[api/folders/delete] failed to delete folder", {
      error,
      id,
      userId,
    });
    return Response.json(
      { error: "The folder could not be deleted." },
      { status: 502 },
    );
  }

  return Response.json({ id });
}
