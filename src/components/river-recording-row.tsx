import Image from "next/image";
import Link from "next/link";
import type { MouseEventHandler } from "react";
import type { AudioTrack } from "@/components/persistent-audio-player";

export type RiverSong = AudioTrack & {
  folderId: string | null;
  folderName: string | null;
  length: string;
  posted: string;
  postedAt: string;
};

export type RiverFolder = {
  id: string;
  name: string;
  artist: string;
  artistId: string;
  trackCount: number;
  posted: string;
  postedAt: string;
};

export type RiverEntry =
  | { kind: "track"; song: RiverSong }
  | { kind: "folder"; folder: RiverFolder };

export function riverEntryId(entry: RiverEntry) {
  return entry.kind === "track"
    ? `track:${entry.song.id}`
    : `folder:${entry.folder.id}`;
}

export function folderPath(folder: Pick<RiverFolder, "artistId" | "id">) {
  return `/artists/${encodeURIComponent(folder.artistId)}/folders/${encodeURIComponent(folder.id)}`;
}

export function RiverRecordingIcon({ song }: { song: RiverSong }) {
  return (
    <Image
      alt="[SND]"
      className={song.artwork ? "river-file__thumbnail" : undefined}
      height={22}
      loading="eager"
      src={song.artwork ?? "/apache-icons/sound2.gif"}
      unoptimized
      width={song.artwork ? 22 : 20}
    />
  );
}

export function RiverRecordingCells({
  artist,
  artistId,
  filename,
  length,
  onArtistClick,
  posted,
  postedAt,
}: RiverSong & {
  onArtistClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <span className="river-file__cells">
      <span className="river-file__name">{filename}</span>
      <span className="river-file__credits">
        <Link
          className="river-file__artist"
          href={`/artists/${encodeURIComponent(artistId)}`}
          onClick={onArtistClick}
          prefetch={false}
        >
          {artist}
        </Link>
        <time className="river-file__posted" dateTime={postedAt}>
          {posted}
        </time>
      </span>
      <span className="river-file__length">{length}</span>
    </span>
  );
}
