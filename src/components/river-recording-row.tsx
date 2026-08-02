import Image from "next/image";
import type { AudioTrack } from "@/components/persistent-audio-player";

export type RiverSong = AudioTrack & {
  length: string;
  posted: string;
  postedAt: string;
};

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
  filename,
  length,
  posted,
  postedAt,
}: RiverSong) {
  return (
    <span className="river-file__cells">
      <span className="river-file__name">{filename}</span>
      <span className="river-file__credits">
        <span className="river-file__artist">{artist}</span>
        <time className="river-file__posted" dateTime={postedAt}>
          {posted}
        </time>
      </span>
      <span className="river-file__length">{length}</span>
    </span>
  );
}
