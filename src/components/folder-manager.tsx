"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { folderPath } from "@/components/river-recording-row";
import { FOLDER_NAME_MAX_LENGTH } from "@/lib/folders";

export type ManagedFolder = {
  id: string;
  name: string;
  trackCount: number;
  artistId: string;
};

export function FolderManager({
  artistId,
  initialFolders,
}: {
  artistId: string;
  initialFolders: ManagedFolder[];
}) {
  const [folders, setFolders] = useState(initialFolders);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();

    setIsCreating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as {
        error?: string;
        folder?: { id: string; name: string; trackCount: number };
      };

      if (!response.ok || !payload.folder) {
        throw new Error(payload.error ?? "The folder could not be created.");
      }

      const folder = payload.folder;
      setFolders((currentFolders) => [
        ...currentFolders,
        { ...folder, artistId },
      ].sort((left, right) => left.name.localeCompare(right.name)));
      form.reset();
    } catch (createError) {
      setErrorMessage(
        createError instanceof Error
          ? createError.message
          : "The folder could not be created.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteFolder(folder: ManagedFolder) {
    if (deletingId) return;
    if (
      !window.confirm(
        `Delete “${folder.name}”? Its tracks will remain uploaded without a folder.`,
      )
    ) {
      return;
    }

    setDeletingId(folder.id);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/folders/${encodeURIComponent(folder.id)}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { error?: string; id?: string };

      if (!response.ok || payload.id !== folder.id) {
        throw new Error(payload.error ?? "The folder could not be deleted.");
      }

      setFolders((currentFolders) =>
        currentFolders.filter((currentFolder) => currentFolder.id !== folder.id),
      );
    } catch (deleteError) {
      setErrorMessage(
        deleteError instanceof Error
          ? deleteError.message
          : "The folder could not be deleted.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <fieldset className="plain-fieldset profile-tracks folder-manager">
      <legend>folders</legend>
      <form className="folder-manager__create" onSubmit={createFolder}>
        <label htmlFor="folder-name">new folder</label>
        <input
          disabled={isCreating}
          id="folder-name"
          maxLength={FOLDER_NAME_MAX_LENGTH}
          name="name"
          required
          type="text"
        />
        <button aria-busy={isCreating} disabled={isCreating} type="submit">
          {isCreating ? "creating..." : "create"}
        </button>
      </form>
      {folders.length > 0 ? (
        <ol className="river-directory__list folder-manager__list">
          {folders.map((folder) => (
            <li className="folder-manager__row" key={folder.id}>
              <Image
                alt="[DIR]"
                height={22}
                src="/apache-icons/folder.gif"
                unoptimized
                width={20}
              />
              {folder.trackCount > 0 ? (
                <Link
                  className="folder-manager__name"
                  href={folderPath(folder)}
                  prefetch={false}
                >
                  {folder.name}
                </Link>
              ) : (
                <span className="folder-manager__name">{folder.name}</span>
              )}
              <span className="folder-manager__count">
                {folder.trackCount} {folder.trackCount === 1 ? "track" : "tracks"}
              </span>
              <button
                aria-label={`Delete ${folder.name}`}
                disabled={deletingId !== null}
                onClick={() => void deleteFolder(folder)}
                type="button"
              >
                {deletingId === folder.id ? "deleting..." : "delete"}
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      {errorMessage ? (
        <p className="profile-tracks__error" role="status">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
