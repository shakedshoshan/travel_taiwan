"use client";

import { motion } from "framer-motion";
import { TRIP_DATA } from "@/lib/data/loaders";

interface TaiwanLoadingScreenProps {
  visible: boolean;
  progress?: number;
}

export function TaiwanLoadingScreen({
  visible,
  progress = 0,
}: TaiwanLoadingScreenProps) {
  if (!visible) return null;

  const blocks = [
    { label: "טייפה והצפון", color: "bg-emerald-400", delay: 0.05, y: -56 },
    { label: "חואליאן וטארוקו", color: "bg-teal-500", delay: 0.14, y: -18 },
    { label: "רכס ההרים המרכזי", color: "bg-emerald-700", delay: 0.22, y: 0 },
    { label: "אגם השמש והירח ואלישאן", color: "bg-cyan-500", delay: 0.3, y: 18 },
    { label: "טאינאן וקאושיונג", color: "bg-amber-400", delay: 0.38, y: 54 },
  ];

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-sky-950 via-slate-900 to-emerald-950 text-white"
    >
      {/* Animated assembling 3D-style island blocks */}
      <div
        aria-hidden="true"
        className="relative flex h-56 w-56 items-center justify-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-2 border-dashed border-cyan-400/35"
        />

        <div className="relative flex flex-col items-center gap-1.5">
          {blocks.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.3, y: b.y * 1.8, rotateX: 55 }}
              animate={{
                opacity: 1,
                scale: [0.85, 1.04, 1],
                y: 0,
                rotateX: 0,
              }}
              transition={{
                delay: b.delay,
                duration: 0.65,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 0.9,
              }}
              style={{
                width: `${110 - Math.abs(i - 2) * 22}px`,
              }}
              className={`h-7 rounded-2xl ${b.color} flex items-center justify-center border border-white/50 text-[10px] font-bold text-slate-950 shadow-lg`}
            >
              {b.label}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 font-display text-2xl font-extrabold tracking-tight text-amber-300"
      >
        בונים את האי טייוואן בתלת-ממד...
      </motion.h2>
      <p className="mt-3 font-mono text-3xl font-black text-white" aria-live="polite">
        {Math.round(progress)}%
      </p>
      <div className="mt-2 h-2 w-56 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-amber-300 transition-[width] duration-200"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-slate-200">
        6.11 – 8.12.2026 • {TRIP_DATA.cities.length} ערים • {TRIP_DATA.legs.length} מקטעי מסלול •{" "}
        {TRIP_DATA.allPlaces.length} נקודות עניין ({TRIP_DATA.attractions.length} אטרקציות ·{" "}
        {TRIP_DATA.food.length} אוכל · {TRIP_DATA.hotels.length} מלונות)
      </p>
    </motion.div>
  );
}
