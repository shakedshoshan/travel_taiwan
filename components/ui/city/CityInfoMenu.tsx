"use client";

import Image from "next/image";
import { Check, Download, X } from "lucide-react";
import { getCityImages } from "@/lib/data/placeImages";
import type { CityBundle } from "@/lib/data/selectors";
import { DateRange } from "@/components/ui/bidi";
import { useCityOfflineSave } from "./useCityOfflineSave";

export function CityInfoMenu({
  bundle,
  onClose,
}: {
  bundle: CityBundle;
  onClose: () => void;
}) {
  const { city, daysHere } = bundle;
  const images = getCityImages(city.id);
  const offline = useCityOfflineSave(city.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black">מידע</h2>
        <button
          type="button"
          aria-label="סגור מידע"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {offline.saved ? (
        <p className="flex h-11 items-center gap-1 text-xs font-black text-emerald-700">
          <Check className="h-4 w-4" />
          זמין אופליין
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void offline.save()}
          className="flex h-11 items-center justify-center gap-1 rounded-2xl bg-emerald-600 text-xs font-black text-white"
        >
          <Download className="h-4 w-4" />
          {offline.saving ? "שומר..." : "שמור עיר לאופליין"}
        </button>
      )}
      {daysHere.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-black text-slate-500">ימים בעיר</p>
          <ul className="space-y-1">
            {daysHere.slice(0, 8).map((day) => (
              <li key={day.dateIso} className="text-xs font-bold">
                <DateRange>{day.dateShort}</DateRange>
                <span> · {day.weekdayHe}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {images.length > 0 && (
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
          {images.map((image) => (
            <div
              key={image.src}
              className="relative h-24 w-36 shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-200"
            >
              <Image
                src={image.src}
                alt={image.creditHe || city.nameHe}
                fill
                sizes="144px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
