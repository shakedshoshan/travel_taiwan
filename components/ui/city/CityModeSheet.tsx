"use client";

import { useState } from "react";
import { getCityBundle } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CityCategoryChips } from "./CityCategoryChips";
import { CityInfoMenu } from "./CityInfoMenu";
import { CityPlaceList } from "./CityPlaceList";
import { CityPlacePeekCard } from "./CityPlacePeekCard";
import { CitySheetCityBanner } from "./CitySheetCityBanner";

export function CityModeSheet() {
  const store = useTripStore();
  const cityId = store.selectedCityId;
  const [infoFor, setInfoFor] = useState(cityId);
  const [infoOpen, setInfoOpen] = useState(false);
  if (infoFor !== cityId) {
    setInfoFor(cityId);
    setInfoOpen(false);
  }

  if (!store.selectedCityId) return null;
  const bundle = getCityBundle(store.selectedCityId);
  const focusedPlaceId = store.focusedPlaceId;

  const header = infoOpen ? null : (
    <CityCategoryChips
      bundle={bundle}
      onOpenInfo={() => {
        setInfoOpen(true);
        if (store.sheetSnap === "peek") tripActions.setSheetSnap("half");
      }}
    />
  );

  const handleSnapChange = (snap: typeof store.sheetSnap) => {
    if (snap === "closed") {
      tripActions.goBack();
      return;
    }
    if (snap === "peek" && focusedPlaceId) {
      tripActions.focusPlace(null, store.selectedCityId);
    }
    tripActions.setSheetSnap(snap);
  };

  return (
    <BottomSheet
      isOpen
      snap={store.sheetSnap === "closed" ? "peek" : store.sheetSnap}
      ariaLabel={bundle.city.nameHe}
      banner={<CitySheetCityBanner bundle={bundle} compact={store.sheetSnap === "peek"} />}
      header={header}
      onSnapChange={handleSnapChange}
      onClose={() => tripActions.goBack()}
    >
      {infoOpen ? (
        <CityInfoMenu bundle={bundle} onClose={() => setInfoOpen(false)} />
      ) : (
        <>
          {focusedPlaceId && store.sheetSnap !== "full" ? (
            <CityPlacePeekCard
              placeId={focusedPlaceId}
              compact={store.sheetSnap === "half"}
            />
          ) : null}
          {store.sheetSnap !== "peek" ? (
            <CityPlaceList bundle={bundle} />
          ) : null}
        </>
      )}
    </BottomSheet>
  );
}
