import type { Metadata } from "next";
import { EventsExplorer } from "@/components/ui/events/EventsExplorer";

export const metadata: Metadata = {
  title: "אירועים | טייוואן 3D",
  description:
    "פסטיבלים, הופעות ואירועים מיוחדים לפי תאריך — טייוואן (מסלול + אטרקציות) או פיליפינים לפי בחירת היעד.",
};

export default function EventsPage() {
  return <EventsExplorer />;
}
