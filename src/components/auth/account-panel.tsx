"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { AccountTracks } from "@/components/account-tracks";
import type { RiverSong } from "@/components/river-recording-row";
import {
  ARTIST_NAME_MAX_LENGTH,
  getArtistName,
} from "@/lib/artist-name";

export function AccountPanel({ initialTracks }: { initialTracks: RiverSong[] }) {
  const { signOut } = useClerk();
  const { isLoaded, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as {
        name?: string;
        error?: string;
      };

      if (!response.ok || !payload.name) {
        throw new Error(payload.error ?? "Your name could not be saved.");
      }

      await user?.reload();
    } catch (saveError) {
      setErrorMessage(
        saveError instanceof Error
          ? saveError.message
          : "Your name could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!isLoaded) {
    return (
      <section className="page-shell">
        <fieldset className="plain-fieldset">
          <legend>Account</legend>
          <p>...</p>
        </fieldset>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <fieldset className="plain-fieldset">
        <legend>Account</legend>
        <table className="plain-table account-table">
          <tbody>
            <tr>
              <th id="account-name-label" scope="row">
                name
              </th>
              <td>
                {user ? (
                  <form className="account-form" onSubmit={saveName}>
                    <span className="account-form__controls">
                      <input
                        aria-labelledby="account-name-label"
                        autoComplete="name"
                        defaultValue={getArtistName(user)}
                        id="account-name"
                        maxLength={ARTIST_NAME_MAX_LENGTH}
                        name="name"
                        required
                        type="text"
                      />
                      <button
                        aria-busy={isSaving}
                        disabled={isSaving}
                        type="submit"
                      >
                        {isSaving ? "saving..." : "save"}
                      </button>
                    </span>
                    {errorMessage ? (
                      <span aria-live="polite" className="account-form__error">
                        {errorMessage}
                      </span>
                    ) : null}
                  </form>
                ) : (
                  "unknown"
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">email</th>
              <td>{user?.primaryEmailAddress?.emailAddress ?? "unknown"}</td>
            </tr>
          </tbody>
        </table>
        <p>
          <button type="button" onClick={() => void signOut({ redirectUrl: "/" })}>
            sign out
          </button>
        </p>
      </fieldset>
      <AccountTracks initialTracks={initialTracks} />
    </section>
  );
}
