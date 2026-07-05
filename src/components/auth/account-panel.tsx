"use client";

import { useClerk, useUser } from "@clerk/nextjs";

export function AccountPanel() {
  const { signOut } = useClerk();
  const { isLoaded, user } = useUser();

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
        <table className="plain-table">
          <tbody>
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
    </section>
  );
}
