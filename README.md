# Taiwan 3D (טייוואן 3D) — Interactive 3D Travel Web App (6 Nov – 8 Dec 2026)

An interactive RTL Hebrew 3D web application for a 33-day trip across Taiwan (`6.11 – 8.12.2026`), built with **Next.js (App Router, strict TypeScript)**, **Three.js / `@react-three/fiber` / `@react-three/drei`**, **Postprocessing Bloom**, **Zod**, **Framer Motion**, and **Tailwind CSS**.

---

## Validated Trip Dataset (`/data`)

All trip data in `/data` is statically imported and validated at build time via strict Zod schemas in `lib/data/schemas.ts` and `lib/data/loaders.ts`. Any invalid or broken `cityId` fails the build immediately.

| File | Verified Count | Breakdown |
|---|---|---|
| `data/cities.json` | **18 cities** | **8 on route** (`taipei` appears in 3 legs: `1, 8, 10` for **17 days total**) |
| `data/route.json` | **10 legs** + **4 audit notes** | 33 total days (`6.11` to `8.12.2026`). `legs` are treated as the authoritative itinerary |
| `data/attractions.json` | **147 items** | Importance `1–5`, **34 nature items** (`isNature: true`) |
| `data/food.json` | **80 items** | `michelin-bib` (**38**), `market` (**21**), `hidden-local` (**18**), `cheap` (**3**) |
| `data/hotels.json` | **37 items** | `cheap` (**19**), `quality` (**14**), `splurge` (**4**); **7 verified live prices** (`verified: true`) |

---

## How to Update Trip Data (Excel → `build.py` → `/data`)

The JSON files in `/data` are generated from the 4 source Excel workbooks (`taiwan-attractions.xlsx`, `taiwan-food.xlsx`, `taiwan-hotels.xlsx`, `taiwan-route.xlsx`) using `data/build.py`.

1. **Edit the Excel files**:
   Update any rows in the 4 Excel files (`taiwan-attractions.xlsx`, `taiwan-food.xlsx`, `taiwan-hotels.xlsx`, `taiwan-route.xlsx`).
   - Green cell background (`#C6EFCE`) on column A in `taiwan-attractions.xlsx` marks `isNature: true`.
   - Prefixing a price with `~` or including `לא אומת` marks `verified: false` (and `לבדוק` in hours marks `hoursVerified: false`).
2. **Run `data/build.py`**:
   Ensure Python 3 and `openpyxl` are installed (`pip install openpyxl`), place the 4 `.xlsx` files in the directory configured by `W` inside `data/build.py`, and run:
   ```bash
   python3 data/build.py
   ```
3. **Replace `/data` JSON files & verify build**:
   Copy the generated `cities.json`, `route.json`, `attractions.json`, `food.json`, and `hotels.json` into `/data`, then run:
   ```bash
   npm run build
   ```
   The Zod schemas in `lib/data/loaders.ts` will validate every record and verify that all `cityId` references match `cities.json`.

---

## Adding Exact Coordinates Later

Currently all places have `approxLocation: true` (city-center coordinates) and are positioned around their city center using a deterministic **golden-angle spiral** (`lib/data/coordinates.ts`) so markers never overlap.
To override any specific attraction, food spot, or hotel with exact geocoded coordinates later, add optional `"exactLat"` and `"exactLng"` fields to that item in JSON (or set `"approxLocation": false` with updated `"lat"` / `"lng"`).

---

## Development & Build Commands

```bash
# Start local development server
npm run dev

# Run ESLint
npm run lint

# Build static production bundle
npm run build
```
