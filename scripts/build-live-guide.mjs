/**
 * Builds `data/live-guide.json` from `data/sources/taiwan-live-guide-index.src.json`.
 * Excludes exhibition-focused museums (English "Museum" in name; Hebrew "מוזיאון" in name)
 * with an exception for Fo Guang Shan, Liyu Lake name/area hits, and trims the dataset
 * for in-app use (no hotel-specific rows; source file has none as dedicated rows).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "data/sources/taiwan-live-guide-index.src.json");
const OUT = path.join(ROOT, "data/live-guide.json");

function hashId(parts) {
  return crypto
    .createHash("sha1")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 12);
}

function excludeForExhibitionsOrLiyu(entry) {
  const name = String(entry.name ?? "");
  const area = String(entry.area ?? "");
  const nameZh = String(entry.nameZh ?? "");
  const note = String(entry.note ?? "");

  if (/\bliyulake\b|\bliyu lake\b|鲤鱼潭/i.test(`${name} ${area} ${nameZh} ${note}`)) {
    return "liyu_lake";
  }
  if (/fo guang shan/i.test(name)) {
    return null;
  }
  if (/\bmuseum\b/i.test(name)) {
    return "museum_en_name";
  }
  if (/מוזיאון/.test(name)) {
    return "museum_he_name";
  }
  return null;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const originalEntries = raw.entries;
  if (!Array.isArray(originalEntries)) {
    throw new Error("Source JSON missing entries array");
  }

  const excluded = [];
  const entries = [];

  for (let i = 0; i < originalEntries.length; i++) {
    const e = originalEntries[i];
    const reason = excludeForExhibitionsOrLiyu(e);
    if (reason) {
      excluded.push({ index: i, name: e.name, reason });
      continue;
    }
    const id = hashId([
      String(e.area ?? ""),
      String(e.name ?? ""),
      String(e.nameZh ?? ""),
      String(i),
    ]);
    entries.push({
      id,
      ...e,
    });
  }

  const out = {
    builtAt: new Date().toISOString(),
    sourceFile: "data/sources/taiwan-live-guide-index.src.json",
    originalEntryCount: originalEntries.length,
    excludedCount: excluded.length,
    excluded,
    purpose: raw.purpose ?? null,
    priorityMeaning: raw.priorityMeaning ?? null,
    updated: raw.updated ?? null,
    disclaimerHe:
      "סטטוסים ושעות בטבלה הם הנחיות מהמקור ההיסטורי — לא אימות חי לפני ביקור. לבדוק רשמית לפני יציאה.",
    routeHighlightsHe:
      "במסלול המקורי: אגם הירח והשמש וכפר התרבות האבוריג׳יני (Formosan Aboriginal Culture Village) מוגדרים כחובה.",
    entries,
  };

  fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(
    `[build-live-guide] wrote ${entries.length} entries to ${path.relative(ROOT, OUT)} (excluded ${excluded.length})`
  );
}

main();
