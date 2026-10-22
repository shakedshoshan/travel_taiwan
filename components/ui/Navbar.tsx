"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map as MapIcon,
  Route,
  UtensilsCrossed,
  BedDouble,
  Search,
  Wallet,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

const NAV_LINKS = [
  { href: "/", label: "מפת 3D", icon: MapIcon },
  { href: "/route", label: "המסלול (10 מקטעים)", icon: Route },
  { href: "/food", label: "אוכל ושווקים (80)", icon: UtensilsCrossed },
  { href: "/hotels", label: "מלונות (37)", icon: BedDouble },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const store = useTripStore();

  useEffect(() => {
    tripActions.hydrate();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", store.isNightMode);
    document.documentElement.setAttribute(
      "data-theme",
      store.isNightMode ? "night" : "day"
    );
  }, [store.isNightMode]);

  return (
    <header
      dir="rtl"
      className="pointer-events-none fixed top-0 right-0 left-0 z-40 px-3 pt-3 md:px-6"
    >
      <div className="glass-panel pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-3xl px-3.5 py-2.5 md:px-5">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-right transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 text-lg font-black text-white shadow-md shadow-orange-500/25">
            TW
          </div>
          <div>
            <div className="font-display text-base font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
              טייוואן 3D
            </div>
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              6.11 – 8.12.2026 • 33 ימים
            </div>
          </div>
        </Link>

        {/* Main Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`toy-button flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm dark:bg-amber-400 dark:text-slate-950"
                    : "text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons: Search Cmd+K, Budget, Favorites, Night Mode */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => tripActions.setSearchOpen(true)}
            className="toy-button flex items-center gap-2 rounded-2xl border border-slate-900/10 bg-white/70 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-white dark:border-white/15 dark:bg-slate-800/80 dark:text-slate-200"
          >
            <Search className="h-3.5 w-3.5 text-orange-500" />
            <span className="hidden sm:inline">חיפוש מהיר...</span>
            <kbd className="rounded bg-slate-900/10 px-1.5 py-0.5 font-mono text-[10px] dark:bg-white/15">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => tripActions.setBudgetOpen(true)}
            className="toy-button flex items-center gap-1.5 rounded-2xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-300"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">תקציב</span>
          </button>

          {store.favorites.length > 0 && (
            <button
              type="button"
              onClick={() => tripActions.setSearchOpen(true)}
              className="toy-button flex items-center gap-1 rounded-2xl bg-rose-500/15 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-300"
              title="מועדפים ששמרתם"
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
              <span>{store.favorites.length}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => tripActions.toggleNightMode()}
            className="toy-button flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 dark:bg-white/10 dark:text-amber-300"
            title={store.isNightMode ? "עבור למצב יום" : "עבור למצב לילה"}
          >
            {store.isNightMode ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="glass-panel pointer-events-auto mx-auto mt-1.5 flex max-w-md items-center justify-around rounded-2xl p-1 md:hidden">
        {NAV_LINKS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
