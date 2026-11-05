# Philippines trip data (JSON + xlsx) — Shaked, mid-Dec 2026 to mid-Jan 2027

Built by `build.py` (`/workspace/.venv-xlsx/bin/python build.py`). Schema follows `/workspace/taiwan-data` (id/name/nameZh/city/cityId/lat/lng/approxLocation…) with:
- `status` (אומת / לא אומת / תאריך לא סופי) and `source` (URL) fields.
- `nameZh` is always null.
- Food `priceUnit` = PHP per person. Hotels `priceUnit` = ILS per couple, 5 nights (USD 1=3.033 ILS, PHP 1=0.04856 ILS).
- New files: events.json (with `dates`), nature.json, activities.json, practical.json (`topic`).
- No route.json yet (dates not set).
- Coordinates are city-centre approximations.
- Nature rows stay green-filled in the xlsx.

## Deep verification pass — 2026-11-05 (Asia/Jerusalem)

### What changed (high level)
- **Events:** Sinulog Grand Parade confirmed 17.1.2027 on Sinulog Foundation site; Ati-Atihan main window 7–17.1.2027 (LGU/Bombo); Dinagyang 22–24.1.2027 (IFFI/Daily Guardian/Manila Times); Traslacion date fixed 9.1.2027 with route/time still TBC; Giant Lantern competition date still TBC; Ayala Triangle lights verified as seasonal pattern; Manila NYE venues from GMA 2025→2026 pattern marked TBC for 2026→2027 lineup. **Cut:** Chinese New Year 6.2.2027 (outside trip window).
- **Food:** Split Binondo into named stalls with hours/prices from Out of Town Blog 2026 update; Salcedo Sat 7–14 & Legazpi Sun 7:30–14 verified; Sugbo Mercado hours reported Tue–Sun 16:00–midnight; Michelin Bib Gourmand 2026 named (Tribune full list, 5 Nov 2025): Manam, Lampara/Sarsa/Your Local, Morning Sun/Palm Grill, Cebu Bib set. Bohol food fleshed (Alona seafood, ube/calamay, bingka). **Cut/demoted:** generic “Michelin list” blob replaced by named rows; Star City attraction removed as weak vs taste; Larsian kept at importance 1.
- **Hotels:** Filled Manila (City Garden GRAND Festive Haven ₱5,500/night thru 30.12.2026 → ~₪1,336 / 5 nights) and Bohol (Henann Alona Beach official BAR ₱5,754/night off-peak → ~₪1,400 / 5 nights; holiday spike + mandatory dinner noted). Placeholder “אין נתון מחיר” rows replaced.
- **Practical:** GCash GTourist verified for Israel; El Nido ETDF ₱400/₱200 (5 days); Boracay fees ₱150+₱300+₱50; OceanJet Cebu–Tagbilaran ~2h / fares reported; ATM limits, VAT 12%, tipping 10%, plugs 220V A/B/C from DOT AU page.
- **Nature/activities:** ETDF, Coron lake fees (secondary), Kawasan regulated ₱2,000, PPUR 900/day + reported gate fees; PPUR booking activity added.

### Still unverified / TBC (honest)
- Holiday hotel rates for most resorts (Crimson, Shangri-La Boracay/Mactan agent deals, Coron Discovery/Two Seasons, Amorita/Bellevue/South Palms).
- Exact NYE 2026 party lineups (Boracay + Manila).
- Traslacion 2027 departure time/route; Giant Lantern 2026 competition night.
- Many island restaurant hours/prices; Mercato Centrale current venue; Quik Snack dine-in status; Rico’s live price list (site 502 during pass).
- El Nido/Coron private boat prices; Balicasag daily quota numbers; Apo Island day fees.
- VAT tourist refund eligibility details.

### Sources opened (sample)
eVisaPH; eTravel FAQ; GCash GTourist help; Sinulog Foundation; Cebu Daily News; Bombo Radyo Kalibo; Daily Guardian / Manila Times Dinagyang; Inquirer/Philstar Nazareno; El Nido Map ETDF; Aklan iPass; boracay.biz fees; highlandadventuresph Kawasan; PPUR travel advisory; palawanisland.com fees; Tribune Michelin 2026; Henann Alona official booking; City Garden GRAND Festive Haven; DOT Philippines AU travel info; OceanJet fare pages via Pamasahe.
