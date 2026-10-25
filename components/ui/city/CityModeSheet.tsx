"use client";

import { useState } from "react";
import { getCityBundle } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CityCategoryChips } from "./CityCategoryChips";
import { CityInfoMenu } from "./CityInfoMenu";
import { CityPlaceList } from "./CityPlaceList";
import { CityPlacePeekCard } from "./CityPlacePeekCard";

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
  const showPlacePeek = Boolean(store.focusedPlaceId) && store.sheetSnap === "peek";

  return (
    <BottomSheet
      isOpen
      snap={store.sheetSnap === "closed" ? "peek" : store.sheetSnap}
      ariaLabel={bundle.city.nameHe}
      onSnapChange={(snap) => {
        if (snap === "closed") tripActions.goBack();
        else tripActions.setSheetSnap(snap);
      }}
      onClose={() => tripActions.goBack()}
    >
      {infoOpen ? (
        <CityInfoMenu bundle={bundle} onClose={() => setInfoOpen(false)} />
      ) : showPlacePeek && store.focusedPlaceId ? (
        <CityPlacePeekCard placeId={store.focusedPlaceId} />
      ) : (
        <>
          <CityCategoryChips
            bundle={bundle}
            onOpenInfo={() => {
              setInfoOpen(true);
              if (store.sheetSnap === "peek") tripActions.setSheetSnap("half");
            }}
          />
          {store.sheetSnap !== "peek" && <CityPlaceList bundle={bundle} />}
        </>
      )}
    </BottomSheet>
  );
}
