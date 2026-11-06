/**
 * One-shot: align trip dataset with data/artifacts/mizrahnik-taiwan-points.json
 * - Clears prior mizrahnikTagHe / mizrahnikSourceUrl
 * - Tags existing rows by improved matching
 * - Appends missing hotels (Taipei list) and POIs from artifact with cityId + coords from cities.json
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const writeJson = (rel, data) =>
  fs.writeFileSync(path.join(root, rel), JSON.stringify(data, null, 2) + "\n", "utf8");

const TAG = "מזרחניק";
const TAIPEI_HOTELS_URL = "https://mizrahnik.co.il/hotels/taipei/";

const CITY_BY_DEST = {
  "destination/taipei/": "taipei",
  "destination/taichung/": "taichung",
  "destination/tainan/": "tainan",
  "destination/kaohsiung/": "kaohsiung",
  "destination/hualien/": "hualien",
  "destination/yilan/": "yilan",
  "destination/taitung/": "taitung",
  "destination/kenting-hengchun/": "kenting",
  "destination/jioufen/": "new-taipei",
  "destination/sun-moon-lake/": "sun-moon-lake",
  "destination/alishan/": "alishan",
  "destination/taroko-national-park/": "hualien",
};

function destinationCityId(url) {
  if (!url) return "taipei";
  const u = new URL(url);
  const path = u.pathname.replace(/\/$/, "");
  for (const [suffix, cid] of Object.entries(CITY_BY_DEST)) {
    if (path.endsWith(suffix.replace(/\/$/, ""))) return cid;
  }
  return "taipei";
}

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9\u0590-\u05FF]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMizrahnik(obj) {
  if ("mizrahnikTagHe" in obj) delete obj.mizrahnikTagHe;
  if ("mizrahnikSourceUrl" in obj) delete obj.mizrahnikSourceUrl;
}

function hebrewLabelFromNotes(notesHe, nameEn) {
  if (!notesHe) return nameEn;
  const parts = notesHe.split(/\s*[–—]\s+/);
  if (parts.length >= 2 && /[\u0590-\u05FF]/.test(parts.slice(1).join(" "))) {
    const he = parts.slice(1).join(" – ").split(/[.!?\n]/)[0].trim();
    if (he.length >= 2) return he.slice(0, 120);
  }
  return nameEn;
}

function tierFromArtifact(tierHe) {
  if (!tierHe) return { tierHe: "ביניים", tier: "quality" };
  if (tierHe.includes("תרמיל")) return { tierHe: "זול", tier: "cheap" };
  if (tierHe.includes("מפנק")) return { tierHe: "יוקרה", tier: "splurge" };
  return { tierHe: "ביניים", tier: "quality" };
}

function score(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 100;
  const aw = new Set(a.split(" ").filter((w) => w.length > 1));
  const bw = new Set(b.split(" ").filter((w) => w.length > 1));
  let inter = 0;
  for (const w of aw) if (bw.has(w)) inter++;
  if (inter === 0) {
    if (a.includes(b) || b.includes(a)) return 75;
    return 0;
  }
  const union = aw.size + bw.size - inter;
  return Math.round((inter / union) * 100);
}

function matchHotel(artifactName, hotels) {
  const an = normalize(artifactName).replace(/\b(taipei|hotel|hostel|inn)\b/g, " ").replace(/\s+/g, " ").trim();
  let best = null;
  for (const h of hotels) {
    const hn = normalize(h.name);
    const s1 = score(an, hn);
    let s2 = 0;
    const tokens = an.split(" ").filter((t) => t.length > 3);
    for (const t of tokens) {
      if (hn.includes(t)) s2 += 12;
    }
    const s = Math.max(s1, Math.min(95, s2));
    if (s >= 48 && (!best || s > best.s)) best = { h, s };
  }
  return best?.h ?? null;
}

function matchPoi(nameEn, attractions, food) {
  const target = normalize(nameEn);
  let best = null;
  for (const a of attractions) {
    if (!a.nameEn) continue;
    const s = score(target, normalize(a.nameEn));
    if (s >= 55 && (!best || s > best.s)) best = { row: a, s, kind: "attraction" };
  }
  for (const f of food) {
    if (!f.nameEn) continue;
    const s = score(target, normalize(f.nameEn));
    if (s >= 55 && (!best || s > best.s)) best = { row: f, s, kind: "food" };
  }
  return best;
}

function shortHash(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 6);
}

function main() {
  const artifact = readJson("data/artifacts/mizrahnik-taiwan-points.json");
  const cities = readJson("data/cities.json");
  const citiesById = Object.fromEntries(cities.map((c) => [c.id, c]));

  let attractions = readJson("data/attractions.json");
  let food = readJson("data/food.json");
  let hotels = readJson("data/hotels.json");

  for (const a of attractions) stripMizrahnik(a);
  for (const f of food) stripMizrahnik(f);
  for (const h of hotels) stripMizrahnik(h);

  const report = {
    taggedAttractions: 0,
    taggedFood: 0,
    taggedHotels: 0,
    addedAttractions: 0,
    addedFood: 0,
    addedHotels: 0,
    skipped: [],
  };

  const seenHotelKeys = new Set();
  const seenPoiKeys = new Set();

  for (const p of artifact) {
    const url = p.sourceUrl;
    if (!url || !p.nameEn) continue;

    if (p.kind === "hotel") {
      if (url !== TAIPEI_HOTELS_URL) continue;
      const key = normalize(p.nameEn);
      if (seenHotelKeys.has(key)) continue;
      seenHotelKeys.add(key);

      const m = matchHotel(p.nameEn, hotels);
      if (m) {
        m.mizrahnikTagHe = TAG;
        m.mizrahnikSourceUrl = url;
        report.taggedHotels += 1;
        continue;
      }

      const cityId = "taipei";
      const city = citiesById[cityId];
      const { tierHe, tier } = tierFromArtifact(p.tierHe);
      const id = `hotel-mzn-${shortHash(p.nameEn + url)}`;
      hotels.push({
        id,
        name: `${p.nameEn} (מזרחניק)`,
        nameZh: null,
        city: city.nameHe,
        tierHe,
        tier,
        priceText: "~לפי אתר הזמנות (מזרחניק, לא אומת)",
        priceMin: null,
        priceMax: null,
        priceUnit: "NT$ per night",
        description: (p.notesHe || "").replace(/\s*\|\s*הזמנה:.*$/s, "").slice(0, 500) || "מומלץ במדריך מזרחניק.",
        source: "Mizrahnik (https://mizrahnik.co.il/hotels/taipei/)",
        verified: false,
        cityId,
        lat: city.lat,
        lng: city.lng,
        approxLocation: true,
        mizrahnikTagHe: TAG,
        mizrahnikSourceUrl: url,
      });
      report.addedHotels += 1;
      continue;
    }

    if (p.kind !== "destination_section_poi") continue;

    const cityId = destinationCityId(url);
    const city = citiesById[cityId];
    const notes = p.notesHe || "";
    const labelHe = hebrewLabelFromNotes(notes, p.nameEn);

    const isMarket =
      /night market|שוק|market/i.test(p.category + notes + p.nameEn) ||
      /Night Market$/i.test(p.nameEn);

    const m = matchPoi(p.nameEn, attractions, food);
    if (m) {
      m.row.mizrahnikTagHe = TAG;
      m.row.mizrahnikSourceUrl = url;
      if (m.kind === "attraction") report.taggedAttractions += 1;
      else report.taggedFood += 1;
      continue;
    }

    const poiKey = `${cityId}|${normalize(p.nameEn)}`;
    if (seenPoiKeys.has(poiKey)) continue;
    seenPoiKeys.add(poiKey);

    if (isMarket) {
      const id = `food-mzn-${shortHash(p.nameEn + url)}`;
      food.push({
        id,
        name: `${labelHe} (${p.nameEn})`,
        nameZh: null,
        nameEn: p.nameEn,
        city: city.nameHe,
        typeHe: "שוק",
        type: "market",
        description: notes.slice(0, 800) || `מופיע במדריך מזרחניק: ${p.nameEn}.`,
        hours: null,
        importance: 3,
        priceText: null,
        priceMin: null,
        priceMax: null,
        priceUnit: "NT$ per person",
        hoursVerified: false,
        priceVerified: false,
        verified: false,
        cityId,
        lat: city.lat,
        lng: city.lng,
        approxLocation: true,
        coordSource: "knowledge",
        mizrahnikTagHe: TAG,
        mizrahnikSourceUrl: url,
      });
      report.addedFood += 1;
    } else {
      const id = `attr-mzn-${shortHash(p.nameEn + url)}`;
      attractions.push({
        id,
        name: `${labelHe} (${p.nameEn})`,
        nameZh: null,
        nameEn: p.nameEn,
        city: city.nameHe,
        description: notes.slice(0, 800) || `מופיע במדריך מזרחניק: ${p.nameEn}.`,
        importance: 3,
        isNature: /park|wetland|lake|trail|mountain|gorge|beach|island|hot spring|מפל|פארק|אגם/i.test(
          p.nameEn + notes
        ),
        cityId,
        lat: city.lat,
        lng: city.lng,
        approxLocation: true,
        coordSource: "knowledge",
        source: "Mizrahnik destination guide",
        mizrahnikTagHe: TAG,
        mizrahnikSourceUrl: url,
      });
      report.addedAttractions += 1;
    }
  }

  writeJson("data/attractions.json", attractions);
  writeJson("data/food.json", food);
  writeJson("data/hotels.json", hotels);
  writeJson("data/artifacts/mizrahnik-sync-report.json", {
    ...report,
    totals: {
      attractions: attractions.length,
      food: food.length,
      hotels: hotels.length,
    },
  });

  console.log(JSON.stringify(report, null, 2));
}

main();
