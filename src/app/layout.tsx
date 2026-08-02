import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { DevOutlineToggle } from "@/components/dev-outline-toggle";
import {
  AudioPlayerProvider,
  PersistentAudioPlayer,
} from "@/components/persistent-audio-player";
import { DiscoverReturnProvider } from "@/components/discover-return-state";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTML Music",
  description: "A small web music library built with Next.js and Tailwind.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const devOutlinesEnabled =
    process.env.NEXT_PUBLIC_ENABLE_DEV_OUTLINES === "true";

  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <AudioPlayerProvider>
            <DiscoverReturnProvider>
              <div className="site-chrome">
                <SiteHeader />
              </div>
              {children}
              <PersistentAudioPlayer />
              {devOutlinesEnabled ? <DevOutlineToggle /> : null}
            </DiscoverReturnProvider>
          </AudioPlayerProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
