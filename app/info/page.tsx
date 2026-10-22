"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CreditCard,
  Smartphone,
  CloudSun,
  Train,
  Banknote,
  PhoneCall,
  Volume2,
  AppWindow,
  CheckCircle2,
  Camera,
} from "lucide-react";
import practicalData from "@/data/practical.json";
import {
  getAllImageCredits,
  getImageByFile,
} from "@/lib/data/placeImages";

const TRANSPORT_CARD_IMAGES = [
  "routes/thsr-train.jpg",
  "routes/tra-taroko-express.jpg",
  "routes/taipei-main-station.jpg",
  "routes/kuo-kuang-bus.jpg",
];

export default function InfoPage() {
  const [speakingZh, setSpeakingZh] = useState<string | null>(null);

  const speakMandarin = (textZh: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textZh);
      utterance.lang = "zh-TW";
      utterance.rate = 0.88;
      utterance.onstart = () => setSpeakingZh(textZh);
      utterance.onend = () => setSpeakingZh(null);
      utterance.onerror = () => setSpeakingZh(null);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingZh(null);
    }
  };

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
          איזי-קארד, סים/eSIM, מזג אוויר בנובמבר, תחבורה, כסף, מספרי חירום ושיחון קולי בסינית.
        </p>
      </div>

      {/* 1. Emergency Numbers (110 / 119 / 0800-011-765) */}
      <section className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-rose-700 dark:text-rose-300">
          <PhoneCall className="h-4 w-4" />
          <span>מספרי חירום וסיוע לתיירים 24/7</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {practicalData.emergencyNumbers.map((em) => (
            <a
              key={em.number}
              href={`tel:${em.number}`}
              className="toy-button flex min-h-[56px] items-center justify-between rounded-2xl border border-rose-500/25 bg-white p-3 shadow-xs dark:bg-slate-900"
            >
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {em.labelHe}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {em.noteHe}
                </div>
              </div>
              <span className="rounded-xl bg-rose-600 px-2.5 py-1 font-mono text-sm font-black text-white">
                {em.number}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* 2. Interactive Mandarin Phrasebook with zh-TW Speech */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-orange-600 dark:text-amber-300">
            <Volume2 className="h-4 w-4" />
            <span>שיחון מהיר לדוכנים ושווקי לילה (לחצו להשמעה בסינית)</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {practicalData.phrases.map((ph) => {
            const isSpeaking = speakingZh === ph.zh;
            return (
              <button
                key={ph.zh}
                type="button"
                onClick={() => speakMandarin(ph.zh)}
                className={`toy-button flex min-h-[60px] items-center justify-between gap-3 rounded-2xl border p-3 text-right transition-all ${
                  isSpeaking
                    ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500"
                    : "border-slate-200 bg-slate-50 hover:border-orange-400 dark:border-slate-800 dark:bg-slate-800/60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {ph.meaningHe}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                    {ph.pronunciationHe}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-display text-base font-black text-orange-600 dark:text-amber-300">
                    {ph.zh}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <Volume2 className="h-4 w-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. EasyCard & SIM / eSIM */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
            <CreditCard className="h-4 w-4" />
            <span>{practicalData.easyCard.titleHe}</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {practicalData.easyCard.summaryHe}
          </p>
          <div className="mt-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {practicalData.easyCard.priceHe}
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
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
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
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
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
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
                <span className="rounded-full bg-amber-400/25 px-2.5 py-0.5 font-mono font-black text-amber-900 dark:text-amber-300">
                  {w.tempHe}
                </span>
              </div>
              <p className="mt-1.5 text-slate-700 dark:text-slate-300">
                {w.conditionHe}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
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
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {tr.nameHe}
                    </div>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300">
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
                  <span className="text-slate-600 dark:text-slate-300">
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
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
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

      {/* 6. Wikimedia Commons Image Credits & Licenses (CC BY / CC BY-SA Attribution) */}
      <details className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:p-5 dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex cursor-pointer items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-orange-500" />
            <span>
              קרדיטים ורישיונות תמונות – Wikimedia Commons ({getAllImageCredits().length} תמונות)
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
          {getAllImageCredits().map((item) => (
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
    </div>
  );
}
