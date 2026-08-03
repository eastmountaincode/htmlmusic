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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
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

  async function renameFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || savingId || deletingId) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const folderId = editingId;

    setSavingId(folderId);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/folders/${encodeURIComponent(folderId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        folder?: { id: string; name: string };
      };

      if (!response.ok || payload.folder?.id !== folderId) {
        throw new Error(payload.error ?? "The folder could not be renamed.");
      }

      const renamedFolder = payload.folder;
      setFolders((currentFolders) =>
        currentFolders
          .map((folder) =>
            folder.id === folderId
              ? { ...folder, name: renamedFolder.name }
              : folder,
          )
          .sort((left, right) => left.name.localeCompare(right.name)),
      );
      setEditingId(null);
    } catch (renameError) {
      setErrorMessage(
        renameError instanceof Error
          ? renameError.message
          : "The folder could not be renamed.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteFolder(folder: ManagedFolder) {
    if (deletingId || savingId) return;
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
              {editingId === folder.id ? (
                <form
                  className="folder-manager__rename"
                  onSubmit={renameFolder}
                >
                  <input
                    aria-label={`Name for ${folder.name}`}
                    autoFocus
                    defaultValue={folder.name}
                    disabled={savingId === folder.id}
                    maxLength={FOLDER_NAME_MAX_LENGTH}
                    name="name"
                    required
                    type="text"
                  />
                  <button
                    aria-busy={savingId === folder.id}
                    disabled={savingId === folder.id}
                    type="submit"
                  >
                    {savingId === folder.id ? "saving..." : "save"}
                  </button>
                  <button
                    disabled={savingId === folder.id}
                    onClick={() => {
                      setEditingId(null);
                      setErrorMessage("");
                    }}
                    type="button"
                  >
                    cancel
                  </button>
                </form>
              ) : folder.trackCount > 0 ? (
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
              {editingId === folder.id ? null : (
                <span className="folder-manager__actions">
                  <button
                    aria-label={`Rename ${folder.name}`}
                    disabled={deletingId !== null || savingId !== null}
                    onClick={() => {
                      setEditingId(folder.id);
                      setErrorMessage("");
                    }}
                    type="button"
                  >
                    rename
                  </button>
                  <button
                    aria-label={`Delete ${folder.name}`}
                    disabled={deletingId !== null || savingId !== null}
                    onClick={() => void deleteFolder(folder)}
                    type="button"
                  >
                    {deletingId === folder.id ? "deleting..." : "delete"}
                  </button>
                </span>
              )}
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
