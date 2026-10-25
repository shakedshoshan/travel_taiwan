"use client";

import { useState } from "react";
import { getCityImages, getPlaceImage } from "@/lib/data/placeImages";
import { getCityBundle } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";

export function useCityOfflineSave(cityId: CityId) {
  const saved = useTripStore().offlineSavedCities.includes(cityId);
  const [savingFor, setSavingFor] = useState(cityId);
  const [saving, setSaving] = useState(false);
  if (savingFor !== cityId) {
    setSavingFor(cityId);
    setSaving(false);
  }

  const save = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      const bundle = getCityBundle(cityId);
      const images = getCityImages(cityId);
      const places = [...bundle.attractions, ...bundle.food, ...bundle.hotels];
      const urls = new Set<string>([
        "/data/cities.json",
        "/data/attractions.json",
        "/data/food.json",
        "/data/hotels.json",
        ...images.map((image) => image.src),
        ...places.map((place) => getPlaceImage(place).src),
        ...places.map((place) => `/place/${place.id}`),
      ]);
      if (typeof window !== "undefined" && "caches" in window) {
        const cache = await window.caches.open("taiwan-3d-offline-v2");
        await Promise.allSettled(Array.from(urls).map((url) => cache.add(url)));
      }
      navigator.serviceWorker?.controller?.postMessage({
        type: "PRECACHE_URLS",
        urls: Array.from(urls),
      });
      tripActions.markCitySavedOffline(cityId);
    } catch {
      tripActions.markCitySavedOffline(cityId);
    } finally {
      setSaving(false);
    }
  };

  return { saved, saving, save };
}
