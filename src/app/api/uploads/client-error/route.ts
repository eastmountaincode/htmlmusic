import { auth } from "@clerk/nextjs/server";

type ClientUploadFailure = {
  attempt?: unknown;
  errorMessage?: unknown;
  errorName?: unknown;
  fileName?: unknown;
  fileSize?: unknown;
  fileType?: unknown;
  recordingId?: unknown;
  responseStatus?: unknown;
  stage?: unknown;
  storageHost?: unknown;
};

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Sign in to upload." }, { status: 401 });
  }

  let payload: ClientUploadFailure;

  try {
    payload = (await request.json()) as ClientUploadFailure;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const stage = payload.stage === "artwork" ? "artwork" : "audio";
  const attempt =
    typeof payload.attempt === "number" && Number.isFinite(payload.attempt)
      ? Math.max(1, Math.min(Math.trunc(payload.attempt), 5))
      : null;
  const fileSize =
    typeof payload.fileSize === "number" && Number.isFinite(payload.fileSize)
      ? Math.max(0, Math.trunc(payload.fileSize))
      : null;
  const responseStatus =
    typeof payload.responseStatus === "number" &&
    Number.isFinite(payload.responseStatus)
      ? Math.trunc(payload.responseStatus)
      : null;

  console.error("[api/uploads/client-storage-failure]", {
    attempt,
    errorMessage: cleanString(payload.errorMessage, 300),
    errorName: cleanString(payload.errorName, 100),
    fileName: cleanString(payload.fileName, 255),
    fileSize,
    fileType: cleanString(payload.fileType, 100),
    recordingId: cleanString(payload.recordingId, 100),
    responseStatus,
    stage,
    storageHost: cleanString(payload.storageHost, 255),
    userAgent: cleanString(request.headers.get("user-agent"), 500),
    userId,
  });

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
