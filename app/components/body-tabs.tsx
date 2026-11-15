import Link from "next/link";
import { ARCHIVE_BODIES } from "@/constants/bodies";

type BodyTabsProps = {
  bodyId: string;
  basePath: "/" | "/missions";
};

/** Moon and Mars. Each link is a full page so the map reloads for that world. */
export function BodyTabs({ bodyId, basePath }: BodyTabsProps) {
  return (
    <nav aria-label="Celestial body" className="flex flex-wrap gap-2">
      {ARCHIVE_BODIES.map((body) => {
        const href = body.id === "moon" ? basePath : `${basePath}?body=${body.id}`;
        const current = body.id === bodyId;
        return (
          <Link
            key={body.id}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 font-ui text-sm no-underline hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-gold/20 ${
              current ? "border-gold bg-gold/20 text-ink" : "border-white/20 bg-white/5 text-ink backdrop-blur-md"
            }`}
          >
            {body.name}
          </Link>
        );
      })}
    </nav>
  );
}
