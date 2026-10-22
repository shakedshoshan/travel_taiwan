"use client";

import { useEffect } from "react";
import { MapCanvas } from "@/components/3d/MapCanvas";
import { LayerToggles } from "@/components/ui/LayerToggles";
import { TimelineScrubber } from "@/components/ui/TimelineScrubber";
import { CityDrawer } from "@/components/ui/CityDrawer";
import { MapNavigationPad } from "@/components/ui/MapNavigationPad";
import { tripActions } from "@/lib/store/useTripStore";
import { CITY_IDS } from "@/lib/data/schemas";
import type { CityId } from "@/data/types";

export default function HomePage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get("city");
    if (cityParam && (CITY_IDS as readonly string[]).includes(cityParam)) {
      tripActions.selectCity(cityParam as CityId);
    }
  }, []);

  return (
    <div
      dir="rtl"
      className="relative h-screen w-screen overflow-hidden select-none"
    >
      {/* Fullscreen 3D Taiwan Map (or 2D Fallback) */}
      <MapCanvas />

      {/* Top-Right Floating Layer Filters & Map Controls */}
      <div className="pointer-events-none fixed top-28 right-3 left-3 z-20 flex justify-start md:top-20 md:right-6 md:left-auto">
        <LayerToggles />
      </div>

      {/* Floating Map Navigation Pad (Move / Rotate / Tilt / Zoom) */}
      <div className="pointer-events-none fixed right-3 bottom-48 z-20 md:right-6 md:bottom-44">
        <MapNavigationPad />
      </div>

      {/* City Glassmorphism Drawer (RTL Desktop Side Panel / Mobile Bottom Sheet) */}
      <CityDrawer />

      {/* Bottom Timeline Scrubber (6.11 -> 8.12) */}
      <div className="pointer-events-none fixed right-3 bottom-3 left-3 z-20 md:right-6 md:bottom-4 md:left-6">
        <TimelineScrubber />
      </div>
    </div>
  );
}
