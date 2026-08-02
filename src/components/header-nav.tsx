"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "discover", outlineKey: "discover" },
  { href: "/upload", label: "upload", outlineKey: "upload" },
  { href: "/about", label: "about", outlineKey: "about" },
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
            data-dev-outline={`header-nav-${link.outlineKey}`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
      <a
        data-dev-outline="header-nav-support"
        href="https://ko-fi.com/goodbyeoblivion"
        rel="noopener noreferrer"
        target="_blank"
      >
        support
      </a>
    </nav>
  );
}
