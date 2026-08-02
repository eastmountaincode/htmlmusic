"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { getArtistName } from "@/lib/artist-name";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderAuth() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <nav
        aria-busy="true"
        aria-label="account"
        className="header-auth"
        data-dev-outline="header-auth-loading"
      >
        <span aria-hidden="true">sign in</span>
        <span aria-hidden="true">sign up</span>
      </nav>
    );
  }

  if (!isSignedIn) {
    return (
      <nav
        aria-label="account"
        className="header-auth"
        data-dev-outline="header-auth"
      >
        <Link
          aria-current={isActivePath(pathname, "/sign-in") ? "page" : undefined}
          data-dev-outline="header-auth-sign-in"
          href="/sign-in"
        >
          sign in
        </Link>
        <Link
          aria-current={isActivePath(pathname, "/sign-up") ? "page" : undefined}
          data-dev-outline="header-auth-sign-up"
          href="/sign-up"
        >
          sign up
        </Link>
      </nav>
    );
  }

  const label = getArtistName(user);

  return (
    <nav
      aria-label="account"
      className="header-auth"
      data-dev-outline="header-auth"
    >
      <Link
        aria-current={isActivePath(pathname, "/account") ? "page" : undefined}
        data-dev-outline="header-auth-account"
        href="/account"
        prefetch={false}
        title={label}
      >
        account
      </Link>
    </nav>
  );
}
