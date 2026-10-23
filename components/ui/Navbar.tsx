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
import { getTripSpan } from "@/lib/data/tripSpan";
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

  const tripSpan = getTripSpan();

  const hideMapHud =
    pathname === "/" &&
    (store.sheetSnap === "half" ||
      store.sheetSnap === "full" ||
      store.isCityZoomMapOpen);

  return (
    <>
      {/* Top Header Bar (with Desktop >=1024px Top Nav instead of Bottom Tab Bar) */}
      <header
        dir="rtl"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        className={`pointer-events-none fixed top-0 right-0 left-0 z-40 px-2.5 transition-opacity duration-200 md:px-5 ${
          hideMapHud ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="glass-panel pointer-events-auto mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 rounded-2xl px-1.5 shadow-lg md:px-4">
          <div className="flex min-w-0 shrink items-center gap-2">
            <Link
              href="/"
              onClick={() => {
                tripActions.selectCity(null);
                tripActions.setTimelineExpanded(false);
              }}
              className="flex min-h-[44px] min-w-0 shrink items-center gap-1.5 px-0.5 text-right"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 text-[10px] font-black text-white shadow-sm sm:h-8 sm:w-8 sm:text-xs">
                TW
              </div>
              <div
                dir="rtl"
                className="flex items-center gap-1 whitespace-nowrap font-display text-[13px] font-black tracking-tight text-slate-900 sm:text-sm dark:text-white"
              >
                <span>טייוואן</span>
                <span aria-hidden="true">·</span>
                <bdi dir="ltr">3D</bdi>
                <span aria-hidden="true">·</span>
                <bdi dir="ltr">{tripSpan.dateRange}</bdi>
                <span aria-hidden="true">·</span>
                <span>{tripSpan.dayCount} ימים</span>
              </div>
            </Link>

            <span
              title="נתוני הטיול, המפות והגופנים שמורים וזמינים גם ללא קליטה"
              className="hidden shrink-0 items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 sm:inline-flex dark:bg-emerald-500/20 dark:text-emerald-300"
            >
              זמין אופליין ✓
            </span>
          </div>

          {/* Desktop >=1024px Top Navigation Links */}
          <nav
            aria-label="ניווט ראשי בדסקטופ"
            className="hidden items-center gap-1 lg:flex"
          >
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
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-extrabold transition-colors ${
                    isActive
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons: Search and Day/Night */}
          <div className="flex shrink-0 items-center gap-2">
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

      {/* Mobile & Tablet (<1024px) Bottom Tab Bar — hidden on Desktop >=1024px */}
      <nav
        dir="rtl"
        aria-label="ניווט ראשי"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-900/10 bg-white/95 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-slate-950/95"
      >
        <div className="mx-auto flex h-14 max-w-xl items-center gap-2 px-1">
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
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
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
