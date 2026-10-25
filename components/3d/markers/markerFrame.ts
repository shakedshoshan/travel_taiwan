export interface ClusterBadge {
  key: string;
  count: number;
  x: number;
  y: number;
  z: number;
}

export const markerFrame = {
  hiddenIds: new Set<string>(),
  badges: [] as ClusterBadge[],
  fitDistance: 0,
  fitX: 0,
  fitY: 0.4,
  fitZ: 0,
  visibleIds: [] as string[],
  zoomSeq: 0,
  zoomX: 0,
  zoomY: 0,
  zoomZ: 0,
};

const listeners = new Set<() => void>();
let visibleKey = "";

export function subscribeVisiblePlaces(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishVisiblePlaces(ids: string[]) {
  const key = ids.join("|");
  if (key === visibleKey) return;
  visibleKey = key;
  markerFrame.visibleIds = ids;
  for (const listener of listeners) listener();
}

export function getVisiblePlaces(): string[] {
  return markerFrame.visibleIds;
}

export function setCityFit(distance: number, x: number, y: number, z: number) {
  markerFrame.fitDistance = distance;
  markerFrame.fitX = x;
  markerFrame.fitY = y;
  markerFrame.fitZ = z;
}

export function requestClusterZoom(x: number, y: number, z: number) {
  markerFrame.zoomSeq += 1;
  markerFrame.zoomX = x;
  markerFrame.zoomY = y;
  markerFrame.zoomZ = z;
}

const bounceAt = new Map<string, number>();

export function markMarkerBounce(id: string) {
  bounceAt.set(id, performance.now());
}

export function bounceScale(id: string, reduced: boolean): number {
  if (reduced) return 1;
  const started = bounceAt.get(id);
  if (started == null) return 1;
  const elapsed = performance.now() - started;
  if (elapsed > 380) return 1;
  return 1 + Math.sin((elapsed / 380) * Math.PI) * 0.28;
}

const clusterSeen = new Map<string, number>();

export function clusterPopScale(key: string, reduced: boolean): number {
  if (reduced) return 1;
  const now = performance.now();
  if (!clusterSeen.has(key)) clusterSeen.set(key, now);
  const elapsed = now - (clusterSeen.get(key) ?? now);
  if (elapsed > 280) return 1;
  return 0.4 + (elapsed / 280) * 0.6;
}

export function labelBudget(liveDistance: number, fitDistance: number): number {
  if (fitDistance <= 0) return 0;
  const zoom = fitDistance / Math.max(0.1, liveDistance);
  if (zoom < 1.18) return 0;
  return Math.min(8, Math.floor((zoom - 1.18) / 0.12));
}
