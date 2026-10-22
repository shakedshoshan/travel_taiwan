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

export function matchSemanticPlaceImage(
  place: EnrichedPlace,
  credits: ImageCreditRecord[],
  toPlaceImageMeta: (
    record: ImageCreditRecord,
    overrideMatch?: "exact" | "representative"
  ) => PlaceImageMeta,
  getImageByFile: (
    relFile: string,
    overrideMatch?: "exact" | "representative"
  ) => PlaceImageMeta
): PlaceImageMeta | null {
  const text = `${place.name} ${place.nameZh ?? ""} ${place.description}`.toLowerCase();
  const findCreditByQuery = (
    predicate: (entry: ImageCreditRecord) => boolean
  ) => credits.find(predicate);

  // Hotels without direct file
  if (place.kind === "hotel") {
    const isHotSpringOrResort =
      text.includes("מעיינות") ||
      text.includes("溫泉") ||
      text.includes("ספא") ||
      place.tier === "splurge" ||
      place.cityId === "sun-moon-lake";

    if (isHotSpringOrResort) {
      return getImageByFile(
        "hotels/generic-hot-spring-hotel.jpg",
        "representative"
      );
    }
    return getImageByFile("hotels/generic-hotel-room-2.jpg", "representative");
  }

  // Food without direct file
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
      const rec = findCreditByQuery((c) =>
        c.title.includes("Tube rice pudding")
      );
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
    if (
      text.includes("肉圓") ||
      text.includes("肉員") ||
      text.includes("באוואן")
    ) {
      const rec = findCreditByQuery((c) => c.query.includes("ba wan"));
      if (rec) return toPlaceImageMeta(rec, "representative");
    }
    if (
      text.includes("圓仔") ||
      text.includes("汤圆") ||
      text.includes("כדורי אורז")
    ) {
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
    if (
      text.includes("סשימי") ||
      text.includes("דגים") ||
      text.includes("סרטן")
    ) {
      const rec = findCreditByQuery((c) =>
        c.query.includes("Donggang fish market")
      );
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
      const cityMarket = credits.find(
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

  // Attractions without direct file
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
  if (
    text.includes("החלקה") ||
    text.includes("roller186") ||
    text.includes("אקיוזפייב")
  ) {
    const rec = findCreditByQuery((c) => c.query === "Taipei Arena");
    if (rec) return toPlaceImageMeta(rec, "representative");
  }
  if (text.includes("סרטן ואנלי") || text.includes("יהליו")) {
    const rec = findCreditByQuery((c) => c.query.includes("Yehliu Geopark"));
    if (rec) return toPlaceImageMeta(rec, "representative");
  }

  return null;
}
