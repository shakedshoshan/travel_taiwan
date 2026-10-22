# Taiwan trip data (JSON)
Generated from the 4 Excel files by `build.py` (`python3 build.py`, needs openpyxl, reads /workspace/*.xlsx). Hebrew text is untouched. Types: `types.ts`.

| File | Count | Notes |
|---|---|---|
| attractions.json | 147 | 34 `isNature` (green fill) |
| food.json | 80 | 38 michelin-bib, 21 market, 18 hidden-local, 3 cheap |
| hotels.json | 37 | 19 cheap, 14 quality, 4 splurge; 7 `verified` live prices |
| route.json | 10 legs + 4 audit notes | `legs` = sheet מסלול, `audit` = sheet בקרה |
| cities.json | 18 | 8 on route (taipei appears 3×) |

- `cityId` is shared across all files; every item maps to a city in cities.json.
- `priceMin/priceMax` parsed from the first price segment of `priceText` (NT$). Hotel prices may be per bed or per room — see `priceText`.
- `verified`: false when marked `~` / `לא אומת` (food also false when hours say `לבדוק`; see `hoursVerified`, `priceVerified`).
- All places have `approxLocation: true` and use city-center coords — add jitter in the UI or geocode later.
- The `בקרה` audit sheet is older than the route and partly contradicts it (e.g. Sun Moon Lake night dates) — treat `legs` as truth.
