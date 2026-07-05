"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "river" },
  { href: "/groups", label: "groups" },
  { href: "/upload", label: "upload" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="site"
      className="site-header__nav"
      data-dev-outline="header-nav"
    >
      {navLinks.map((link) => {
        const isActive = isActivePath(pathname, link.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            data-dev-outline={`header-nav-${link.label}`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
