import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/constants/theme";
import ThemeToggle from "@/app/components/theme-toggle";
import "@/app/styles/globals.css";

export const metadata: Metadata = {
  title: "Celestial Archives",
  description:
    "A map and timeline of NASA hardware left on the Moon and Mars. Coordinates and dates are copied from NASA sources.",
};

const themeBoot = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="app-shell">
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <header className="flex flex-col gap-4 px-4 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="eyebrow">NASA hardware left behind</p>
            <h1 className="m-0 text-3xl font-medium tracking-tight">Celestial Archives</h1>
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
            <ThemeToggle />
          </nav>
        </header>
        <main className="px-4 pt-4 pb-8 sm:px-6">{children}</main>
        <footer className="flex flex-col gap-3 px-4 pb-6 font-ui text-sm text-muted sm:flex-row sm:items-end sm:justify-between sm:px-6 dark:text-muted-inverse">
          <span>Moon and Mars. Coordinates are copied from the cited NASA pages.</span>
          <Link href="/credits">Sources and Super Intelligence (SI) note</Link>
        </footer>
      </body>
    </html>
  );
}
