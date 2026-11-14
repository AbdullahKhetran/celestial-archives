import type { Citation } from "@/types/archive";

type CitationsProps = {
  items: Citation[];
};

export default function Citations({ items }: CitationsProps) {
  if (items.length === 0) return null;
  return (
    <ul className="m-0 grid list-none gap-1 p-0 font-ui text-sm">
      {items.map((item) => (
        <li key={item.sourceId} className="flex flex-wrap items-baseline gap-2">
          <a className="text-sea dark:text-sea-inverse" href={item.url} rel="noreferrer">
            {item.title}
          </a>
          <span className="quiet">{item.publisher}</span>
        </li>
      ))}
    </ul>
  );
}
