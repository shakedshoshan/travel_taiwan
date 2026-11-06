import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { LiveGuideFileSchema } from "./schemas.ts";
import {
  filterAndSortLiveGuide,
  LIVE_GUIDE_DEFAULT_FILTERS,
} from "./liveGuideFilter.ts";

const guidePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data/live-guide.json"
);
const liveGuide = LiveGuideFileSchema.parse(
  JSON.parse(fs.readFileSync(guidePath, "utf8"))
);

test("live guide filter: Mizrahnik source keeps only מזרחניק rows", () => {
  const miz = filterAndSortLiveGuide(liveGuide.entries, {
    ...LIVE_GUIDE_DEFAULT_FILTERS,
    source: "mizrahnik",
  });
  assert.ok(miz.length > 0);
  for (const e of miz) {
    assert.equal(e.source, "מזרחניק");
  }
});

test("live guide filter: status bucket closed_limited matches Hebrew סגור", () => {
  const closed = filterAndSortLiveGuide(liveGuide.entries, {
    ...LIVE_GUIDE_DEFAULT_FILTERS,
    statusBucket: "closed_limited",
  });
  assert.ok(closed.length > 0);
  for (const e of closed) {
    assert.match(e.status ?? "", /סגור|מוגבל|סגורים|סגורה|סגורות/);
  }
});

test("live guide filter: default sort is priority desc then area", () => {
  const sorted = filterAndSortLiveGuide([...liveGuide.entries], {
    ...LIVE_GUIDE_DEFAULT_FILTERS,
  });
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur.priority === prev.priority) {
      assert.ok(cur.area.localeCompare(prev.area, "he") >= 0);
    } else {
      assert.ok(cur.priority <= prev.priority);
    }
  }
});
