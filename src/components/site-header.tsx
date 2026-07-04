import Link from "next/link";
import { HeaderAuth } from "@/components/auth/header-auth";

export function SiteHeader() {
  return (
    <header className="site-header" data-dev-outline="header">
      <div className="site-header__inner">
        <h1 className="site-header__title">
          <Link href="/">HTML Music</Link>
        </h1>
        <div className="site-header__right">
          <nav className="site-header__nav" aria-label="site">
            <Link href="/">feed</Link>
            <Link href="/groups">groups</Link>
            <Link href="/upload">upload</Link>
          </nav>
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
