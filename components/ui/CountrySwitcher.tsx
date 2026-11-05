"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  countryFromPathname,
  type TripCountry,
  writeStoredCountry,
} from "@/lib/ui/tripCountry";

const SEGMENTS: { id: TripCountry; label: string; href: string }[] = [
  { id: "taiwan", label: "טייוואן", href: "/" },
  { id: "philippines", label: "פיליפינים", href: "/philippines" },
];

export function CountrySwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = countryFromPathname(pathname);

  useEffect(() => {
    if (pathname.startsWith("/philippines")) {
      writeStoredCountry("philippines");
    } else if (pathname === "/") {
      writeStoredCountry("taiwan");
    }
  }, [pathname]);

  return (
    <div
      role="group"
      aria-label="בחירת יעד טיול"
      data-testid="country-switcher"
      className={`inline-flex min-h-11 items-center rounded-xl bg-slate-900/5 p-0.5 dark:bg-white/10 ${className}`}
    >
      {SEGMENTS.map((segment) => {
        const isActive = active === segment.id;
        return (
          <Link
            key={segment.id}
            href={segment.href}
            onClick={() => {
              writeStoredCountry(segment.id);
              if (segment.href === "/" && pathname === "/") {
                router.refresh();
              }
            }}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-10 min-w-[4.5rem] items-center justify-center rounded-lg px-2.5 text-[11px] font-extrabold transition-colors active:scale-[0.97] sm:min-w-[5.25rem] sm:text-xs ${
              isActive
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {segment.label}
          </Link>
        );
      })}
    </div>
  );
}
