import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { DevOutlineToggle } from "@/components/dev-outline-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTML Music",
  description: "A small web music library built with Next.js and Tailwind.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
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
          {children}
          {devOutlinesEnabled ? <DevOutlineToggle /> : null}
        </ClerkProvider>
      </body>
    </html>
  );
}
