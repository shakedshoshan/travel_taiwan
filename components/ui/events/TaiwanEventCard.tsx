"use client";

import Link from "next/link";
import { ExternalLink, Ticket } from "lucide-react";
import type { TaiwanEventRow } from "@/lib/data/taiwanEvents";
import { taiwanEventBadge } from "@/lib/data/taiwanEventBadge";

export function TaiwanEventCard({ event }: { event: TaiwanEventRow }) {
  const badge = taiwanEventBadge(event.statusKind);

  return (
    <article className="surface-card rounded-2xl p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-black leading-snug text-slate-900 dark:text-white">
            {event.titleHe}
          </h3>
          <p className="mt-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            {event.cityHe}
            {event.legLabelHe ? ` · ${event.legLabelHe}` : ""}
          </p>
        </div>
        <span
          data-testid={badge.dataTestId}
          className={`inline-flex min-h-6 shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${badge.className}`}
        >
          {event.statusLabelHe}
        </span>
      </div>
      <p className="mt-2 text-xs font-mono font-bold text-[var(--primary)] dark:text-amber-300">
        {event.dateHe}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {event.detailHe}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {event.placeId ? (
          <Link
            href={`/place/${event.placeId}`}
            className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-3 text-xs font-bold text-white active:scale-[0.98] dark:bg-amber-400 dark:text-slate-950"
          >
            פרטים
          </Link>
        ) : null}
        {event.ticketUrl ? (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-[var(--primary-muted)] px-3 text-xs font-bold text-[var(--primary)] active:scale-[0.98] dark:text-amber-300"
          >
            <Ticket className="h-4 w-4" />
            כרטיסים
          </a>
        ) : null}
        {event.sourceUrl ? (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 text-xs font-bold text-slate-700 active:scale-[0.98] dark:text-slate-200"
          >
            <ExternalLink className="h-4 w-4" />
            מקור
          </a>
        ) : null}
      </div>
    </article>
  );
}
