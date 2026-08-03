import { notFound } from "next/navigation";
import { getArtistRiverEntries } from "@/app/river-songs";
import { BackToDiscover } from "@/components/discover-return-state";
import { ProfileDirectory } from "@/components/profile-directory";
import { getArtistProfile } from "@/db/profiles";

type ArtistPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const profile = await getArtistProfile(id);

  if (!profile) notFound();

  const entries = await getArtistRiverEntries(profile.userId);

  return (
    <main>
      <section className="page-shell artist-page">
        <p className="artist-page__back">
          <BackToDiscover />
        </p>
        <ProfileDirectory
          initialEntries={entries}
          key={profile.userId}
          legend={profile.artistName}
        />
      </section>
    </main>
  );
}
