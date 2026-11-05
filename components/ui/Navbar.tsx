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
  Palmtree,
} from "lucide-react";
import { getTripSpan } from "@/lib/data/tripSpan";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

const NAV_LINKS = [
  { href: "/", label: "מפה", icon: MapIcon },
  { href: "/route", label: "מסלול", icon: Route },
  { href: "/food", label: "אוכל", icon: UtensilsCrossed },
  { href: "/hotels", label: "מלונות", icon: BedDouble },
  { href: "/info", label: "טיפים", icon: Lightbulb },
  { href: "/philippines", label: "פיליפינים", icon: Palmtree },
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

  const cityMode = pathname === "/" && Boolean(store.selectedCityId);

  return (
    <>
      {/* Top Header Bar (with Desktop >=1024px Top Nav instead of Bottom Tab Bar) */}
      <header
        dir="rtl"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        className={`pointer-events-none fixed top-0 right-0 left-0 z-40 px-2.5 transition-opacity duration-200 max-[420px]:px-2 md:px-5 ${
          cityMode ? "max-lg:hidden" : ""
        }`}
      >
        <div className="glass-panel pointer-events-auto mx-auto flex h-12 max-h-16 max-w-7xl flex-nowrap items-center justify-between gap-x-2 overflow-hidden rounded-2xl px-2 shadow-lg md:px-4">
          <div className="flex min-w-0 shrink items-center gap-2">
            <Link
              href="/"
              onClick={() => {
                tripActions.selectCity(null);
              }}
              className="flex min-h-[44px] min-w-0 shrink items-center gap-1.5 px-0.5 text-right"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 text-xs font-black text-white shadow-sm sm:h-8 sm:w-8 sm:text-xs">
                TW
              </div>
              <div
                dir="rtl"
                className="flex min-w-0 items-center gap-1 font-display text-xs font-black leading-tight tracking-tight text-slate-900 dark:text-white"
              >
                <span className="lg:hidden">טייוואן · 3D</span>
                <span className="hidden lg:inline">טייוואן</span>
                <span aria-hidden="true" className="hidden lg:inline">
                  ·
                </span>
                <bdi dir="ltr" className="hidden lg:inline">
                  3D
                </bdi>
                <span aria-hidden="true" className="hidden xl:inline">
                  ·
                </span>
                <bdi dir="ltr" className="hidden xl:inline">
                  {tripSpan.dateRange}
                </bdi>
                <span aria-hidden="true" className="hidden xl:inline">
                  ·
                </span>
                <span className="hidden xl:inline">{tripSpan.dayCount} ימים</span>
              </div>
            </Link>

            <span
              title="נתוני הטיול, המפות והגופנים שמורים וזמינים גם ללא קליטה"
              className="hidden shrink-0 items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-extrabold text-emerald-800 sm:inline-flex dark:bg-emerald-500/20 dark:text-emerald-300"
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
                  className={`flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-extrabold transition-colors ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
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
              className="toy-button flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-slate-700 active:scale-[0.97] dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Search className="h-4 w-4 text-orange-500" />
              <span className="hidden md:inline">חיפוש</span>
              <kbd className="desktop-only-control hidden rounded bg-slate-900/10 px-1.5 py-0.5 font-mono text-xs lg:inline-block dark:bg-white/15">
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
        className={`fixed right-0 bottom-0 left-0 z-40 border-t border-[color:var(--border)] bg-[var(--map-chrome-bg)] backdrop-blur-xl ${
          cityMode ? "hidden" : "lg:hidden"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-xl items-center gap-0.5 px-0.5">
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
                className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors duration-[var(--duration-fast)] active:scale-[0.97] sm:text-[11px] ${
                  isActive
                    ? "bg-[var(--primary-muted)] text-[var(--primary)] dark:text-amber-300"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
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
