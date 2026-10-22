# Taiwan 3D (`טייוואן 3D`) — Project Context & Architecture Guide

This document provides persistent context for developers and AI coding agents working on the **Taiwan 3D** interactive travel web application (`6 Nov – 8 Dec 2026`).

---

## 1. Trip & Dataset Summary (`/data`)

All JSON files in `/data` are generated from 4 Excel workbooks via `data/build.py` and validated at build time using Zod (`lib/data/schemas.ts` & `lib/data/loaders.ts`).

| File | Count | Details |
|---|---|---|
| `data/cities.json` | **18 cities** | **8 on route** (`onRoute: true`). `taipei` appears in 3 legs (`routeOrder: [1, 8, 10]`, **17 days** total). |
| `data/route.json` | **10 legs** + **4 audit notes** | **33 days** (`6.11` to `8.12.2026`). Always treat `legs` as the source of truth; `audit` notes are older archive entries. |
| `data/attractions.json` | **147 attractions** | Importance `1–5`, **34** marked `isNature: true`. |
| `data/food.json` | **80 food spots** | `michelin-bib` (**38**), `market` (**21**), `hidden-local` (**18**), `cheap` (**3**). |
| `data/hotels.json` | **37 hotels** | `cheap` (**19**), `quality` (**14**), `splurge` (**4**); **7** with `verified: true`. |

### Critical Data Rules
- **No Hardcoded IDs**: IDs (`attr-000-...`, `food-000-...`, `hotel-000-...`) are generated from Excel row indices and MD5 hashes. Never hardcode IDs in UI components.
- **Approximate Coordinates**: All items currently have `approxLocation: true` (city-center coordinates). `lib/data/coordinates.ts` spreads items around each city center using a deterministic **golden-angle spiral** (`indexWithinCity`). Optional `exactLat` and `exactLng` fields are supported on any item for future geocoding.
- **Prices & Verification**:
  - Always display `priceText` verbatim in UI cards. Use `priceMin`/`priceMax` only for sorting and budget range estimation.
  - Display a `"לא מאומת"` badge whenever `verified === false`, `priceVerified === false`, or `hoursVerified === false`.

---

## 2. 3D Coordinate System & Map Navigation

- **Projection (`lib/data/coordinates.ts`)**:
  - Center: `TAIWAN_CENTER_LAT = 23.62`, `TAIWAN_CENTER_LNG = 120.98`.
  - `x` = East (`+X`) / West (`-X`).
  - `z` = South (`+Z`) / North (`-Z`).
  - `y` = Elevation (`ISLAND_BASE_HEIGHT = 0.26` up to `~2.4` along the Central Mountain Range).
- **Map Navigation (`components/3d/CameraRig.tsx`)**:
  - Supports **Left-Click Drag to Move/Pan** across the island (`screenSpacePanning={false}`) and **Right-Click Drag (or Mode Toggle) to Rotate/Tilt 3D**.
  - Supports **`zoomToCursor`** so mouse-wheel/pinch zoom targets the cursor position.
  - Supports **Keyboard Navigation** (`WASD` / Arrow keys to pan, `Q`/`E` to rotate, `+`/`-` to zoom) and an **On-Screen Navigation Control Pad** (D-Pad pan, rotate, tilt, zoom, and reset).
- **No Route Line**:
  - The orange route tube/line is intentionally omitted so the island topography and markers remain clean and unobstructed.
- **React 19 + R3F Overlay (`components/3d/WorldHtml.tsx`)**:
  - Always use `<WorldHtml>` + `<WorldHtmlHost />` instead of `@react-three/drei`'s `<Html>` to avoid React 19 synchronous unmount and `removeChild` errors.
