export type PhilippinesStatus = "אומת" | "לא אומת" | "תאריך לא סופי";

export type PhilippinesCategoryId =
  | "attractions"
  | "food"
  | "hotels"
  | "events"
  | "nature"
  | "activities"
  | "practical";

export interface PhilippinesCity {
  id: string;
  nameHe: string;
  nameEn: string;
  lat: number;
  lng: number;
  onRoute: boolean;
  routeOrder: number[] | null;
  dates: string[];
  days: number;
}

export interface PhilippinesListRow {
  id: string;
  name: string;
  description: string;
  importance: number;
  status: PhilippinesStatus;
  source: string;
  category: PhilippinesCategoryId;
  groupKey: string;
  groupLabel: string;
  city?: string;
  cityId?: string;
  dates?: string;
  hours?: string | null;
  priceText?: string | null;
  tierHe?: string;
  typeHe?: string;
  isNature?: boolean;
}
