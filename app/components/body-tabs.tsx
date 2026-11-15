import Link from "next/link";
import { ARCHIVE_BODIES } from "@/constants/bodies";

type BodyTabsProps = {
  bodyId: string;
  basePath: "/" | "/missions";
};

/** Moon and Mars. Each link is a full page so the map, filters, and ledger reload for that world. */
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
            className={`rounded-full border px-3 py-1.5 font-ui text-sm no-underline hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-gold/20 dark:hover:border-gold-inverse dark:focus-visible:outline-gold-inverse dark:active:bg-gold-inverse/20 ${
              current
                ? "border-gold bg-gold/15 text-ink dark:border-gold-inverse dark:bg-gold-inverse/15 dark:text-ink-inverse"
                : "border-rule bg-control text-ink dark:border-rule-inverse dark:bg-control-inverse dark:text-ink-inverse"
            }`}
          >
            {body.name}
          </Link>
        );
      })}
    </nav>
  );
}
