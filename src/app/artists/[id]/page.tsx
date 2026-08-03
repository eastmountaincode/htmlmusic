import { notFound } from "next/navigation";
import { getArtistRiverSongs } from "@/app/river-songs";
import { ProfileTracks } from "@/components/profile-tracks";
import { getArtistProfile } from "@/db/profiles";

type ArtistPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const profile = await getArtistProfile(id);

  if (!profile) notFound();

  const tracks = await getArtistRiverSongs(profile.userId);

  return (
    <main>
      <section className="page-shell artist-page">
        <ProfileTracks
          initialTracks={tracks}
          key={profile.userId}
          legend={profile.artistName}
        />
      </section>
    </main>
  );
}
