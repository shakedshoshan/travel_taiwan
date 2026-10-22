import creditsRaw from "@/data/images/credits.json";
import type { CityId } from "@/data/types";
import type { EnrichedPlace } from "./loaders";

export interface ImageCreditRecord {
  title: string;
  author: string;
  license: string;
  license_url: string;
  source: string;
  match: "exact" | "representative";
  verification: string;
  file: string;
  query: string;
  source_site: string;
  attribution: string;
}

export interface PlaceImageMeta {
  src: string;
  file: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  creditHe: string;
  attribution: string;
  match: "exact" | "representative";
}

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
  const cleanAuthor = record.author.replace(/Unknown authorUnknown author/g, "Unknown");
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

function findCreditByQuery(
  predicate: (entry: ImageCreditRecord) => boolean
): ImageCreditRecord | undefined {
  return CREDITS.find(predicate);
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
  const direct = CITY_CREDITS_MAP.get(cityId);
  if (direct && direct.length > 0) {
    // Sort so primary (without -2/-3) comes first
    const sorted = [...direct].sort((a, b) => a.file.length - b.file.length);
    return sorted.map((rec) => toPlaceImageMeta(rec));
  }

  // Hsinchu has city photos under attractions/food in credits.json
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
  // 1. Direct match by item ID in data/images/{attractions,food,hotels}/{id}.jpg
  const exactRecord = CREDITS_BY_STEM.get(place.id);
  if (exactRecord) {
    return toPlaceImageMeta(exactRecord);
  }

  const text = `${place.name} ${place.nameZh ?? ""} ${place.description}`.toLowerCase();

  // 2. Hotels without direct file: map to hot-spring hotel or hotel room in data/images/hotels
  if (place.kind === "hotel") {
    const isHotSpringOrResort =
      text.includes("מעיינות") ||
      text.includes("溫泉") ||
      text.includes("ספא") ||
      place.tier === "splurge" ||
      place.cityId === "sun-moon-lake";

    if (isHotSpringOrResort) {
      return getImageByFile("hotels/generic-hot-spring-hotel.jpg", "representative");
    }
    return getImageByFile("hotels/generic-hotel-room-2.jpg", "representative");
  }

  // 3. Food without direct file: match dish / market photo from credits.json
  if (place.kind === "food") {
    if (text.includes("第二市場") || text.includes("השוק השני")) {
      const rec = findCreditByQuery((c) => c.title.includes("台中第二市場"));
      if (rec) return toPlaceImageMeta(rec, "exact");
    }
    if (text.includes("胡椒餅") || text.includes("לחמניית פלפל")) {
      const rec = findCreditByQuery((c) => c.query.includes("hujiao bing"));
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (
      text.includes("魯肉飯") ||
      text.includes("肉燥飯") ||
      text.includes("爌肉飯") ||
      text.includes("חזיר מבושל")
    ) {
      const rec = findCreditByQuery((c) => c.query === "braised pork rice");
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (text.includes("筒仔米糕") || text.includes("מי-גאו")) {
      const rec = findCreditByQuery((c) => c.title.includes("Tube rice pudding"));
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (text.includes("牛肉麵") || text.includes("נודלס בקר")) {
      const rec = findCreditByQuery((c) =>
        c.title.includes("Taiwanese Beef Noodle Soup.jpg")
      );
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (
      text.includes("牛肉湯") ||
      text.includes("מרק בקר") ||
      text.includes("鹹粥") ||
      text.includes("דייסת דג") ||
      text.includes("魚羹")
    ) {
      const rec = findCreditByQuery((c) => c.query.includes("beef soup"));
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (text.includes("肉圓") || text.includes("肉員") || text.includes("באוואן")) {
      const rec = findCreditByQuery((c) => c.query.includes("ba wan"));
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (text.includes("圓仔") || text.includes("汤圆") || text.includes("כדורי אורז")) {
      const rec = findCreditByQuery((c) => c.query === "tangyuan");
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (
      text.includes("小籠包") ||
      text.includes("包子") ||
      text.includes("蒸餃") ||
      text.includes("באוזה") ||
      text.includes("דמפלינגס")
    ) {
      const rec = findCreditByQuery((c) => c.query === "steamed dumplings");
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (text.includes("鴨") || text.includes("ברווז") || text.includes("אווז")) {
      const rec = findCreditByQuery((c) => c.query.includes("duck"));
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (
      text.includes("炊粉") ||
      text.includes("麵線") ||
      text.includes("冬粉") ||
      text.includes("ורמיצ׳לי") ||
      text.includes("אטריות אורז")
    ) {
      const rec = findCreditByQuery((c) => c.query === "oyster vermicelli");
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (text.includes("סשימי") || text.includes("דגים") || text.includes("סרטן")) {
      const rec = findCreditByQuery((c) => c.query.includes("Donggang fish market"));
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (text.includes("豆漿") || text.includes("שאובינג")) {
      const rec = findCreditByQuery((c) => c.query === "scallion pancake");
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (text.includes("臭豆腐") || text.includes("טופו")) {
      const rec = findCreditByQuery((c) => c.query === "Taitung night market");
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (place.type === "market") {
      const cityMarket = CREDITS.find(
        (c) =>
          c.query.toLowerCase().includes("night market") &&
          c.verification.toLowerCase().includes(place.cityId)
      );
      if (cityMarket) return toPlaceImageMeta(cityMarket, "representative");
    }

    const fallbackFood = findCreditByQuery(
      (c) => c.query === "wonton soup Taiwan"
    );
    if (fallbackFood) return toPlaceImageMeta(fallbackFood, "representative");
  }

  // 4. Attractions without direct file: semantic & regional match in data/images
  if (text.includes("ג׳יופן") || text.includes("jiufen")) {
    return getImageByFile("cities/new-taipei-2.jpg", "exact");
  }
  if (text.includes("עמק תרמי") || text.includes("בייטואו")) {
    const rec = findCreditByQuery((c) => c.query === "Beitou hot spring");
    if (rec) return toPlaceImageMeta(rec, "representative");
  }
  if (text.includes("טאנג-ווייגואו") || text.includes("ג׳יאושי")) {
    const rec = findCreditByQuery((c) => c.query === "Jiaoxi hot spring");
    if (rec) return toPlaceImageMeta(rec, "representative");
  }
  if (text.includes("פיר 2") || text.includes("האמסן")) {
    return getImageByFile("routes/kaohsiung-lrt.jpg", "representative");
  }
  if (text.includes("מוסך המניפה") || text.includes("רכבות")) {
    return getImageByFile("routes/tra-taroko-express.jpg", "representative");
  }
  if (text.includes("ארקייד") || text.includes("טומס וורלד")) {
    const rec = findCreditByQuery((c) =>
      c.query.includes("arcade Taiwan claw machines")
    );
    if (rec) return toPlaceImageMeta(rec, "representative");
  }
  if (text.includes("החלקה") || text.includes("roller186") || text.includes("אקיוזפייב")) {
    const rec = findCreditByQuery((c) => c.query === "Taipei Arena");
    if (rec) return toPlaceImageMeta(rec, "representative");
  }
  if (text.includes("סרטן ואנלי") || text.includes("יהליו")) {
    const rec = findCreditByQuery((c) =>
      c.query.includes("Yehliu Geopark")
    );
    if (rec) return toPlaceImageMeta(rec, "representative");
  }

  // 5. Fallback to city images (deterministic rotation across the city's photos)
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
