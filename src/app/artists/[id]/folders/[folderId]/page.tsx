import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFolderRiverSongs } from "@/app/river-songs";
import { FolderPageBackLink } from "@/components/discover-return-state";
import { ProfileTracks } from "@/components/profile-tracks";
import { getPublishedFolder } from "@/db/folders";

type FolderPageProps = {
  params: Promise<{ id: string; folderId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: FolderPageProps): Promise<Metadata> {
  const { id, folderId } = await params;
  const folder = await getPublishedFolder(folderId, id);

  if (!folder) return {};

  return {
    title: `${folder.name} by ${folder.artist} — HTML Music`,
    description: `${folder.name}, a folder of ${folder.trackCount} ${
      folder.trackCount === 1 ? "track" : "tracks"
    } by ${folder.artist} on HTML Music.`,
  };
}

export default async function FolderPage({ params }: FolderPageProps) {
  const { id, folderId } = await params;
  const folder = await getPublishedFolder(folderId, id);

  if (!folder) notFound();

  const tracks = await getFolderRiverSongs(folder.id, folder.ownerId);

  return (
    <main>
      <section className="page-shell artist-page">
        <p className="artist-page__back">
          <FolderPageBackLink
            artistId={folder.ownerId}
            artistName={folder.artist}
            folderId={folder.id}
          />
        </p>
        <ProfileTracks
          folderOrigin={{
            id: folder.id,
            name: folder.name,
            artistId: folder.ownerId,
          }}
          initialTracks={tracks}
          key={folder.id}
          legend={folder.name}
        />
      </section>
    </main>
  );
}
