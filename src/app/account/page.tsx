import { auth } from "@clerk/nextjs/server";
import { getArtistRiverSongs } from "@/app/river-songs";
import { AccountPanel } from "@/components/auth/account-panel";
import { listOwnedFolders } from "@/db/folders";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [{ userId }, query] = await Promise.all([
    auth.protect(),
    searchParams,
  ]);
  const activeTab =
    query.tab === "tracks" || query.tab === "folders"
      ? query.tab
      : "settings";
  const [tracks, folders] = await Promise.all([
    activeTab === "tracks" ? getArtistRiverSongs(userId) : [],
    activeTab === "settings" ? [] : listOwnedFolders(userId),
  ]);

  return (
    <main>
      <AccountPanel
        activeTab={activeTab}
        artistId={userId}
        initialFolders={folders.map((folder) => ({
          artistId: folder.ownerId,
          id: folder.id,
          name: folder.name,
          trackCount: folder.trackCount,
        }))}
        initialTracks={tracks}
      />
    </main>
  );
}
