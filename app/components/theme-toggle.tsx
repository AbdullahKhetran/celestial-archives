"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/constants/theme";

function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function readDarkTheme() {
  return document.documentElement.classList.contains("dark");
}

/**
 * Toggles the `dark` class on the document so Tailwind's class strategy can restyle the archive.
 */
export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeToTheme, readDarkTheme, () => false);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      className="rounded-full border border-rule bg-control px-3 py-1 font-ui text-sm hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-paper2 dark:border-rule-inverse dark:bg-control-inverse dark:hover:border-gold-inverse dark:active:bg-paper2-inverse"
      aria-pressed={dark}
      onClick={toggleTheme}
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}
