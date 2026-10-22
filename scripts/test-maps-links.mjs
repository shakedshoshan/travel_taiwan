import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const BARE_CITY_NAMES_ZH = new Set([
  "台北",
  "臺北",
  "新北",
  "基隆",
  "宜蘭",
  "桃園",
  "新竹",
  "苗栗",
  "台中",
  "臺中",
  "彰化",
  "南投",
  "日月潭",
  "嘉義",
  "阿里山",
  "台南",
  "臺南",
  "高雄",
  "屏東",
  "花蓮",
  "台東",
  "臺東",
  "墾丁",
  "光復",
  "台灣",
  "臺灣",
]);

function buildGoogleMapsUrl(place) {
  const isExact =
    place.approxLocation === false || place.resolvedCoords?.isExact === true;
  const lat = place.resolvedCoords?.lat ?? place.lat;
  const lng = place.resolvedCoords?.lng ?? place.lng;

  if (
    isExact &&
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const cityEn = (place.cityNameEn ?? "").trim() || "Taiwan";
  const cityEnLower = cityEn.toLowerCase();

  const rawZh = (place.nameZh ?? "").trim();
  const zhIsValid =
    rawZh.length > 0 &&
    !BARE_CITY_NAMES_ZH.has(rawZh) &&
    rawZh.toLowerCase() !== cityEnLower &&
    !(rawZh.length === 1 && place.name.trim().length > 3);

  const rawEn = (place.nameEn ?? "")
    .replace(/\s*\(venue unverified\)\s*/gi, "")
    .trim();
  const enIsValid =
    rawEn.length > 0 &&
    !BARE_CITY_NAMES_ZH.has(rawEn) &&
    rawEn.toLowerCase() !== cityEnLower;

  const nonHebrewFromName = place.name
    .replace(/[\u0590-\u05FF״׳]+/g, " ")
    .replace(/^[\s–—·,.:;()-]+|[\s–—·,.:;()-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const nameFallback =
    nonHebrewFromName.length > 0 &&
    nonHebrewFromName.toLowerCase() !== cityEnLower &&
    !BARE_CITY_NAMES_ZH.has(nonHebrewFromName)
      ? nonHebrewFromName
      : place.name.trim();

  const primaryQuery = zhIsValid
    ? rawZh
    : enIsValid
      ? rawEn
      : nameFallback;

  const queryParts = [primaryQuery, cityEn];

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    queryParts.join(" ").replace(/\s+/g, " ").trim()
  )}`;
}

// 10 named unit test cases
const TEN_TEST_CASES = [
  {
    label: "1. Roller186 (digits & Latin preserved in query)",
    input: {
      name: "Roller186",
      nameZh: null,
      nameEn: null,
      cityNameEn: "Taipei",
      approxLocation: true,
    },
    expectIncludes: ["Roller186", "Taipei"],
  },
  {
    label: "2. 5 Seconds of Summer (leading digit & Latin preserved)",
    input: {
      name: "5 Seconds of Summer",
      nameZh: null,
      nameEn: null,
      cityNameEn: "Taipei",
      approxLocation: true,
    },
    expectIncludes: ["5 Seconds of Summer", "Taipei"],
  },
  {
    label: "3. E7PLAY (alphanumeric token preserved)",
    input: {
      name: "E7PLAY",
      nameZh: "E7PLAY 板橋",
      nameEn: "E7PLAY Banqiao",
      cityNameEn: "New Taipei",
      approxLocation: true,
    },
    expectIncludes: ["E7PLAY", "New Taipei"],
  },
  {
    label: "4. Taipei 101 (query fallback preserves 101 & Latin)",
    input: {
      name: "טייפה 101 Taipei 101",
      nameZh: null,
      nameEn: null,
      cityNameEn: "Taipei",
      approxLocation: true,
    },
    expectIncludes: ["Taipei 101", "Taipei"],
  },
  {
    label: "5. Taipei 101 with exact coordinates -> /maps/dir/?api=1&destination=lat,lng",
    input: {
      name: "טייפה 101",
      nameZh: "台北101",
      nameEn: "Taipei 101",
      cityNameEn: "Taipei",
      lat: 25.034,
      lng: 121.5645,
      approxLocation: false,
    },
    expectExactUrl: "https://www.google.com/maps/dir/?api=1&destination=25.034,121.5645",
  },
  {
    label: "6. 365.Hostel (digits 365 preserved when extracted from name)",
    input: {
      name: "365.Hostel 365.合日旅所",
      nameZh: null,
      nameEn: null,
      cityNameEn: "Tainan",
      approxLocation: true,
    },
    expectIncludes: ["365.Hostel", "Tainan"],
  },
  {
    label: "7. Lane62 Hostel (digits 62 preserved)",
    input: {
      name: "Lane62 Hostel 62巷青年旅舍",
      nameZh: null,
      nameEn: null,
      cityNameEn: "Taichung",
      approxLocation: true,
    },
    expectIncludes: ["Lane62 Hostel", "Taichung"],
  },
  {
    label: "8. T-Life Hostel (single-char nameZh '踢' skipped in favor of full Latin+Zh name)",
    input: {
      name: "T-Life Hostel 踢‧生活背包客棧",
      nameZh: "踢",
      nameEn: null,
      cityNameEn: "Taichung",
      approxLocation: true,
    },
    expectIncludes: ["T-Life Hostel", "Taichung"],
  },
  {
    label: "9. Lan-Pa-Li (bare city nameZh '台中' skipped so it never queries city name alone)",
    input: {
      name: "לאן-פאלי",
      nameZh: "台中",
      nameEn: "Lan-Pa-Li hip-hop festival (venue unverified)",
      cityNameEn: "Taichung",
      approxLocation: true,
    },
    expectIncludes: ["Lan-Pa-Li hip-hop festival", "Taichung"],
  },
  {
    label: "10. GBIYUK (bare city nameZh '花蓮' skipped, Latin acronym preserved)",
    input: {
      name: "GBIYUK",
      nameZh: "花蓮",
      nameEn: null,
      cityNameEn: "Hualien",
      approxLocation: true,
    },
    expectIncludes: ["GBIYUK", "Hualien"],
  },
];

console.log("=== Running 10 Maps-Link Unit Tests ===");
for (const tc of TEN_TEST_CASES) {
  const url = buildGoogleMapsUrl(tc.input);
  const decoded = decodeURIComponent(url);
  if (tc.expectExactUrl) {
    assert.equal(url, tc.expectExactUrl, `Failed exact URL for ${tc.label}`);
  } else {
    assert.ok(
      url.startsWith("https://www.google.com/maps/search/?api=1&query="),
      `Expected search URL for ${tc.label}, got ${url}`
    );
    const queryParam = decodeURIComponent(url.split("query=")[1] ?? "");
    assert.notEqual(
      queryParam.toLowerCase(),
      tc.input.cityNameEn.toLowerCase(),
      `Query must never be the city name alone: ${queryParam}`
    );
    for (const substr of tc.expectIncludes) {
      assert.ok(
        queryParam.includes(substr),
        `Expected "${queryParam}" to include "${substr}" in ${tc.label}`
      );
    }
  }
  console.log(`PASS ${tc.label}\n   -> ${decoded}`);
}

// Also verify all 296 dataset places in /data
const root = process.cwd();
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const citiesById = Object.fromEntries(cities.map((c) => [c.id, c]));
const attractions = JSON.parse(fs.readFileSync(path.join(root, "data/attractions.json"), "utf8"));
const food = JSON.parse(fs.readFileSync(path.join(root, "data/food.json"), "utf8"));
const hotels = JSON.parse(fs.readFileSync(path.join(root, "data/hotels.json"), "utf8"));
const allPlaces = [...attractions, ...food, ...hotels];

let dirCount = 0;
let searchCount = 0;
for (const p of allPlaces) {
  const cityEn = citiesById[p.cityId]?.nameEn ?? "Taiwan";
  const url = buildGoogleMapsUrl({ ...p, cityNameEn: cityEn });
  if (p.approxLocation === false) {
    assert.ok(
      url.startsWith("https://www.google.com/maps/dir/?api=1&destination="),
      `Expected /maps/dir/ for exact place ${p.id}, got ${url}`
    );
    dirCount++;
  } else {
    assert.ok(
      url.startsWith("https://www.google.com/maps/search/?api=1&query="),
      `Expected /maps/search/ for approx place ${p.id}, got ${url}`
    );
    const q = decodeURIComponent(url.split("query=")[1] ?? "").trim();
    assert.ok(
      q.toLowerCase() !== cityEn.toLowerCase(),
      `Place ${p.id} (${p.name}) produced city-only query: "${q}"`
    );
    for (const bannedBare of BARE_CITY_NAMES_ZH) {
      assert.notEqual(
        q,
        `${bannedBare} ${cityEn}`,
        `Place ${p.id} (${p.name}) produced bare Chinese city query: "${q}"`
      );
    }
    searchCount++;
  }
}

console.log(
  `\n=== All 10 Unit Tests + ${allPlaces.length} Dataset Places Verified (${dirCount} exact /maps/dir/, ${searchCount} query /maps/search/) ===`
);
