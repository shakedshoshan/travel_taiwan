"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map as MapIcon,
  Route,
  UtensilsCrossed,
  BedDouble,
  Lightbulb,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

const NAV_LINKS = [
  { href: "/", label: "מפה", icon: MapIcon },
  { href: "/route", label: "מסלול", icon: Route },
  { href: "/food", label: "אוכל", icon: UtensilsCrossed },
  { href: "/hotels", label: "מלונות", icon: BedDouble },
  { href: "/info", label: "טיפים", icon: Lightbulb },
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

  const hideMapHud =
    pathname === "/" &&
    (store.sheetSnap === "half" ||
      store.sheetSnap === "full" ||
      store.isCityZoomMapOpen);

  return (
    <>
      {/* Slim Top Header Bar */}
      <header
        dir="rtl"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        className={`pointer-events-none fixed top-0 right-0 left-0 z-40 px-2.5 transition-opacity duration-200 md:px-5 ${
          hideMapHud ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="glass-panel pointer-events-auto mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 rounded-2xl px-2.5 shadow-lg md:px-4">
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={() => {
              tripActions.selectCity(null);
              tripActions.setTimelineExpanded(false);
            }}
            className="flex min-h-[44px] shrink-0 items-center gap-2 px-1 text-right"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 text-xs font-black text-white shadow-sm">
              TW
            </div>
            <div className="whitespace-nowrap">
              <span className="font-display text-sm font-black tracking-tight text-slate-900 dark:text-white">
                טייוואן 3D
              </span>
              <span className="mr-1.5 hidden text-[11px] font-medium text-slate-500 sm:inline dark:text-slate-300">
                6.11–8.12 • 33 ימים
              </span>
            </div>
          </Link>

          {/* Action Buttons: Search and Day/Night */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => tripActions.setSearchOpen(true)}
              aria-label="חיפוש מהיר"
              className="toy-button flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Search className="h-4 w-4 text-orange-500" />
              <span className="hidden md:inline">חיפוש</span>
              <kbd className="desktop-only-control hidden rounded bg-slate-900/10 px-1.5 py-0.5 font-mono text-[10px] lg:inline-block dark:bg-white/15">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => tripActions.toggleNightMode()}
              aria-label={store.isNightMode ? "עבור למצב יום" : "עבור למצב לילה"}
              title={store.isNightMode ? "עבור למצב יום" : "עבור למצב לילה"}
              className="toy-button flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-700 hover:bg-slate-900/5 dark:text-amber-300 dark:hover:bg-white/10"
            >
              {store.isNightMode ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Tab Bar (56px + safe-area-inset-bottom) */}
      <nav
        dir="rtl"
        aria-label="ניווט ראשי"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-900/10 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95"
      >
        <div className="mx-auto flex h-14 max-w-xl items-center justify-around px-1">
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
                className={`flex min-h-[44px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-bold transition-colors ${
                  isActive
                    ? "text-orange-600 dark:text-amber-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "stroke-[2.5]" : "stroke-[2]"
                  }`}
                />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
