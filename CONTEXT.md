# Taiwan 3D (`טייוואן 3D`) — Project Context & Architecture Guide

This document provides persistent context for developers and AI coding agents working on the **Taiwan 3D** interactive travel web application (`6 Nov – 8 Dec 2026`).

---

## 1. Trip & Dataset Summary (`/data`)

All JSON files in `/data` are generated from 4 Excel workbooks via `data/build.py` (with post-processing in `data/overrides.json`, `data/practical.json`, and `data/images/credits.json`) and validated at build time using Zod (`lib/data/schemas.ts` & `lib/data/loaders.ts`).

| File | Count | Details |
|---|---|---|
| `data/cities.json` | **19 cities** | **8 on route** (`onRoute: true`). `taipei` appears in 3 legs (`routeOrder: [1, 8, 10]`, **17 days** total). Includes `kenting` as an off-route destination. |
| `data/route.json` | **10 legs** + **4 audit notes** | **33 days** (`6.11` to `8.12.2026`). Always treat `legs` as the source of truth; `audit` notes are older archive entries. |
| `data/attractions.json` | **147 attractions** | Importance `1–5`, **34** marked `isNature: true`. |
| `data/food.json` | **80 food spots** | `michelin-bib` (**38**), `market` (**21**), `hidden-local` (**18**), `cheap` (**3**). |
| `data/hotels.json` | **37 hotels** | `cheap` (**19**), `quality` (**14**), `splurge` (**4**); **7** with `verified: true`. |
| `data/overrides.json` | **Place overrides** | Exact `[lat, lng]`, `nameZh`, `nameEn`, and `cityId` overrides (e.g. moving Kenting attractions to `kenting`). |
| `data/practical.json` | **Practical info** | Inter-city transport (`legTransport`), special festival/election event callouts, EasyCard, SIM/eSIM, November weather, Mandarin phrases, and emergency numbers. |
| `data/images/credits.json` | **150+ photos** | Wikimedia Commons CC0/CC-BY/CC-BY-SA attribution metadata served from `public/images/`. |

### Critical Data Rules
- **No Hardcoded IDs**: IDs (`attr-000-...`, `food-000-...`, `hotel-000-...`) are generated from Excel row indices and MD5 hashes. Never hardcode IDs in UI components.
- **Coordinates & Overrides**: Items without exact coordinates in `data/overrides.json` have `approxLocation: true` (city-center coordinates). `lib/data/coordinates.ts` spreads approximate items around each city center using a deterministic **golden-angle spiral** (`indexWithinCity`).
- **Prices & Verification**:
  - Always display `priceText` (or `formatDisplayPriceText(priceText)`) in UI cards. Use `priceMin`/`priceMax` only for sorting and budget range estimation.
  - Display a `"לא מאומת"` badge whenever `verified === false`, `priceVerified === false`, or `hoursVerified === false`.

---

## 2. Modular Folder & Component Architecture

To keep the codebase clean and AI-navigable, **every file is kept small (< 390 lines)** with a single responsibility:

### `/lib/data` — Data Validation, Projection, Search & Images
- `schemas.ts`: Strict Zod schemas derived from `data/types.ts`. Fails build if any `cityId` is invalid.
- `taiwanGeo.ts`: Authentic Taiwan main-island coastline polygon, 4 offshore island polygons (`penghu`, `xiaoliuqiu`, `green-island`, `orchid-island`), 18x11 DEM grid, and Central Mountain Range peak nodes.
- `coordinates.ts`: Projects `[lat, lng]` to 3D island space (`latLngToXZ`, `latLngToWorld3D`), computes elevation (`getElevationAtLatLng`), and calculates golden-angle spiral offsets (`resolvePlaceCoordinates`).
- `loaders.ts`: Validates JSON + `overrides.json` into `TRIP_DATA`.
- `selectors.ts`: Core selectors (`getTimelineDays`, `getCityBundle`, `getPlaceById`, `buildGoogleMapsUrl`, `formatDisplayPriceText`).
- `search.ts`: Full-text search across cities, legs, attractions, food, and hotels (`searchEverything`).
- `foodAndPlaceMeta.ts`: Food/hotel category metadata (`FOOD_TYPE_META`, `HOTEL_TIER_META`), Haversine distance (`computeDistanceKm`), `checkIsOpenNow` (UTC+8 Taiwan time), and GPS/city-fallback `resolveNearMeCoordinates`.
- `placeImages.ts` & `imageMatchers.ts`: Maps every city, route leg, and place to its Wikimedia Commons photo and license attribution.
- `cityTransitGuides.ts`: Hebrew public-transit directions per `CityId`.

### `/lib/store` — Hydration-Safe Client State
- `tripStoreTypes.ts`: State types (`TripStoreState`, `LayerToggles`, `SheetSnapPoint`, `CameraCommandType`) and default state.
- `useTripStore.ts`: `useSyncExternalStore` + `localStorage` store and `tripActions`.

### `/components/3d` — Three.js r186 + React Three Fiber Scene
- `MapCanvas.tsx` & `MiniTaiwanMap.tsx`: R3F `<Canvas>` wrappers with `<WorldHtmlHost />`.
- `CameraRig.tsx` + `/components/3d/camera/`:
  - `cameraMath.ts`: `computeFitIslandPose`, `applySheetReframeOffset`, and `clampTargetToBounds`.
  - `useCameraPointerAndKeys.ts`: Pointer-drag panning, double-tap zoom, and desktop keyboard navigation.
