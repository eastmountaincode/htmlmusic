import { auth } from "@clerk/nextjs/server";
import { UploadForm } from "@/components/upload-form";
import { listOwnedFolders } from "@/db/folders";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const { userId } = await auth();
  const folders = userId ? await listOwnedFolders(userId) : [];

  return (
    <main>
      <section className="page-shell">
        <UploadForm
          initialFolders={folders.map((folder) => ({
            id: folder.id,
            name: folder.name,
          }))}
        />
      </section>
    </main>
  );
}
