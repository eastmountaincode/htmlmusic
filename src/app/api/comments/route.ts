import { auth, currentUser } from "@clerk/nextjs/server";
import { riverSongs } from "@/app/river-songs";
import {
  createComment,
  listComments,
  type RiverComment,
} from "@/db/comments";
import { getArtistName } from "@/lib/artist-name";

const riverTrackIds = new Set(riverSongs.map((song) => song.id));

function isValidTrackId(trackId: string) {
  return riverTrackIds.has(trackId);
}

export async function GET(request: Request) {
  const trackId = new URL(request.url).searchParams.get("trackId")?.trim();

  if (!trackId || !isValidTrackId(trackId)) {
    return Response.json({ error: "Unknown recording." }, { status: 400 });
  }

  const comments = await listComments(trackId);

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

  if (!isValidTrackId(trackId)) {
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
  const comment: RiverComment = {
    id: crypto.randomUUID(),
    trackId,
    authorId: userId,
    authorName,
    body,
    createdAt: new Date().toISOString(),
  };

  await createComment(comment);

  return Response.json({ comment }, { status: 201 });
}
