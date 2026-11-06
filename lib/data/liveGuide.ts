import liveGuideRaw from "../../data/live-guide.json" with { type: "json" };
import { LiveGuideFileSchema } from "./schemas";
import type { LiveGuideEntryValidated } from "./schemas";

export const LIVE_GUIDE = LiveGuideFileSchema.parse(liveGuideRaw);

export type LiveGuideEntry = LiveGuideEntryValidated;
