import { getRiverPage } from "@/app/river-songs";

export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get("cursor")?.trim() || null;
  const page = getRiverPage(cursor);

  if (!page) {
    return Response.json({ error: "Unknown recording cursor." }, { status: 400 });
  }

  return Response.json(page, {
    headers: { "Cache-Control": "no-store" },
  });
}
