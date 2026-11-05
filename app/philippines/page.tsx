import type { Metadata } from "next";
import { PhilippinesExplorer } from "@/components/ui/philippines/PhilippinesExplorer";
import { PHILIPPINES_DATA } from "@/lib/data/philippines/loaders";

export const metadata: Metadata = {
  title: "פיליפינים | מדריך טיול (דצמ׳ 2026 – ינו׳ 2027)",
  description: `מדריך רשימות לפיליפינים: ${PHILIPPINES_DATA.totalRows} פריטים ב-${PHILIPPINES_DATA.cities.length} יעדים — אטרקציות, אוכל, מלונות, אירועים, טבע, פעילויות ומידע שימושי עם סטטוס אימות ומקורות.`,
};

export default function PhilippinesPage() {
  return <PhilippinesExplorer />;
}
