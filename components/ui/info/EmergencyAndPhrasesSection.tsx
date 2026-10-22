"use client";

import { useState } from "react";
import { PhoneCall, Volume2 } from "lucide-react";
import practicalData from "@/data/practical.json";

export function EmergencyAndPhrasesSection() {
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
    <>
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
    </>
  );
}
