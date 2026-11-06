/**
 * Build data/artifacts/mizrahnik-taiwan-points.json from Mizrahnik Taiwan pages.
 * - Destination guides: Elementor flip-box backs (verified place names in copy).
 * - Hotels: only https://mizrahnik.co.il/hotels/taipei/ lists mz-ml__row entries;
 *   other /hotels/<city>/ URLs redirect to destination guides (no separate listings).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = path.join(process.cwd(), "data", "artifacts");
const OUT_JSON = path.join(ROOT, "mizrahnik-taiwan-points.json");
const OUT_CSV = path.join(ROOT, "mizrahnik-taiwan-points.csv");

const DESTINATION_URLS = [
  "https://mizrahnik.co.il/destination/taiwan/",
  "https://mizrahnik.co.il/destination/taipei/",
  "https://mizrahnik.co.il/destination/taichung/",
  "https://mizrahnik.co.il/destination/tainan/",
  "https://mizrahnik.co.il/destination/kaohsiung/",
  "https://mizrahnik.co.il/destination/hualien/",
  "https://mizrahnik.co.il/destination/yilan/",
  "https://mizrahnik.co.il/destination/taitung/",
  "https://mizrahnik.co.il/destination/kenting-hengchun/",
  "https://mizrahnik.co.il/destination/jioufen/",
  "https://mizrahnik.co.il/destination/sun-moon-lake/",
  "https://mizrahnik.co.il/destination/alishan/",
  "https://mizrahnik.co.il/destination/taroko-national-park/",
];

const TAIPEI_HOTELS_URL = "https://mizrahnik.co.il/hotels/taipei/";

/** H3 titles on flip front that are practical / non-POI */
const SKIP_TITLE_SUBSTR = [
  "מזג אוויר",
  "מבנה העיר",
  "הגעה ל",
  "תחבורה",
  "לינה ב",
  "פסטיבלים",
  "בקצרה",
  "הדברים החשובים",
  "ויזה",
  "ביטוח",
  "תכנון",
  "טיסות",
  "הטבות",
];

function slugFromUrl(u) {
  try {
    const p = new URL(u).pathname.replace(/\/$/, "");
    return p.split("/").pop() || p;
  } catch {
    return u;
  }
}

function shouldSkipFlipTitle(title) {
  const t = title.trim();
  if (!t) return true;
  return SKIP_TITLE_SUBSTR.some((s) => t.includes(s));
}

