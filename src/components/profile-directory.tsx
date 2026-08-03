"use client";

import { useEffect } from "react";
import { useDiscoverReturnState } from "@/components/discover-return-state";
import { useAudioPlayer } from "@/components/persistent-audio-player";
import { RiverFile } from "@/components/river-directory";
import { RiverFolderFile } from "@/components/river-folder-row";
import {
  riverEntryId,
  type RiverEntry,
} from "@/components/river-recording-row";

export function ProfileDirectory({
  initialEntries,
  legend,
}: {
  initialEntries: RiverEntry[];
  legend: string;
}) {
  const { currentTrack, registerQueue } = useAudioPlayer();
  const {
    markArtistFolderNavigation,
    markArtistTrackNavigation,
  } = useDiscoverReturnState();

  useEffect(() => {
    registerQueue(
      initialEntries.flatMap((entry) =>
        entry.kind === "track" ? [entry.song] : [],
      ),
    );
  }, [initialEntries, registerQueue]);

  return (
    <fieldset className="plain-fieldset profile-tracks">
      <legend>{legend}</legend>
      {initialEntries.length > 0 ? (
        <ol className="river-directory__list">
          {initialEntries.map((entry) => {
            if (entry.kind === "folder") {
              return (
                <RiverFolderFile
                  folder={entry.folder}
                  key={riverEntryId(entry)}
                  onOpenFolderPage={(folder) =>
                    markArtistFolderNavigation(folder.id, folder.artistId)
                  }
                />
              );
            }

            return (
              <RiverFile
                isCurrent={currentTrack?.id === entry.song.id}
                key={riverEntryId(entry)}
                onOpenTrackPage={(trackId) =>
                  markArtistTrackNavigation(trackId, entry.song.artistId)
                }
                song={entry.song}
              />
            );
          })}
        </ol>
      ) : (
        <p className="profile-tracks__empty">no tracks uploaded</p>
      )}
    </fieldset>
  );
}
