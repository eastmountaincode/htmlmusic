import Link from "next/link";
import { HeaderAuth } from "@/components/auth/header-auth";
import { HeaderNav } from "@/components/header-nav";

export function SiteHeader() {
  return (
    <header className="site-header" data-dev-outline="header">
      <div className="site-header__inner" data-dev-outline="header-inner">
        <h1 className="site-header__title" data-dev-outline="header-title">
          <Link data-dev-outline="header-title-link" href="/">
            <span data-dev-outline="header-title-text">HTML</span>
            <img
              alt="Music"
              className="site-header__music-word"
              data-dev-outline="header-music-word"
              height={82}
              src="/brand/20-31.png"
              width={180}
            />
            <img
              alt=""
              aria-hidden="true"
              className="site-header__music-mark"
              data-dev-outline="header-music-mark"
              height={58}
              src="/brand/20-5.png"
              width={319}
            />
          </Link>
        </h1>
        <div className="site-header__right" data-dev-outline="header-right">
          <HeaderNav />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
