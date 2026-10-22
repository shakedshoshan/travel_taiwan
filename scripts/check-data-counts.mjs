import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (relPath) =>
  JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));

const cities = readJson("data/cities.json");
const route = readJson("data/route.json");
const attractions = readJson("data/attractions.json");
const food = readJson("data/food.json");
const hotels = readJson("data/hotels.json");
const practical = readJson("data/practical.json");

const kentingHotels = hotels.filter((h) => h.cityId === "kenting").length;
const hasKentingCity = cities.some((c) => c.id === "kenting");
const alertsCount = Array.isArray(practical.alerts) ? practical.alerts.length : 0;
const totalPlaces = attractions.length + food.length + hotels.length;

const counts = {
  cities: cities.length,
  hasKentingCity,
  legs: route.legs.length,
  attractions: attractions.length,
  food: food.length,
  hotels: hotels.length,
  kentingHotels,
  totalPlaces,
  alerts: alertsCount,
};

console.log("[Data Counts Check]", JSON.stringify(counts, null, 2));

const errors = [];
if (attractions.length !== 172) {
  errors.push(`attractions must be 172 (got ${attractions.length})`);
}
if (hotels.length !== 40) {
  errors.push(`hotels must be 40 (got ${hotels.length})`);
}
if (kentingHotels !== 3) {
  errors.push(`Kenting hotels must be 3 (got ${kentingHotels})`);
}
if (!hasKentingCity) {
  errors.push(`cities.json must include "kenting"`);
}
if (alertsCount <= 0) {
  errors.push(`practical.json alerts must be > 0 (got ${alertsCount})`);
}

if (errors.length > 0) {
  console.error("[Data Counts Check FAILED]:\n - " + errors.join("\n - "));
  process.exit(1);
}

console.log("[Data Counts Check PASSED] All dataset counts verified.");

// Sync /data/*.json to public/data/*.json so the Service Worker can precache /data offline
const publicDataDir = path.join(root, "public", "data");
fs.mkdirSync(publicDataDir, { recursive: true });
for (const file of [
  "cities.json",
  "route.json",
  "attractions.json",
  "food.json",
  "hotels.json",
  "practical.json",
  "overrides.json",
]) {
  fs.copyFileSync(
    path.join(root, "data", file),
    path.join(publicDataDir, file)
  );
}

