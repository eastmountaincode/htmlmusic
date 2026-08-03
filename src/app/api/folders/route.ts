import { auth, currentUser } from "@clerk/nextjs/server";
import {
  createFolder,
} from "@/db/folders";
import { upsertProfile } from "@/db/profiles";
import { getArtistName } from "@/lib/artist-name";
import { FOLDER_NAME_MAX_LENGTH } from "@/lib/folders";

type CreateFolderRequest = {
  name?: string;
};

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to create a folder." }, { status: 401 });
  }

  let payload: CreateFolderRequest;

  try {
    payload = (await request.json()) as CreateFolderRequest;
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

  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Sign in to create a folder." }, { status: 401 });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await upsertProfile(userId, getArtistName(user), createdAt);
    await createFolder({ id, ownerId: userId, name, createdAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("UNIQUE constraint failed")) {
      return Response.json(
        { error: "You already have a folder with that name." },
        { status: 409 },
      );
    }

    console.error("[api/folders] failed to create folder", { error, userId });
    return Response.json(
      { error: "The folder could not be created." },
      { status: 502 },
    );
  }

  return Response.json(
    { folder: { id, name, trackCount: 0 } },
    { status: 201 },
  );
}
