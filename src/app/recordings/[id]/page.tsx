import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRiverSong } from "@/app/river-songs";
import { RecordingPageBackLink } from "@/components/discover-return-state";
import { HtmlAudioControls } from "@/components/persistent-audio-player";
import { RecordingShare } from "@/components/recording-share";
import { RiverComments } from "@/components/river-comments";

type RecordingPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: RecordingPageProps): Promise<Metadata> {
  const { id } = await params;
  const song = await getRiverSong(id);

  if (!song) return {};

  const title = `${song.filename} — HTML Music`;
  const description = `${song.filename} by ${song.artist} on HTML Music.`;
  const images = song.artwork
    ? [
        {
          alt: `${song.filename} artwork`,
          height: 256,
          url: song.artwork,
          width: 256,
        },
      ]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      description,
      images,
      title,
      type: "website",
    },
    twitter: {
      card: "summary",
      description,
      images: song.artwork ? [song.artwork] : undefined,
      title,
    },
  };
}

export default async function RecordingPage({ params }: RecordingPageProps) {
  const { id } = await params;
  const song = await getRiverSong(id);

  if (!song) notFound();

  return (
    <main>
      <section className="page-shell recording-page">
        <p className="recording-page__back">
          <RecordingPageBackLink
            artistId={song.artistId}
            trackId={song.id}
          />
        </p>
        <fieldset className="plain-fieldset recording-page__fieldset">
          <legend>{song.filename}</legend>
          <div
            className={`recording-page__layout${
              song.artwork ? " recording-page__layout--with-artwork" : ""
            }`}
          >
            {song.artwork ? (
              <Image
                alt=""
                className="recording-page__artwork"
                height={128}
                src={song.artwork}
                unoptimized
                width={128}
              />
            ) : null}
            <div className="recording-page__content">
              <table className="plain-table recording-page__table">
                <tbody>
                  <tr>
                    <th scope="row">artist</th>
                    <td>
                      <Link
                        href={`/artists/${encodeURIComponent(song.artistId)}`}
                        prefetch={false}
                      >
                        {song.artist}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">posted</th>
                    <td>
                      <time dateTime={song.postedAt}>{song.posted}</time>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">length</th>
                    <td>{song.length}</td>
                  </tr>
                  <tr>
                    <th scope="row">permalink</th>
                    <td>
                      <RecordingShare
                        path={`/recordings/${song.id}`}
                        title={`${song.filename} by ${song.artist}`}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <HtmlAudioControls track={song} />
            </div>
            <RiverComments key={song.id} loadImmediately trackId={song.id} />
          </div>
        </fieldset>
      </section>
    </main>
  );
}
