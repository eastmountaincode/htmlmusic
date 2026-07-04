"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function HeaderAuth() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <span className="header-auth">checking account...</span>;
  }

  if (!isSignedIn) {
    return (
      <nav className="header-auth" aria-label="account">
        <Link href="/sign-in">sign in</Link>
        <Link href="/sign-up">sign up</Link>
      </nav>
    );
  }

  const label =
    user.username ??
    user.primaryEmailAddress?.emailAddress ??
    user.fullName ??
    "signed in";

  return (
    <nav className="header-auth" aria-label="account">
      <Link href="/account" title={label}>
        account
      </Link>
    </nav>
  );
}
