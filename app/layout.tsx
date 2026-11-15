import type { Metadata } from "next";
import Link from "next/link";
import "@/app/styles/globals.css";

export const metadata: Metadata = {
  title: "Celestial Archives",
  description:
    "A map and timeline of NASA hardware left on the Moon and Mars. Coordinates and dates are copied from NASA sources.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="app-shell">
        <header className="glass mx-3 mt-3 flex shrink-0 flex-col gap-2 rounded-2xl px-4 py-3 sm:mx-4 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="m-0 text-3xl font-medium tracking-tight">Celestial Archives</h1>
            <p className="m-0 mt-1 font-ui text-sm text-gold">NASA Hardware Left Behind</p>
          </div>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-4">
            <Link className="nav-link" href="/">
              Map
            </Link>
            <Link className="nav-link" href="/missions">
              Missions
            </Link>
            <Link className="nav-link" href="/credits">
              Credits
            </Link>
          </nav>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 sm:px-4">{children}</main>
        <footer className="glass mx-3 mb-3 flex shrink-0 flex-col gap-2 rounded-2xl px-4 py-3 font-ui text-sm text-muted sm:mx-4 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Moon and Mars. Coordinates are copied from the cited NASA pages.</span>
          <Link href="/credits">Sources and Super Intelligence (SI) note</Link>
        </footer>
      </body>
    </html>
  );
}
