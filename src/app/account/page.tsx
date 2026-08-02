import { auth } from "@clerk/nextjs/server";
import { getOwnedRiverSongs } from "@/app/river-songs";
import { AccountPanel } from "@/components/auth/account-panel";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [{ userId }, query] = await Promise.all([
    auth.protect({ unauthenticatedUrl: "/sign-in" }),
    searchParams,
  ]);
  const activeTab = query.tab === "tracks" ? "tracks" : "settings";
  const tracks =
    activeTab === "tracks" ? await getOwnedRiverSongs(userId) : [];

  return (
    <main>
      <AccountPanel activeTab={activeTab} initialTracks={tracks} />
    </main>
  );
}
