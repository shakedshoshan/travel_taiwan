import type { PhilippinesCategoryId } from "./types";

export interface PhilippinesCategoryMeta {
  id: PhilippinesCategoryId;
  labelHe: string;
  emoji: string;
  accentClass: string;
}

export const PHILIPPINES_CATEGORIES: PhilippinesCategoryMeta[] = [
  {
    id: "attractions",
    labelHe: "אטרקציות",
    emoji: "🏝️",
    accentClass: "from-sky-500 to-blue-600",
  },
  {
    id: "food",
    labelHe: "אוכל",
    emoji: "🍜",
    accentClass: "from-orange-500 to-amber-500",
  },
  {
    id: "hotels",
    labelHe: "מלונות",
    emoji: "🏨",
    accentClass: "from-indigo-500 to-violet-600",
  },
  {
    id: "events",
    labelHe: "אירועים",
    emoji: "🎉",
    accentClass: "from-fuchsia-500 to-pink-600",
  },
  {
    id: "nature",
    labelHe: "טבע",
    emoji: "🌿",
    accentClass: "from-emerald-500 to-green-600",
  },
  {
    id: "activities",
    labelHe: "פעילויות",
    emoji: "🚤",
    accentClass: "from-cyan-500 to-teal-600",
  },
  {
    id: "practical",
    labelHe: "מידע שימושי",
    emoji: "📋",
    accentClass: "from-slate-600 to-slate-800",
  },
];

export function getCategoryMeta(id: PhilippinesCategoryId) {
  return PHILIPPINES_CATEGORIES.find((c) => c.id === id)!;
}
