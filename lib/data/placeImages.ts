import creditsRaw from "@/data/images/credits.json";
import type { CityId } from "@/data/types";
import type { EnrichedPlace } from "./loaders";
import {
  matchSemanticPlaceImage,
  type ImageCreditRecord,
  type PlaceImageMeta,
} from "./imageMatchers";

export type { ImageCreditRecord, PlaceImageMeta };

const CREDITS = creditsRaw as ImageCreditRecord[];

const CREDITS_BY_FILE = new Map<string, ImageCreditRecord>();
const CREDITS_BY_STEM = new Map<string, ImageCreditRecord>();
const CITY_CREDITS_MAP = new Map<string, ImageCreditRecord[]>();

for (const entry of CREDITS) {
  CREDITS_BY_FILE.set(entry.file, entry);

  const slashIdx = entry.file.indexOf("/");
  const folder = slashIdx >= 0 ? entry.file.slice(0, slashIdx) : "";
  const filename = slashIdx >= 0 ? entry.file.slice(slashIdx + 1) : entry.file;
  const stem = filename.replace(/\.[^.]+$/, "");

  if (folder === "attractions" || folder === "food" || folder === "hotels") {
    CREDITS_BY_STEM.set(stem, entry);
  }

  if (folder === "cities") {
    const baseCity = stem.replace(/-\d+$/, "");
    const existing = CITY_CREDITS_MAP.get(baseCity) ?? [];
    existing.push(entry);
    CITY_CREDITS_MAP.set(baseCity, existing);
  }
}

function toPlaceImageMeta(
  record: ImageCreditRecord,
  overrideMatch?: "exact" | "representative"
): PlaceImageMeta {
  const match = overrideMatch ?? record.match;
  const cleanAuthor = record.author.replace(
    /Unknown authorUnknown author/g,
    "Unknown"
  );
  const matchLabel = match === "representative" ? " · תמונה מייצגת" : "";
  return {
    src: `/images/${record.file}`,
    file: record.file,
    title: record.title,
    author: cleanAuthor,
    license: record.license,
    licenseUrl: record.license_url,
    sourceUrl: record.source,
    creditHe: `צילום: ${cleanAuthor} (${record.license})${matchLabel}`,
    attribution: record.attribution,
    match,
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getImageByFile(
  relFile: string,
  overrideMatch?: "exact" | "representative"
): PlaceImageMeta {
  const found = CREDITS_BY_FILE.get(relFile);
  if (found) {
    return toPlaceImageMeta(found, overrideMatch);
  }
  const fallback = CREDITS[0];
  return toPlaceImageMeta(fallback, "representative");
}

export function getCityImages(cityId: CityId): PlaceImageMeta[] {
  const lookupCity = cityId === "kenting" ? "pingtung" : cityId;
  const direct = CITY_CREDITS_MAP.get(lookupCity);
  if (direct && direct.length > 0) {
    const sorted = [...direct].sort((a, b) => a.file.length - b.file.length);
    return sorted.map((rec) => toPlaceImageMeta(rec));
  }

  if (cityId === "hsinchu") {
    const hsinchuRecords = CREDITS.filter((c) =>
      c.query.toLowerCase().includes("hsinchu")
    );
    if (hsinchuRecords.length > 0) {
      return hsinchuRecords.map((rec) => toPlaceImageMeta(rec));
    }
  }

  return [getImageByFile("cities/taipei.jpg", "representative")];
}

export function getCityPrimaryImage(cityId: CityId): PlaceImageMeta {
  const list = getCityImages(cityId);
  return list[0];
}

export function getPlaceImage(place: EnrichedPlace): PlaceImageMeta {
  const exactRecord = CREDITS_BY_STEM.get(place.id);
  if (exactRecord) {
    return toPlaceImageMeta(exactRecord);
  }

  const semanticMatch = matchSemanticPlaceImage(
    place,
    CREDITS,
    toPlaceImageMeta,
    getImageByFile
  );
  if (semanticMatch) {
    return semanticMatch;
  }

  const cityGallery = getCityImages(place.cityId);
  const chosen = cityGallery[hashString(place.id) % cityGallery.length];
  return {
    ...chosen,
    match: "representative",
    creditHe: chosen.creditHe.includes("תמונה מייצגת")
      ? chosen.creditHe
      : `${chosen.creditHe} · תמונה מייצגת`,
  };
}

const ROUTE_LEG_IMAGE_FILES: Record<number, string> = {
  1: "routes/pingxi-line.jpg",
  2: "routes/suhua-highway.jpg",
  3: "routes/tra-emu3000.jpg",
  4: "routes/kaohsiung-lrt.jpg",
  5: "routes/south-link-line.jpg",
  6: "routes/alishan-railway.jpg",
  7: "routes/sun-moon-lake-ropeway.jpg",
  8: "routes/taipei-main-station.jpg",
  9: "routes/thsr-station.jpg",
  10: "routes/thsr-train.jpg",
};

export function getRouteLegImage(
  legOrder: number,
  cityId: CityId
): PlaceImageMeta {
  const routeFile = ROUTE_LEG_IMAGE_FILES[legOrder];
  if (routeFile && CREDITS_BY_FILE.has(routeFile)) {
    return getImageByFile(routeFile);
  }
  return getCityPrimaryImage(cityId);
}

export function getAllRouteImages(): PlaceImageMeta[] {
  return CREDITS.filter((c) => c.file.startsWith("routes/")).map((c) =>
    toPlaceImageMeta(c)
  );
}

export function getAllImageCredits(): ImageCreditRecord[] {
  return CREDITS;
}
