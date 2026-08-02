import { getRiverPage } from "@/app/river-songs";
import { RiverDirectory } from "@/components/river-directory";

export default function Home() {
  const initialPage = getRiverPage(null);

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
