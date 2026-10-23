"use client";

import { useState } from "react";
import type { PlaceImageMeta } from "@/lib/data/placeImages";

interface PhotoCreditPopoverProps {
  image: PlaceImageMeta;
  positionClass?: string;
}

export function PhotoCreditPopover({
  image,
  positionClass = "bottom-2 left-2",
}: PhotoCreditPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      dir="rtl"
      className={`pointer-events-auto absolute ${positionClass} z-20`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        aria-label={`קרדיט תמונה: ${image.creditHe}`}
        aria-expanded={open}
        title={image.attribution || image.creditHe}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-slate-950/75 text-xs font-bold text-slate-100 shadow-sm backdrop-blur-xs transition-colors hover:bg-slate-900 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        ⓘ
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="פרטי קרדיט ורישיון תמונה"
          className="absolute bottom-7 left-0 w-56 rounded-2xl border border-white/20 bg-slate-950/95 p-2.5 text-right text-xs leading-relaxed text-slate-100 shadow-2xl backdrop-blur-md"
        >
          <div className="font-bold text-amber-300">{image.creditHe}</div>
          <div dir="ltr" className="mt-0.5 truncate text-[9.5px] text-slate-300">
            {image.title}
          </div>
          {image.sourceUrl && (
            <a
              href={image.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 inline-block font-bold text-sky-300 underline hover:text-white"
            >
              מקור ב-Wikimedia Commons ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
