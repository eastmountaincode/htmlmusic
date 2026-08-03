"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import {
  folderPath,
  type RiverFolder,
} from "@/components/river-recording-row";

export function RiverFolderFile({
  folder,
  onOpenFolderPage,
  onOpenPage,
}: {
  folder: RiverFolder;
  onOpenFolderPage?: (folder: RiverFolder) => void;
  onOpenPage?: (entryId: string) => void;
}) {
  const href = folderPath(folder);

  function handlePageLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    onOpenPage?.(`folder:${folder.id}`);
    onOpenFolderPage?.(folder);
  }

  function handleArtistClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    onOpenPage?.(`folder:${folder.id}`);
  }

  return (
    <li className="river-file river-folder" id={`folder:${folder.id}`}>
      <div className="river-file__summary river-file__summary--with-permalink">
        <Image
          alt="[DIR]"
          height={22}
          loading="eager"
          src="/apache-icons/folder.gif"
          unoptimized
          width={20}
        />
        <span className="river-file__cells">
          <Link
            className="river-file__name"
            href={href}
            onClick={handlePageLinkClick}
            prefetch={false}
          >
            {folder.name}
          </Link>
          <span className="river-file__credits">
            <Link
              className="river-file__artist"
              href={`/artists/${encodeURIComponent(folder.artistId)}`}
              onClick={handleArtistClick}
              prefetch={false}
            >
              {folder.artist}
            </Link>
            <time className="river-file__posted" dateTime={folder.postedAt}>
              {folder.posted}
            </time>
          </span>
          <span className="river-file__length">
            {folder.trackCount} {folder.trackCount === 1 ? "track" : "tracks"}
          </span>
        </span>
        <Link
          aria-label={`Open folder ${folder.name}`}
          className="river-file__permalink"
          href={href}
          onClick={handlePageLinkClick}
          prefetch={false}
          title="Open folder"
        >
          →
        </Link>
      </div>
    </li>
  );
}
