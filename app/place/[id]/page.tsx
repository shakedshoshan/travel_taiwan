import { notFound } from "next/navigation";
import { getAllPlaces, getPlaceById } from "@/lib/data/selectors";
import { PlaceDetailClient } from "@/components/ui/PlaceDetailClient";

export function generateStaticParams() {
  return getAllPlaces().map((place) => ({
    id: place.id,
  }));
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = getPlaceById(id);

  if (!place) {
    notFound();
  }

  const nearbyPlaces = getAllPlaces()
    .filter((p) => p.cityId === place.cityId && p.id !== place.id)
    .slice(0, 6);

  return <PlaceDetailClient place={place} nearbyPlaces={nearbyPlaces} />;
}
