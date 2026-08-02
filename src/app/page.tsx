import { getRiverPage } from "@/app/river-songs";
import { RiverDirectory } from "@/components/river-directory";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialPage = await getRiverPage(null);

  if (!initialPage) return null;

  return (
    <main>
      <RiverDirectory
        initialNextCursor={initialPage.nextCursor}
        initialSongs={initialPage.songs}
      />
    </main>
  );
}
