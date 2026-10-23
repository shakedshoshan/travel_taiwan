"use client";

import Image from "next/image";
import {
  AlertTriangle,
  AppWindow,
  Banknote,
  BellRing,
  CheckCircle2,
  CloudSun,
  CreditCard,
  ExternalLink,
  Smartphone,
  Train,
} from "lucide-react";
import practicalData from "@/data/practical.json";
import { getImageByFile } from "@/lib/data/placeImages";
import { EmergencyAndPhrasesSection } from "@/components/ui/info/EmergencyAndPhrasesSection";
import { ImageCreditsDetails } from "@/components/ui/info/ImageCreditsDetails";
import { PhotoCreditPopover } from "@/components/ui/PhotoCreditPopover";

const TRANSPORT_CARD_IMAGES = [
  "routes/thsr-train.jpg",
  "routes/tra-taroko-express.jpg",
  "routes/taipei-main-station.jpg",
  "routes/kuo-kuang-bus.jpg",
];

export default function InfoPage() {
  const alerts = practicalData.alerts ?? [];

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-4xl space-y-5 px-3.5 pt-16 pb-24 md:px-6 md:pt-20"
    >
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="font-display text-2xl font-black text-slate-900 md:text-3xl dark:text-white">
          טיפים ומידע שימושי לטייוואן
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          התראות עדכניות למסלול, איזי-קארד, סים/eSIM, מזג אוויר בנובמבר, תחבורה, כסף, מספרי חירום ושיחון קולי בסינית.
        </p>
      </div>

      {/* 1. Real-Time Route & Event Alerts from practical.json (P1 #9) */}
      {alerts.length > 0 && (
        <section
          aria-label="התראות ועדכונים חשובים למסלול"
          className="space-y-3 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 shadow-xs md:p-5 dark:border-amber-400/35 dark:bg-amber-500/10"
        >
          <div className="flex items-center gap-2 text-sm font-black text-amber-900 dark:text-amber-300">
            <BellRing className="h-4 w-4 text-orange-500" />
            <span>התראות ועדכונים חשובים למסלול ({alerts.length})</span>
          </div>

          <div className="space-y-2.5">
            {alerts.map((alert) => {
              const isWarning = alert.severity === "warning";
              return (
                <article
                  key={alert.id}
                  className={`rounded-2xl border p-3.5 text-xs ${
                    isWarning
                      ? "border-rose-500/40 bg-white/95 dark:border-rose-400/35 dark:bg-slate-900/90"
                      : "border-amber-500/30 bg-white/95 dark:border-slate-700 dark:bg-slate-900/90"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-display text-sm font-black text-slate-900 dark:text-white">
                      {isWarning ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                      ) : (
                        <BellRing className="h-4 w-4 shrink-0 text-orange-500" />
                      )}
                      <span>{alert.titleHe}</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-black ${
                        isWarning
                          ? "bg-rose-500/15 text-rose-800 dark:bg-rose-500/25 dark:text-rose-200"
                          : "bg-orange-500/15 text-orange-800 dark:bg-orange-500/25 dark:text-amber-200"
                      }`}
                    >
                      {alert.dateHe}
                    </span>
                  </div>

                  <p className="mt-1.5 leading-relaxed text-slate-700 dark:text-slate-200">
                    {alert.detailHe}
                  </p>

                  {alert.sourceUrls && alert.sourceUrls.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
                      {alert.sourceUrls.map((url, idx) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-1 font-bold text-sky-800 underline hover:text-orange-700 dark:text-sky-200"
                        >
                          <span>מקור רשמי {idx + 1}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <EmergencyAndPhrasesSection />

      {/* 3. EasyCard & SIM / eSIM */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
            <CreditCard className="h-4 w-4" />
            <span>{practicalData.easyCard.titleHe}</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {practicalData.easyCard.summaryHe}
          </p>
          <div className="mt-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {practicalData.easyCard.priceHe}
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-200">
            {practicalData.easyCard.tipsHe.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-sky-700 dark:text-sky-300">
            <Smartphone className="h-4 w-4" />
            <span>{practicalData.simEsim.titleHe}</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {practicalData.simEsim.summaryHe}
          </p>
          <div className="mt-3 space-y-2.5">
            {practicalData.simEsim.options.map((opt, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="font-extrabold text-slate-900 dark:text-white">
                  {opt.nameHe}
                </div>
                <div className="mt-0.5 font-mono font-bold text-sky-700 dark:text-sky-300">
                  {opt.priceHe}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {opt.noteHe}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. November Weather per Region */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-amber-600 dark:text-amber-300">
          <CloudSun className="h-4 w-4" />
          <span>מזג אוויר בנובמבר–תחילת דצמבר לפי אזור</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {practicalData.weatherNovember.map((w) => (
            <div
              key={w.regionHe}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {w.regionHe}
                </span>
                <span className="rounded-full bg-amber-400/25 px-2.5 py-0.5 font-mono font-black text-amber-900 dark:text-amber-200">
                  {w.tempHe}
                </span>
              </div>
              <p className="mt-1.5 text-slate-700 dark:text-slate-200">
                {w.conditionHe}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                מה לארוז: {w.packingHe}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Transport, Apps & Cash */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <Train className="h-4 w-4 text-orange-500" />
            <span>תחבורה ברחבי האי</span>
          </div>
          <div className="space-y-2.5 text-xs">
            {practicalData.transportGuide.map((tr, idx) => {
              const routeImg = getImageByFile(
                TRANSPORT_CARD_IMAGES[idx % TRANSPORT_CARD_IMAGES.length]
              );
              return (
                <div
                  key={tr.nameHe}
                  className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60"
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                    <Image
                      src={routeImg.src}
                      alt={tr.nameHe}
                      title={routeImg.attribution}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                    <PhotoCreditPopover
                      image={routeImg}
                      positionClass="bottom-1 left-1 scale-75 origin-bottom-left"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {tr.nameHe}
                    </div>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-200">
                      {tr.detailHe}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <AppWindow className="h-4 w-4 text-sky-500" />
              <span>אפליקציות חובה</span>
            </div>
            <div className="space-y-2 text-xs">
              {practicalData.apps.map((app) => (
                <div
                  key={app.nameHe}
                  className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800"
                >
                  <span className="font-bold text-slate-900 dark:text-white">
                    {app.nameHe}
                  </span>
                  <span className="text-slate-600 dark:text-slate-200">
                    {app.useHe}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <Banknote className="h-4 w-4 text-emerald-500" />
              <span>מזומן, כספומטים והחזר מס</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
              {practicalData.cashTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* 6. Wikimedia Commons Image Credits & Licenses */}
      <ImageCreditsDetails />
    </div>
  );
}
