"use client";

import { useMemo, useRef, useState } from "react";
import { TAIWAN_COASTLINE_LAT_LNG } from "@/lib/data/taiwanGeo";
import {
  getAllCities,
  getAllPlaces,
  getCityById,
  type TimelineDay,
} from "@/lib/data/selectors";
import type { EnrichedPlace } from "@/lib/data/loaders";
import type { CityId } from "@/data/types";
import {
  tripActions,
  useTripStore,
  type LayerToggles,
} from "@/lib/store/useTripStore";

interface Map2DFallbackProps {
  selectedCityId: CityId | null;
  currentDay: TimelineDay;
  isNightMode: boolean;
  layerToggles: LayerToggles;
  onSelectCity: (cityId: CityId) => void;
  onSelectPlace: (place: EnrichedPlace) => void;
  compact?: boolean;
}

// Project lat/lng to SVG viewBox [0..400, 0..640]
function latLngToSvg(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - 119.85) / 2.35) * 400;
  const y = ((25.45 - lat) / 3.75) * 640;
  return { x, y };
}

export function Map2DFallback({
  selectedCityId,
  currentDay,
  isNightMode,
  layerToggles,
  onSelectCity,
  onSelectPlace,
  compact = false,
}: Map2DFallbackProps) {
  const store = useTripStore();
  const [hoveredPlace, setHoveredPlace] = useState<EnrichedPlace | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const cities = getAllCities();
  const { x: panX, y: panY, zoom } = store.map2DView;

  const islandPolygonPoints = useMemo(() => {
    return TAIWAN_COASTLINE_LAT_LNG.map(([lat, lng]) => {
      const { x, y } = latLngToSvg(lat, lng);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, []);

  const visiblePlaces = useMemo(() => {
    return getAllPlaces().filter((place) => {
      if (place.kind === "attraction") {
        return place.isNature ? layerToggles.nature : layerToggles.attractions;
      }
      if (place.kind === "food") {
        if (place.type === "market") return layerToggles.markets;
        if (place.type === "michelin-bib") return layerToggles.michelinBib;
        if (place.type === "hidden-local") return layerToggles.hiddenLocal;
        return layerToggles.food;
      }
      return layerToggles.hotels;
    });
  }, [layerToggles]);

  const activeCity = getCityById(currentDay.cityId);
  const travelerSvg = latLngToSvg(activeCity.lat, activeCity.lng);

  return (
    <div
      onPointerDown={(e) => {
        setDragging(true);
        dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        tripActions.setMap2DView({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        });
      }}
      onPointerUp={() => {
        setDragging(false);
      }}
      onPointerCancel={() => {
        setDragging(false);
      }}
      onWheel={(e) => {
        const factor = e.deltaY < 0 ? 1.12 : 0.9;
        tripActions.setMap2DView({
          zoom: Math.max(0.65, Math.min(3.8, zoom * factor)),
        });
      }}
      className={`relative flex h-full w-full cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing ${
        isNightMode
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950"
          : "bg-gradient-to-b from-cyan-200 via-sky-200 to-teal-100"
      }`}
    >
      <svg
        viewBox="0 0 400 640"
        style={{
          transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`,
          transition: dragging ? "none" : "transform 0.18s ease-out",
        }}
        className="h-full max-h-[88vh] w-full max-w-[540px] drop-shadow-2xl"
        aria-label="מפת טייוואן דו-ממדית אינטראקטיבית"
      >
        <defs>
          <linearGradient id="islandGradDay" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="55%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="islandGradNight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a3a" />
            <stop offset="55%" stopColor="#134e4a" />
            <stop offset="100%" stopColor="#0f292e" />
          </linearGradient>
        </defs>

        {/* Sandy coastal halo */}
        <polygon
          points={islandPolygonPoints}
          fill="none"
          stroke={isNightMode ? "#38bdf8" : "#fde68a"}
          strokeWidth="12"
          strokeLinejoin="round"
          opacity={isNightMode ? 0.35 : 0.75}
        />

        {/* Main Taiwan Island Polygon */}
        <polygon
          points={islandPolygonPoints}
          fill={isNightMode ? "url(#islandGradNight)" : "url(#islandGradDay)"}
          stroke={isNightMode ? "#2dd4bf" : "#047857"}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Central Mountain Range Spine Contour */}
        <path
          d="M 275 88 Q 250 205 228 320 T 175 510"
          fill="none"
          stroke={isNightMode ? "#94a3b8" : "#ecfdf5"}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="3 9"
          opacity="0.45"
        />

        {/* Place Markers (Spiral offset coordinates) */}
        {!compact &&
          visiblePlaces.map((place) => {
            const { x, y } = latLngToSvg(
              place.resolvedCoords.lat,
              place.resolvedCoords.lng
            );
            const color =
              place.kind === "food"
                ? place.type === "market"
                  ? "#ff5a36"
                  : "#f43f5e"
                : place.kind === "hotel"
                  ? "#38bdf8"
                  : place.isNature
                    ? "#10b981"
                    : "#fbbf24";
            return (
              <circle
                key={place.id}
                cx={x}
                cy={y}
                r={place.kind === "hotel" ? 3 : 2 + place.importance * 0.55}
                fill={color}
                stroke="#ffffff"
                strokeWidth="0.8"
                className="cursor-pointer transition-transform hover:scale-150"
                onMouseEnter={() => setHoveredPlace(place)}
                onMouseLeave={() => setHoveredPlace(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlace(place);
                }}
              />
            );
          })}

        {/* 18 City Markers */}
        {cities.map((city) => {
          const { x, y } = latLngToSvg(city.lat, city.lng);
          const isSelected = selectedCityId === city.id;
          const isActive = currentDay.cityId === city.id;
          return (
            <g
              key={city.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCity(city.id);
              }}
            >
              {(isSelected || isActive) && (
                <circle
                  r={14}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="2.5"
                  className="animate-ping"
                />
              )}
              <circle
                r={city.onRoute ? 7.5 : 4.5}
                fill={
                  isSelected
                    ? "#facc15"
                    : city.onRoute
                      ? "#ff5a36"
                      : "#94a3b8"
                }
                stroke="#ffffff"
                strokeWidth="2"
              />
              {(city.onRoute || !compact) && (
                <text
                  x={city.lng > 121.1 ? 11 : -11}
                  y={4}
                  textAnchor={city.lng > 121.1 ? "start" : "end"}
                  className="select-none fill-slate-900 text-[11px] font-bold dark:fill-white"
                  style={{
                    paintOrder: "stroke",
                    stroke: isNightMode ? "#0f172a" : "#ffffff",
                    strokeWidth: "3px",
                  }}
                >
                  {city.nameHe}
                </text>
              )}
            </g>
          );
        })}

        {/* Active Traveler Marker */}
        <g transform={`translate(${travelerSvg.x}, ${travelerSvg.y - 14})`}>
          <rect
            x="-28"
            y="-18"
            width="56"
            height="18"
            rx="9"
            fill="#0f172a"
            stroke="#facc15"
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="-6"
            textAnchor="middle"
            fill="#fde047"
            fontSize="9.5"
            fontWeight="bold"
          >
            {`יום ${currentDay.dayNumber} (${currentDay.dateShort})`}
          </text>
        </g>
      </svg>

      {hoveredPlace && (
        <div
          dir="rtl"
          className="pointer-events-none absolute top-20 right-6 z-20 max-w-xs rounded-2xl border border-white/40 bg-slate-900/95 p-3 text-xs text-white shadow-xl"
        >
          <div className="font-bold text-amber-300">{hoveredPlace.name}</div>
          <div className="mt-0.5 text-slate-300">
            {hoveredPlace.description}
          </div>
        </div>
      )}
    </div>
  );
}