function decodeBasicEntities(text) {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(html) {
  return decodeBasicEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSegmentText(s) {
  return s.replace(/^\s*\*\s*/u, "").trim();
}

/** Split flip back HTML into segments (preserve <br> breaks; do not merge paragraphs). */
function htmlToSegments(html) {
  const raw = html || "";
  const parts = raw
    .split(/<br\s*\/?>/i)
    .map((chunk) => stripTags(chunk))
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  return parts;
}

/** Latin place name before spaced en/em dash (Hebrew description after). */
function nameBeforeDash(segment) {
  const s = segment.trim();
  const m = s.match(/^(.+?)\s+[–—]\s+/);
  if (!m) return null;
  const left = m[1].trim();
  if (!/[A-Za-z]/.test(left)) return null;
  if (left.length < 2 || left.length > 120) return null;
  return left;
}

function leadingLatinBeforeHebrew(segment) {
  const s = segment.trim();
  const m = s.match(/^([A-Za-z0-9][A-Za-z0-9\s,'’.-]{2,100}?)(?=\s+[\u0590-\u05FF])/);
  if (!m) return null;
  const name = m[1].trim().replace(/[,.'’]+$/g, "");
  if (name.length < 2) return null;
  return name;
}

/** English segment up to Hebrew / line break (handles "Spring & Autumn Pavilions ועוד"). */
function leadingEnglishFragment(text) {
  const m = text.match(
    /^([\s\S]*?)(?=\s[\u0590-\u05FF]|$)/
  );
  const frag = (m ? m[1] : text).trim();
  if (!/[A-Za-z]/.test(frag)) return "";
  return frag.replace(/[,.'’]+$/g, "").trim();
}

function splitEnglishCommaAmpList(segment) {
  const s = segment.trim();
  const out = [];
  for (const piece of s.split(/[,，]/)) {
    let p = piece.trim().replace(/^מוזיאונים כמו:\s*/i, "");
    const frag = leadingEnglishFragment(p);
    if (!frag) continue;

    if (frag.includes("&")) {
      const simple = frag.match(
        /^([A-Z][A-Za-z0-9]*(?:\s+[a-z]+)*\s*&\s*[A-Z][A-Za-z0-9]*(?:\s+[a-z]+)*)$/
      );
      if (simple) {
        out.push(simple[1].trim());
        continue;
      }
    }

    const parts = frag.split(/\s*,\s*/);
    for (const q of parts) {
      const qq = q.trim().replace(/[,.'’]+$/g, "");
      if (qq.length < 4 || /[א-ת]/.test(qq)) continue;
      if (/^[A-Z]/.test(qq)) out.push(qq);
    }
  }
  return out;
}

/**
 * Two Latin place names in one paragraph, often separated by "גם" (also).
 * Example: "Taichung Park הוא ... גם Calligraphy Greenway היא ..."
 */
function splitEnglishByGam(segment) {
  const s = segment.trim();
  if (!s.includes("גם")) return [];
  const chunks = s.split(/(?:^|[.\s])גם\s+/);
  if (chunks.length < 2) return [];
  const names = [];
  for (const chunk of chunks) {
    const lead =
      leadingLatinBeforeHebrew(chunk) ||
      chunk.match(/^([A-Z][A-Za-z0-9\s'.-]{2,80}?)(?=\s+[\u0590-\u05FF])/)?.[1]?.trim() ||
      null;
    if (lead && !/[א-ת]/.test(lead)) {
      const cleaned = lead.replace(/[,.'’]+$/g, "").trim();
      if (cleaned.length >= 4) names.push(cleaned);
    }
  }
  return names.length >= 2 ? names : [];
}

function taipei101FromHebrew(segment) {
  if (/טאיפיי\s*101|טאיפי\s*101/.test(segment)) return "Taipei 101";
  return null;
}

function looksLikeEnglishTitle(s) {
  const t = s.trim();
  if (t.length < 3 || t.length > 100) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  if (/[א-ת]/.test(t)) return false;
  return true;
}

function latinFromParens(title) {
  const m = title.match(/\(([^)]+)\)/);
  if (!m) return [];
  const inner = m[1];
  return inner
    .split(/\s*[+＋]\s*/)
    .map((x) => x.trim())
    .filter((x) => looksLikeEnglishTitle(x) || /^Pier-\d+/i.test(x));
}

/** e.g. "…ו־Love River (Pier-2 + …)" → Love River + paren parts */
function englishFromSectionTitle(sectionTitle) {
  const t = sectionTitle.trim();
  const names = [];
  for (const x of latinFromParens(t)) names.push(x);

  const noParen = t.replace(/\([^)]*\)/g, " ");
  const m = noParen.match(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,5})\b/g
  );
  if (m) {
    for (const w of m) {
      if (w.length >= 4 && !/^The\b/i.test(w)) names.push(w.trim());
    }
  }
  return [...new Set(names)];
}

function mergeDragonTigerPagodas(names, sectionTitle) {
  if (!/Dragon/i.test(sectionTitle) || !/Tiger/i.test(sectionTitle)) return names;
  const hasFull = names.some((n) => /Dragon\s*&\s*Tiger\s+Pagodas/i.test(n));
  if (hasFull) return names.filter((n) => n !== "Dragon" && n !== "Tiger Pagodas");
  if (names.includes("Dragon") && names.includes("Tiger Pagodas")) {
    return [
      ...names.filter((n) => n !== "Dragon" && n !== "Tiger Pagodas"),
      "Dragon & Tiger Pagodas",
    ];
  }
  return names;
}

function splitSectionTitlePlaces(title) {
  const t = title.trim();
  const parens = latinFromParens(t);
  if (parens.length) return parens;

  if (/\s+ו־\s+/.test(t)) {
    const parts = t
      .split(/\s+ו־\s+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 2);
    if (parts.some((p) => /[A-Za-z]/.test(p))) return parts;
  }

  if (/ ו - /.test(t)) {
    return t
      .split(/\s+ו\s+-\s+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 2);
  }
  if (/\s+ו\s+/.test(t) && /[A-Za-z]/.test(t)) {
    return t
      .split(/\s+ו\s+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 2);
  }
  return [];
}

/**
 * From one segment, return one or more English place names (Mizrahnik copy).
 */
function namesFromSegment(segment, sectionTitle) {
  const raw = normalizeSegmentText(segment).trim();
  const out = [];

  const t101 = taipei101FromHebrew(raw);
  if (t101) {
    out.push(t101);
    return out;
  }

  const beforeDash = nameBeforeDash(raw);
  if (beforeDash) {
    out.push(beforeDash);
    return mergeDragonTigerPagodas(out, sectionTitle);
  }

  const byGam = splitEnglishByGam(raw);
  if (byGam.length) {
    out.push(...byGam);
    return mergeDragonTigerPagodas(out, sectionTitle);
  }

  let list = splitEnglishCommaAmpList(raw);
  const fromTitleForList = englishFromSectionTitle(sectionTitle);
  if (list.length && fromTitleForList.length) {
    for (const tName of fromTitleForList) {
      if (!list.some((n) => n.includes(tName) || tName.includes(n))) {
        list.push(tName);
      }
    }
  }
  if (list.length) {
    out.push(...list);
    return mergeDragonTigerPagodas(out, sectionTitle);
  }

  const latinLead = leadingLatinBeforeHebrew(raw);
  if (latinLead) {
    out.push(latinLead);
    return mergeDragonTigerPagodas(out, sectionTitle);
  }

  if (looksLikeEnglishTitle(raw)) {
    out.push(raw);
    return mergeDragonTigerPagodas(out, sectionTitle);
  }

  const titleParts = splitSectionTitlePlaces(sectionTitle);
  if (
    titleParts.length >= 1 &&
    raw.length > 20 &&
    /[א-ת]/.test(raw) &&
    !/[A-Za-z]{3,}/.test(raw)
  ) {
    for (const p of titleParts) {
      if (looksLikeEnglishTitle(p) || /^Pier-\d+/i.test(p)) out.push(p);
    }
    if (out.length) return mergeDragonTigerPagodas(out, sectionTitle);
  }

  const titleEng = englishFromSectionTitle(sectionTitle);
  if (
    titleEng.length &&
    raw.length > 15 &&
    /[א-ת]/.test(raw) &&
    /Pier-\d|נמל|Love River|Music Center|River/i.test(raw + sectionTitle)
  ) {
    out.push(...titleEng);
    return mergeDragonTigerPagodas(out, sectionTitle);
  }

  if (looksLikeEnglishTitle(sectionTitle)) {
    out.push(sectionTitle.trim());
    return mergeDragonTigerPagodas(out, sectionTitle);
  }
  const titleEnParts = splitSectionTitlePlaces(sectionTitle).filter((p) =>
    looksLikeEnglishTitle(p)
  );
  if (titleEnParts.length) {
    out.push(...titleEnParts);
    return mergeDragonTigerPagodas(out, sectionTitle);
  }

  return [];
}

async function extractFlipBoxes(page, pageUrl) {
  return page.$$eval("main .elementor-flip-box", (boxes, u) => {
    return boxes.map((box, idx) => {
      const titleEl = box.querySelector("h3.elementor-flip-box__layer__title");
      const title = titleEl?.textContent?.trim() ?? "";
      const descEl = box.querySelector(".elementor-flip-box__layer__description");
      const descHtml = descEl?.innerHTML ?? "";
      return {
        sourceUrl: u,
        sectionTitle: title,
        sectionIndex: idx,
        descriptionHtml: descHtml,
      };
    });
  }, pageUrl);
}

async function scrollPage(page) {
  await page.waitForTimeout(1500);
  for (let i = 0; i < 26; i++) {
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1200);
}

async function scrapeDestinations(browser) {
  const points = [];
  let idCounter = 0;
  for (const url of DESTINATION_URLS) {
    const page = await browser.newPage({ locale: "he-IL" });
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
      await scrollPage(page);
      const boxes = await extractFlipBoxes(page, url);
      for (const box of boxes) {
        if (shouldSkipFlipTitle(box.sectionTitle)) continue;
        const segments = htmlToSegments(box.descriptionHtml);
        let segIdx = 0;

        if (segments.length === 0 && looksLikeEnglishTitle(box.sectionTitle)) {
          idCounter += 1;
          points.push({
            id: `mzn-flip-${slugFromUrl(url)}-${idCounter}`,
            kind: "destination_section_poi",
            category: box.sectionTitle,
            nameHe: null,
            nameEn: box.sectionTitle.trim(),
            notesHe: box.sectionTitle.trim(),
            lat: null,
            lng: null,
            sourceUrl: url,
            matchedPlaceId: null,
            sectionIndex: box.sectionIndex,
            segmentIndex: 0,
          });
          continue;
        }

        for (const seg of segments) {
          const names = namesFromSegment(seg, box.sectionTitle);
          for (const nameEn of names) {
            idCounter += 1;
            points.push({
              id: `mzn-flip-${slugFromUrl(url)}-${idCounter}`,
              kind: "destination_section_poi",
              category: box.sectionTitle,
              nameHe: null,
              nameEn,
              notesHe: seg,
              lat: null,
              lng: null,
              sourceUrl: url,
              matchedPlaceId: null,
              sectionIndex: box.sectionIndex,
              segmentIndex: segIdx,
            });
          }
          if (names.length) segIdx += 1;
        }
      }
    } finally {
      await page.close();
    }
  }
  return points;
}

async function scrapeTaipeiHotels(browser) {
  const url = TAIPEI_HOTELS_URL;
  const page = await browser.newPage({ locale: "he-IL" });
  const points = [];
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
    if (!page.url().includes("/hotels/taipei")) {
      console.error("[hotels] unexpected final URL", page.url());
      return points;
    }
    await scrollPage(page);
    const rows = await page.$$eval("article.mz-ml__row", (articles) =>
      articles.map((art) => {
        const bookingA = art.querySelector('nav.mz-ml__book a[href*="booking.com"]');
        const nameBtn = art.querySelector("h4.mz-ml__row-name button");
        const name = nameBtn?.textContent?.trim() ?? null;
        const descP = art.querySelector(".mz-ml__row-desc p");
        const description = descP?.textContent?.trim() ?? null;
        const tierTag = art.querySelector(".mz-ml__tier-tag");
        const tierHe = tierTag?.textContent?.trim() ?? null;
        const group = art.closest(".mz-ml__group");
        const areaTitle =
          group?.querySelector("h3.mz-ml__tier-title")?.textContent?.trim() ?? null;
        return {
          dataHotel: art.getAttribute("data-hotel"),
          nameHeOrEn: name,
          tierHe,
          areaTitle,
          description,
          bookingUrl: bookingA?.getAttribute("href") ?? null,
        };
      })
    );
    const pageSlug = slugFromUrl(url);
    for (const r of rows) {
      if (!r.nameHeOrEn) continue;
      points.push({
        id: `mzn-hotel-${r.dataHotel ?? "x"}-${pageSlug}`,
        kind: "hotel",
        category: r.areaTitle ?? "לינה מומלצת (טאיפיי)",
        nameHe: null,
        nameEn: r.nameHeOrEn,
        notesHe: [r.description, r.tierHe ? `רמה: ${r.tierHe}` : null, r.bookingUrl ? `הזמנה: ${r.bookingUrl}` : null]
          .filter(Boolean)
          .join(" | "),
        lat: null,
        lng: null,
        sourceUrl: url,
        matchedPlaceId: null,
        bookingUrl: r.bookingUrl,
        tierHe: r.tierHe,
      });
    }
  } finally {
    await page.close();
  }
  return points;
}

function dedupeByKey(points) {
  const seen = new Set();
  const out = [];
  for (const p of points) {
    const key = `${p.kind}|${p.sourceUrl}|${p.nameEn || ""}|${p.nameHe || ""}|${(p.notesHe || "").slice(0, 100)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function toCsv(rows) {
  const cols = [
    "id",
    "kind",
    "category",
    "nameHe",
    "nameEn",
    "lat",
    "lng",
    "sourceUrl",
  ];
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const lines = [cols.join(",")];
  for (const r of rows) {
    lines.push(cols.map((c) => esc(r[c])).join(","));
  }
  return lines.join("\n");
}

async function main() {
  fs.mkdirSync(ROOT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const flip = await scrapeDestinations(browser);
    const hotels = await scrapeTaipeiHotels(browser);
    const merged = dedupeByKey([...flip, ...hotels]);
    fs.writeFileSync(OUT_JSON, JSON.stringify(merged, null, 2), "utf8");
    fs.writeFileSync(OUT_CSV, toCsv(merged), "utf8");
    console.log(
      JSON.stringify(
        {
          flipPois: flip.length,
          taipeiHotels: hotels.length,
          totalUnique: merged.length,
          outJson: OUT_JSON,
          outCsv: OUT_CSV,
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
