"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Heart, CheckCircle2, ArrowLeft } from "lucide-react";
import {
  getAllPlaces,
  getPlaceById,
  searchEverything,
} from "@/lib/data/selectors";
import {
  getCityPrimaryImage,
  getPlaceImage,
  getRouteLegImage,
} from "@/lib/data/placeImages";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export function CommandSearch() {
  const router = useRouter();
  const store = useTripStore();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"search" | "favorites" | "done">("search");

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        tripActions.setSearchOpen(!store.isSearchOpen);
      } else if (e.key === "Escape" && store.isSearchOpen) {
        tripActions.setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store.isSearchOpen]);

  const searchResults = useMemo(() => {
    if (mode === "favorites") {
      return getAllPlaces()
        .filter((p) => store.favorites.includes(p.id))
        .map((p) => ({
          id: p.id,
          kind: p.kind,
          titleHe: p.name,
          subtitle: `${p.cityNameHe} • ${p.description}`,
          badgeHe: "מועדף ♥",
          cityId: p.cityId,
          href: `/place/${p.id}`,
        }));
    }
    if (mode === "done") {
      return getAllPlaces()
        .filter((p) => store.donePlaces.includes(p.id))
        .map((p) => ({
          id: p.id,
          kind: p.kind,
          titleHe: p.name,
          subtitle: `${p.cityNameHe} • ${p.description}`,
          badgeHe: "בוצע ✓",
          cityId: p.cityId,
          href: `/place/${p.id}`,
        }));
    }
    return searchEverything(query);
  }, [query, mode, store.favorites, store.donePlaces]);

  if (!store.isSearchOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-sm"
      onClick={() => tripActions.setSearchOpen(false)}
    >
      <div
        className="glass-panel w-full max-w-2xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl dark:bg-slate-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-slate-900/10 px-4 py-3.5 dark:border-white/10">
          <Search className="h-5 w-5 text-orange-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setMode("search");
              setQuery(e.target.value);
            }}
            placeholder="חפשו עיר, אטרקציה, שוק לילה, מישלן, מלון (בעברית או אנגלית)..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          <button
            type="button"
            onClick={() => tripActions.setSearchOpen(false)}
            className="rounded-xl bg-slate-900/5 p-1.5 text-slate-500 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switcher: All / Favorites / Done */}
        <div className="flex items-center gap-2 border-b border-slate-900/5 bg-slate-900/5 px-4 py-2 text-xs dark:border-white/5 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setMode("search")}
            className={`rounded-xl px-3 py-1 font-bold ${
              mode === "search"
                ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            חיפוש הכל
          </button>
          <button
            type="button"
            onClick={() => setMode("favorites")}
            className={`flex items-center gap-1 rounded-xl px-3 py-1 font-bold ${
              mode === "favorites"
                ? "bg-rose-500 text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <Heart className="h-3.5 w-3.5" />
            <span>מועדפים ({store.favorites.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("done")}
            className={`flex items-center gap-1 rounded-xl px-3 py-1 font-bold ${
              mode === "done"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>בוצעו ({store.donePlaces.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] divide-y divide-slate-900/5 overflow-y-auto p-2 dark:divide-white/5">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              לא נמצאו תוצאות מתאימות.
            </div>
          ) : (
            searchResults.map((item) => {
              let thumbSrc = getCityPrimaryImage(item.cityId).src;
              if (item.kind === "leg") {
                const order = Number(item.id.replace("leg-", "")) || 1;
                thumbSrc = getRouteLegImage(order, item.cityId).src;
              } else if (item.kind !== "city") {
                const place = getPlaceById(item.id);
                if (place) thumbSrc = getPlaceImage(place).src;
              }

              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  onClick={() => {
                    tripActions.setSearchOpen(false);
                    if (item.kind === "city") {
                      tripActions.selectCity(item.cityId);
                      router.push("/");
                    } else {
                      tripActions.selectCity(item.cityId);
                      router.push(item.href);
                    }
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl p-2.5 text-right transition-colors hover:bg-orange-500/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbSrc}
                    alt={item.titleHe}
                    loading="lazy"
                    className="h-12 w-16 shrink-0 rounded-xl bg-slate-900 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-display text-sm font-bold text-slate-900 dark:text-white">
                        {item.titleHe}
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-900/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-amber-300">
                        {item.badgeHe}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.subtitle}
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
