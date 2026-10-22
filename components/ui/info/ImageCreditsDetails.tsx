"use client";

import { Camera } from "lucide-react";
import { getAllImageCredits } from "@/lib/data/placeImages";

export function ImageCreditsDetails() {
  const credits = getAllImageCredits();

  return (
    <details className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
      <summary className="flex cursor-pointer items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
        <span className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-orange-500" />
          <span>
            קרדיטים ורישיונות תמונות – Wikimedia Commons ({credits.length} תמונות)
          </span>
        </span>
        <span className="text-[11px] font-semibold text-orange-600 dark:text-amber-300">
          לחצו לפתיחת הרשימה המלאה
        </span>
      </summary>
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        כל התמונות בפרויקט מופצות ברישיונות חופשיים (CC0, Public Domain, CC BY, CC BY-SA) מתוך ויקישיתוף. תמונות המסומנות כ-&quot;תמונה מייצגת&quot; מציגות את המנה או האזור ולא את בית העסק הספציפי.
      </p>
      <div
        dir="ltr"
        className="mt-3 max-h-80 space-y-1.5 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[11px] dark:border-slate-800 dark:bg-slate-800/50"
      >
        {credits.map((item) => (
          <div
            key={item.file}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5 last:border-0 dark:border-slate-700/50"
          >
            <span className="font-mono text-[10px] text-slate-500">
              {item.file}
            </span>
            <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
              <a
                href={item.source}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                {item.title}
              </a>{" "}
              by {item.author}
            </span>
            {item.license_url ? (
              <a
                href={item.license_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              >
                {item.license}
              </a>
            ) : (
              <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {item.license}
              </span>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
