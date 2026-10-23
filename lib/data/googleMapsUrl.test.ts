import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildGoogleMapsUrl } from "./googleMapsUrl.ts";

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");

const DIR = "https://www.google.com/maps/dir/?api=1&destination=";

function queryOf(url: string): string {
  const raw = url.split("query=")[1] ?? "";
  return decodeURIComponent(raw);
}

test("Taipei 101 exact coordinates open directions", () => {
  const url = buildGoogleMapsUrl({
    name: "טייפה 101",
    nameZh: "台北101",
    nameEn: "Taipei 101",
    cityNameEn: "Taipei",
    lat: 25.034,
    lng: 121.5645,
    approxLocation: false,
  });
  assert.equal(url, `${DIR}25.034,121.5645`);
});

test("Elephant Mountain exact coordinates open directions", () => {
  const url = buildGoogleMapsUrl({
    name: "הר הפיל",
    nameEn: "Elephant Mountain",
    cityNameEn: "Taipei",
    lat: 25.0273,
    lng: 121.5707,
    approxLocation: false,
  });
  assert.equal(url, `${DIR}25.0273,121.5707`);
});

test("Yehliu exact coordinates open directions", () => {
  const url = buildGoogleMapsUrl({
    name: "יהליו",
    nameZh: "野柳地質公園",
    nameEn: "Yehliu Geopark",
    cityNameEn: "New Taipei",
    lat: 25.2063,
    lng: 121.6905,
    approxLocation: false,
  });
  assert.equal(url, `${DIR}25.2063,121.6905`);
});

test("E7PLAY keeps digits and does not repeat the city", () => {
  const url = buildGoogleMapsUrl({
    name: "E7PLAY",
    nameZh: null,
    nameEn: null,
    cityNameEn: "New Taipei",
    approxLocation: true,
  });
  const query = queryOf(url);
  assert.match(query, /E7PLAY/);
  assert.match(query, /New Taipei/);
  assert.notEqual(query, "New Taipei New Taipei");
  assert.notEqual(query, "E PLAY New Taipei");
});

test("Lane62 name keeps digits", () => {
  const url = buildGoogleMapsUrl({
    name: "Lane62 Hostel",
    cityNameEn: "Taichung",
    approxLocation: true,
  });
  const query = queryOf(url);
  assert.match(query, /Lane62/);
  assert.match(query, /Taichung/);
  assert.equal(query.includes("Lane "), false);
});

test("approximate Taipei 101 keeps the number", () => {
  const url = buildGoogleMapsUrl({
    name: "טייפה 101",
    nameEn: "Taipei 101",
    cityNameEn: "Taipei",
    approxLocation: true,
  });
  const query = queryOf(url);
  assert.match(query, /Taipei 101/);
  assert.doesNotMatch(query, /Taipei Taipei Taiwan/);
});

test("Lane62 Chinese nameZh is paired with Taichung", () => {
  const url = buildGoogleMapsUrl({
    name: "Lane62 Hostel 62巷青年旅舍",
    nameZh: "巷青年旅舍",
    cityNameEn: "Taichung",
    approxLocation: true,
  });
  const query = queryOf(url);
  assert.match(query, /巷青年旅舍/);
  assert.match(query, /Taichung/);
  assert.doesNotMatch(query, /^Taichung/);
});

test("Hebrew-only name is kept and the city is added once", () => {
  const url = buildGoogleMapsUrl({
    name: "שוק ראוהה",
    cityNameEn: "Taipei",
    approxLocation: true,
  });
  const query = queryOf(url);
  assert.match(query, /שוק ראוהה/);
  assert.match(query, /Taipei/);
  assert.equal(query, "שוק ראוהה Taipei");
});

test("empty place name never falls back to the city alone", () => {
  const url = buildGoogleMapsUrl({
    name: "",
    nameZh: "  ",
    nameEn: null,
    cityNameEn: "Taipei",
    approxLocation: true,
  });
  const query = queryOf(url);
  assert.notEqual(query, "Taipei");
  assert.notEqual(query, "Taipei Taipei");
  assert.notEqual(query, "Taipei Taipei Taiwan");
  assert.equal(query, "Taiwan");
});

test("approximate hostel name with digits is not stripped", () => {
  const url = buildGoogleMapsUrl({
    name: "365.Hostel",
    cityNameEn: "Tainan",
    lat: 22.99,
    lng: 120.21,
    approxLocation: true,
    resolvedCoords: { lat: 22.99, lng: 120.21, isExact: true },
  });
  const query = queryOf(url);
  assert.match(url, /\/maps\/search\//);
  assert.match(query, /365\.Hostel/);
  assert.match(query, /Tainan/);
});

test("dataset places use dir links only when approxLocation is false", () => {
  const cities = JSON.parse(fs.readFileSync(path.join(dataDir, "cities.json"), "utf8")) as {
    id: string;
    nameEn: string;
  }[];
  const citiesById = Object.fromEntries(cities.map((city) => [city.id, city]));
  const kinds = ["attractions.json", "food.json", "hotels.json"] as const;
  let checked = 0;
  for (const file of kinds) {
    const places = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8")) as {
      id: string;
      name: string;
      nameZh?: string | null;
      nameEn?: string | null;
      cityId: string;
      lat?: number;
      lng?: number;
      approxLocation?: boolean;
    }[];
    for (const place of places) {
      const cityNameEn = citiesById[place.cityId]?.nameEn ?? "";
      const url = buildGoogleMapsUrl({ ...place, cityNameEn });
      const query = queryOf(url);
      if (place.approxLocation === false) {
        assert.ok(url.startsWith(DIR), `${place.id} should be a directions link`);
      } else {
        assert.ok(url.includes("/maps/search/"), `${place.id} should be a search link`);
        assert.notEqual(query.toLowerCase(), cityNameEn.toLowerCase());
        assert.notEqual(query, `${cityNameEn} ${cityNameEn}`);
        assert.notEqual(query, `${cityNameEn} ${cityNameEn} Taiwan`);
      }
      checked += 1;
    }
  }
  assert.ok(checked >= 10);
});
