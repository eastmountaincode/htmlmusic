"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AccountTracks } from "@/components/account-tracks";
import type { RiverSong } from "@/components/river-recording-row";
import {
  ARTIST_NAME_MAX_LENGTH,
  getArtistName,
} from "@/lib/artist-name";

type AccountTab = "settings" | "tracks";

type ClerkWindow = Window & {
  __internal_onBeforeSetActive?: (
    intent?: string | null,
  ) => Promise<void> | void;
};

function AccountTabs({ activeTab }: { activeTab: AccountTab }) {
  return (
    <nav aria-label="account sections" className="account-tabs">
      <Link
        aria-current={activeTab === "settings" ? "page" : undefined}
        href="/account"
      >
        settings
      </Link>
      <Link
        aria-current={activeTab === "tracks" ? "page" : undefined}
        href="/account?tab=tracks"
      >
        tracks
      </Link>
    </nav>
  );
}

export function AccountPanel({
  activeTab,
  initialTracks,
}: {
  activeTab: AccountTab;
  initialTracks: RiverSong[];
}) {
  const { signOut } = useClerk();
  const { isLoaded, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
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

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setErrorMessage("");

    const clerkWindow = window as ClerkWindow;
    const originalBeforeSetActive =
      clerkWindow.__internal_onBeforeSetActive;

    // ClerkJS currently omits the "sign-out" intent here, so Clerk's Next 16
    // adapter attempts a protected Server Action after clearing the session.
    // Skip only this click's first hook call; all other auth transitions still
    // use Clerk's cache invalidation behavior.
    const beforeSignOut = (intent?: string | null) => {
      clerkWindow.__internal_onBeforeSetActive = originalBeforeSetActive;

      if (intent == null) return Promise.resolve();
      return Promise.resolve(originalBeforeSetActive?.(intent));
    };

    clerkWindow.__internal_onBeforeSetActive = beforeSignOut;

    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      setErrorMessage("You could not be signed out. Try again.");
    } finally {
      if (clerkWindow.__internal_onBeforeSetActive === beforeSignOut) {
        clerkWindow.__internal_onBeforeSetActive = originalBeforeSetActive;
      }
      setIsSigningOut(false);
    }
  }

  if (!isLoaded) {
    return (
      <section className="page-shell account-page">
        <AccountTabs activeTab={activeTab} />
        <fieldset
          className={`plain-fieldset${
            activeTab === "tracks" ? " account-tracks" : ""
          }`}
        >
          <legend>{activeTab}</legend>
          <p>...</p>
        </fieldset>
      </section>
    );
  }

  return (
    <section className="page-shell account-page">
      <AccountTabs activeTab={activeTab} />
      {activeTab === "tracks" ? (
        <AccountTracks initialTracks={initialTracks} />
      ) : (
        <fieldset className="plain-fieldset">
          <legend>settings</legend>
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
                        <span
                          aria-live="polite"
                          className="account-form__error"
                        >
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
            <button
              aria-busy={isSigningOut}
              disabled={isSigningOut}
              type="button"
              onClick={() => void handleSignOut()}
            >
              {isSigningOut ? "signing out..." : "sign out"}
            </button>
          </p>
        </fieldset>
      )}
    </section>
  );
}
