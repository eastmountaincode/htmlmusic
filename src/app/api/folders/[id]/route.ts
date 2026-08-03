import { auth } from "@clerk/nextjs/server";
import { deleteOwnedFolder, getOwnedFolder } from "@/db/folders";

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
