import { auth, currentUser } from "@clerk/nextjs/server";
import { isKnownRiverTrack } from "@/app/river-songs";
import {
  createComment,
  listComments,
  type RiverComment,
} from "@/db/comments";
import { upsertProfile } from "@/db/profiles";
import { getArtistName } from "@/lib/artist-name";

export async function GET(request: Request) {
  const trackId = new URL(request.url).searchParams.get("trackId")?.trim();

  if (!trackId || !(await isKnownRiverTrack(trackId))) {
    return Response.json({ error: "Unknown recording." }, { status: 400 });
  }

  let comments: RiverComment[];

  try {
    comments = await listComments(trackId);
  } catch (error) {
    console.error("[api/comments] failed to list comments", {
      error,
      trackId,
    });
    return Response.json(
      { error: "Comments could not be loaded." },
      { status: 502 },
    );
  }

  return Response.json(
    { comments },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to comment." }, { status: 401 });
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

  const { body: rawBody, trackId: rawTrackId } = payload as Record<
    string,
    unknown
  >;
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  const trackId = typeof rawTrackId === "string" ? rawTrackId.trim() : "";

  if (!trackId || !(await isKnownRiverTrack(trackId))) {
    return Response.json({ error: "Unknown recording." }, { status: 400 });
  }

  if (!body || body.length > 1000) {
    return Response.json(
      { error: "Comments must be between 1 and 1000 characters." },
      { status: 400 },
    );
  }

  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const authorName = getArtistName(user);
  const comment = {
    id: crypto.randomUUID(),
    trackId,
    authorId: userId,
    body,
    createdAt: new Date().toISOString(),
  };

  try {
    await upsertProfile(userId, authorName, comment.createdAt);
    await createComment(comment);
  } catch (error) {
    console.error("[api/comments] failed to create comment", {
      error,
      trackId,
      userId,
    });
    return Response.json(
      { error: "Comment could not be posted." },
      { status: 502 },
    );
  }

  return Response.json(
    { comment: { ...comment, authorName } satisfies RiverComment },
    { status: 201 },
  );
}