- `TaiwanIsland.tsx`, `OceanWater.tsx` + `/components/3d/island/`:
  - `polygonMath.ts`: Shared 2D polygon point-in-polygon and edge distance math.
  - `terrainBuilder.ts`: Main island + offshore island extrusion, DEM vertex coloring, and custom terrain shaders.
  - `oceanBuilder.ts`: Coastline signed-distance field (`DataTexture`), shore foam ribbon, and custom water shaders.
- `CityPins.tsx` + `/components/3d/pins/SingleCityPin.tsx`: 3D city pins, label nudges, Kenting dashed pin, and offshore island badges.
- `CategoryMarkers.tsx` + `/components/3d/markers/`:
  - `markerConfig.ts`: Marker archetypes (`lantern`, `bowl`, `bed`, `nature`, `star`) and visibility rules.
  - `InstancedCategoryGroup.tsx`: GPU-instanced category meshes with invisible `>=44px` hit spheres and zoom-based LOD.
  - `MarkerTooltipCard.tsx`: `<WorldHtml>` floating place card on hover/focus.
- `CityDestination3DMap.tsx` + `/components/3d/city-map/`:
  - `cityMapLayout.ts`: Deterministic ring/spiral layout for zoomed-in 3D city dioramas (`computeCityMapNodes`).
  - `DestinationPinModels.tsx` & `SingleDestinationPin.tsx`: Miniature 3D hotel towers, night market archways, food pavilions, pagodas, and mountain peaks.
  - `CityDestination3DScene.tsx`, `CityDestinationHUD.tsx`, & `FocusedDestinationCard.tsx`: Interactive 3D city diorama scene and HUD.
- `DelightDetails.tsx` + `/components/3d/delight/LandmarkDioramas.tsx`: Mini Taipei 101, Sun Moon Lake + cable car, Alishan forest train, rising sky lanterns, and drifting mountain clouds.
- `WorldHtml.tsx` + `/components/3d/overlay/labelOverlapSolver.ts`: Pure React 19 DOM overlay projected from 3D coordinates with automatic 2D label overlap solving.
- `Map2DFallback.tsx`, `TaiwanLoadingScreen.tsx`, `threeCompat.ts`.

### `/components/ui` — Mobile-First RTL UI Components
- `Navbar.tsx`: Slim top header (`48px`) + bottom 5-tab navigation bar (`מפה`, `מסלול`, `אוכל`, `מלונות`, `טיפים`).
- `LayerToggles.tsx`: Horizontally scrollable category filter chips + `"שכבות"` bottom sheet.
- `TimelineScrubber.tsx`: Collapsed `64px` day pill + expanded 33-day RTL timeline sheet.
- `BottomSheet.tsx`: Touch-draggable multi-snap bottom sheet (`peek` 20% / `half` 55% / `full` 90%) synced with browser `popstate`.
- `CityDrawer.tsx` + `/components/ui/drawer/CityDrawerTabsContent.tsx`: City photo strip, 4 tabs (`אטרקציות`, `אוכל`, `מלונות`, `ימים`), and 3D city zoom trigger.
- `PlaceCard.tsx` & `PlaceDetailClient.tsx`: Reusable place cards and full place detail view.
- `/components/ui/food/FoodFilterSheet.tsx`: Advanced food filter bottom sheet.
- `/components/ui/route/RouteLegCard.tsx`: Individual route leg card with photos, transport, and event callouts.
- `/components/ui/info/EmergencyAndPhrasesSection.tsx` & `ImageCreditsDetails.tsx`: Emergency dialers, `zh-TW` speech synthesis phrasebook, and Wikimedia Commons credits list.
- `CommandSearch.tsx`, `MapNavigationPad.tsx`, `PwaRegister.tsx`.

---

## 3. 3D Coordinate System & Map Navigation

- **Projection (`lib/data/coordinates.ts`)**:
  - Center: `TAIWAN_CENTER_LAT = 23.62`, `TAIWAN_CENTER_LNG = 120.98`.
  - `x` = East (`+X`) / West (`-X`).
  - `z` = South (`+Z`) / North (`-Z`).
  - `y` = Elevation (`ISLAND_BASE_HEIGHT = 0.24` up to `~2.5` along the Central Mountain Range).
- **Map Navigation (`components/3d/CameraRig.tsx`)**:
  - Fits the entire island inside the safe viewport on mount (`computeFitIslandPose`) and reframes north/south when the bottom sheet snaps to `half` (`applySheetReframeOffset`).
  - Supports touch 1-finger pan, 2-finger pinch/rotate/tilt, double-tap zoom, desktop mouse drag & wheel `zoomToCursor`, keyboard `WASD`/arrows, and a single `44x44px` Recenter FAB (`MapNavigationPad.tsx`).
- **No Route Line**:
  - The orange route tube/line is intentionally omitted so the island topography and markers remain clean and unobstructed.
- **React 19 + R3F Overlay (`components/3d/WorldHtml.tsx`)**:
  - Always use `<WorldHtml>` + `<WorldHtmlHost />` instead of `@react-three/drei`'s `<Html>` to avoid React 19 synchronous unmount and `removeChild` errors.
