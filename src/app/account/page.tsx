import { auth } from "@clerk/nextjs/server";
import { getOwnedRiverSongs } from "@/app/river-songs";
import { AccountPanel } from "@/components/auth/account-panel";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId } = await auth();
  const tracks = userId ? await getOwnedRiverSongs(userId) : [];

  return (
    <main>
      <AccountPanel initialTracks={tracks} />
    </main>
  );
}
