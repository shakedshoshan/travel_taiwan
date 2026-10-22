"use client";

import { useMemo } from "react";
import { WorldHtml } from "./WorldHtml";
import { getAllCities } from "@/lib/data/selectors";
import { OFFSHORE_ISLANDS } from "@/lib/data/taiwanGeo";
import { latLngToWorld3D } from "@/lib/data/coordinates";
import { useTripStore } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";
import {
  computeLabelNudges,
  SingleCityPin,
} from "./pins/SingleCityPin";

interface CityPinsProps {
  selectedCityId: CityId | null;
  activeTimelineCityId: CityId;
  isNightMode: boolean;
  onSelectCity: (cityId: CityId) => void;
}

export function CityPins({
  selectedCityId,
  activeTimelineCityId,
  isNightMode,
  onSelectCity,
}: CityPinsProps) {
  const store = useTripStore();
  const cities = getAllCities();
  const labelNudges = useMemo(() => computeLabelNudges(cities), [cities]);

  // Optional Kenting (קנטינג) off-route dashed marker on the southern cape
  const kentingWorld = useMemo(
    () => latLngToWorld3D(21.9483, 120.7798, 0.14),
    []
  );

  // Offshore islands world positions for subtle labels
  const offshoreMarkers = useMemo(
    () =>
      OFFSHORE_ISLANDS.map((isl) => ({
        ...isl,
        world: latLngToWorld3D(isl.centerLat, isl.centerLng, 0.16),
      })),
    []
  );

  return (
    <group name="city-pins">
      {cities.map((city, idx) => (
        <SingleCityPin
          key={city.id}
          city={city}
          index={idx}
          isSelected={selectedCityId === city.id}
          isTimelineActive={activeTimelineCityId === city.id}
          isNightMode={isNightMode}
          prefersReducedMotion={store.prefersReducedMotion}
          labelNudge={labelNudges.get(city.id) ?? { x: 0.35, z: 0 }}
          onSelectCity={onSelectCity}
        />
      ))}

      {/* Optional Kenting (קנטינג) Off-Route Dashed Pin */}
      <group
        position={[kentingWorld.x, kentingWorld.y, kentingWorld.z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectCity("pingtung");
        }}
      >
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.48, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.6}
          />
        </mesh>
        <WorldHtml
          position={[0.35, 0.62, -4.05]}
          center
          distanceFactor={16}
          zIndexRange={[18, 0]}
        >
          <button
            type="button"
            dir="rtl"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCity("pingtung");
            }}
            className="relative cursor-pointer select-none whitespace-nowrap rounded-full border-2 border-dashed border-sky-400/90 bg-slate-900/85 px-2.5 py-0.5 text-[10.5px] font-bold text-sky-200 shadow-md after:absolute after:-inset-2.5 after:content-['']"
          >
            קנטינג (אופציונלי)
          </button>
        </WorldHtml>
      </group>

      {/* Offshore Island Mini Labels (Penghu, Xiaoliuqiu, Green Island, Orchid Island) */}
      {offshoreMarkers.map((isl) => (
        <group
          key={isl.id}
          position={[isl.world.x, isl.world.y, isl.world.z]}
          onClick={(e) => {
            e.stopPropagation();
            if (isl.id === "xiaoliuqiu") onSelectCity("pingtung");
            else if (isl.id === "green-island" || isl.id === "orchid-island")
              onSelectCity("taitung");
          }}
        >
          <WorldHtml
            position={[
              isl.id === "xiaoliuqiu"
                ? -3.15
                : isl.id === "orchid-island"
                  ? 0.55
                  : 0.15,
              0.22,
              isl.id === "xiaoliuqiu"
                ? -1.55
                : isl.id === "orchid-island"
                  ? -2.15
                  : 0.15,
            ]}
            center
            distanceFactor={18}
            zIndexRange={[14, 0]}
          >
            <div
              dir="rtl"
              className="pointer-events-none select-none whitespace-nowrap rounded-full border border-teal-300/40 bg-slate-900/70 px-2 py-0.5 text-[9.5px] font-semibold text-teal-100 backdrop-blur-xs"
            >
              {isl.nameHe}
            </div>
          </WorldHtml>
        </group>
      ))}
    </group>
  );
}
