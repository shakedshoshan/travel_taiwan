"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getTaiwanEventsGroupedByMonth } from "@/lib/data/taiwanEvents";
import { getPhilippinesRowsForCategory } from "@/lib/data/philippines/loaders";
import {
  groupByMonth,
  monthBucketFromSortKey,
  parseEventSortKey,
} from "@/lib/data/eventDates";
import {
  eventsCountryForPath,
  readStoredCountry,
  type TripCountry,
} from "@/lib/ui/tripCountry";
import { PhilippinesRowCard } from "@/components/ui/philippines/PhilippinesRowCard";
import { TaiwanEventCard } from "@/components/ui/events/TaiwanEventCard";

export function EventsExplorer() {
  const pathname = usePathname();
  const [storedCountry, setStoredCountry] = useState<TripCountry | null>(null);

  useEffect(() => {
    setStoredCountry(readStoredCountry());
  }, [pathname]);

  const country = eventsCountryForPath(pathname, storedCountry);
  const taiwanGroups = useMemo(() => getTaiwanEventsGroupedByMonth(), []);

  const philippinesGroups = useMemo(() => {
    const rows = getPhilippinesRowsForCategory("events").map((row) => {
      const sortKey = parseEventSortKey(row.dates ?? "");
      const { monthKey, monthLabelHe } = monthBucketFromSortKey(sortKey);
      return { ...row, sortKey, monthKey, monthLabelHe };
    });
    return groupByMonth(rows);
  }, []);

  const isPhilippines = country === "philippines";

  return (
    <div
      dir="rtl"
      className="app-scroll-page mx-auto max-w-3xl px-3.5 md:px-6"
      data-testid="events-page"
      data-events-country={country}
    >
      <div className="surface-card mb-4 rounded-3xl p-4 md:p-5">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--primary)]">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>{isPhilippines ? "פיליפינים" : "טייוואן"}</span>
        </div>
        <h1 className="mt-1 font-display text-2xl font-black text-slate-900 dark:text-white">
          אירועים מיוחדים
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          פסטיבלים, הופעות, מסיבות ואירועים לפי תאריך — עם סטטוס וקישור למקור
          או כרטיסים כשיש.
        </p>
      </div>

      {isPhilippines ? (
        philippinesGroups.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold text-slate-500">
            אין אירועים להצגה
          </p>
        ) : (
          philippinesGroups.map((group) => (
            <section key={group.monthKey} className="mb-6">
              <h2 className="sticky top-[calc(3.25rem+env(safe-area-inset-top))] z-10 mb-2 border-b border-[color:var(--border)] bg-[var(--background)] py-2 font-display text-base font-black text-slate-900 dark:text-white">
                {group.monthLabelHe}
              </h2>
              <div className="space-y-3">
                {group.rows.map((row) => (
                  <PhilippinesRowCard key={row.id} row={row} />
                ))}
              </div>
            </section>
          ))
        )
      ) : taiwanGroups.length === 0 ? (
        <p className="py-8 text-center text-sm font-bold text-slate-500">
          אין אירועים להצגה
        </p>
      ) : (
        taiwanGroups.map((group) => (
          <section key={group.monthKey} className="mb-6">
            <h2 className="sticky top-[calc(3.25rem+env(safe-area-inset-top))] z-10 mb-2 border-b border-[color:var(--border)] bg-[var(--background)] py-2 font-display text-base font-black text-slate-900 dark:text-white">
              {group.monthLabelHe}
            </h2>
            <div className="space-y-3">
              {group.rows.map((event) => (
                <TaiwanEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
