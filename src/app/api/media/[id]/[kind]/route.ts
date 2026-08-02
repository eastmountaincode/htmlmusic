import { getPublishedRecording } from "@/db/recordings";
import { createR2DownloadUrl } from "@/lib/r2";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { id, kind } = await params;

  if (kind !== "audio" && kind !== "artwork") {
    return Response.json({ error: "Unknown media." }, { status: 404 });
  }

  try {
    const recording = await getPublishedRecording(id);
    if (!recording) {
      return Response.json({ error: "Unknown recording." }, { status: 404 });
    }

    const key = kind === "audio" ? recording.audioKey : recording.artworkKey;
    const contentType =
      kind === "audio" ? recording.audioType : recording.artworkType;

    if (!key || !contentType) {
      return Response.json({ error: "Media not found." }, { status: 404 });
    }

    const filename =
      kind === "audio" ? recording.filename : `${recording.id}-cover`;
    const location = await createR2DownloadUrl(key, contentType, filename);

    return new Response(null, {
      status: 307,
      headers: {
        "Cache-Control": "private, no-store",
        Location: location,
      },
    });
  } catch (error) {
    console.error("[api/media] failed to create media URL", {
      error,
      id,
      kind,
    });
    return Response.json(
      { error: "Media could not be loaded." },
      { status: 502 },
    );
  }
}
