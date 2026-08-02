import { auth, clerkClient } from "@clerk/nextjs/server";
import { upsertProfile } from "@/db/profiles";
import { ARTIST_NAME_MAX_LENGTH } from "@/lib/artist-name";

const controlCharacters = /[\u0000-\u001f\u007f]/;

export async function PATCH(request: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to update your account." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawName = (payload as Record<string, unknown>).name;
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (
    !name ||
    name.length > ARTIST_NAME_MAX_LENGTH ||
    controlCharacters.test(name)
  ) {
    return Response.json(
      { error: `Names must be between 1 and ${ARTIST_NAME_MAX_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { artistName: name },
  });
  await upsertProfile(userId, name);

  return Response.json({ name });
}
