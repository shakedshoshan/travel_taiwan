import { ListChecks } from "lucide-react";
import { LIVE_GUIDE } from "@/lib/data/liveGuide";
import { LiveGuidePageClient } from "@/components/ui/live-guide/LiveGuidePageClient";

export default function LiveGuidePage() {
  const disclaimer =
    LIVE_GUIDE.disclaimerHe ??
    "סטטוסים בטבלה הם מידע מהמקור — לא אימות חי.";
  const routeHl =
    LIVE_GUIDE.routeHighlightsHe ??
    "אגם הירח והשמש וכפר התרבות האבוריג׳יני במסלול המקורי מסומנים כחובה.";

  return (
    <div
      dir="rtl"
      className="app-scroll-page mx-auto max-w-6xl space-y-5 px-3.5 pb-24 md:px-6"
    >
      <div className="surface-card rounded-3xl p-4 md:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 text-white shadow-md">
            <ListChecks className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-black text-slate-900 md:text-3xl dark:text-white">
              מדריך משולב — המלצות
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              טבלה מרוכזת של כל המקורות (מזרחניק + מאגר האפליקציה + העדפות), עם
              סינון וחיפוש. ללא ארגון יום-אחר-יום.
            </p>
          </div>
        </div>
      </div>

      <LiveGuidePageClient
        entries={LIVE_GUIDE.entries}
        totalCount={LIVE_GUIDE.entries.length}
        excludedCount={LIVE_GUIDE.excludedCount}
        disclaimerHe={disclaimer}
        routeHighlightsHe={routeHl}
      />
    </div>
  );
}
