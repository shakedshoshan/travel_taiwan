export interface ScreenPoint {
  id: string;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  importance: number;
  onScreen: boolean;
}

export interface ClusterBadge {
  key: string;
  count: number;
  x: number;
  y: number;
  z: number;
}

export function clusterScreenPoints(
  points: ScreenPoint[],
  threshold = 48
): { hiddenIds: Set<string>; badges: ClusterBadge[] } {
  const active = points.filter((point) => point.onScreen);
  const parent = active.map((_, index) => index);
  const find = (index: number): number => {
    let cursor = index;
    while (parent[cursor] !== cursor) {
      parent[cursor] = parent[parent[cursor]];
      cursor = parent[cursor];
    }
    return cursor;
  };
  const unite = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootA] = rootB;
  };
  const limit = threshold * threshold;
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const dx = active[i].x - active[j].x;
      const dy = active[i].y - active[j].y;
      if (dx * dx + dy * dy < limit) unite(i, j);
    }
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < active.length; i++) {
    const root = find(i);
    const list = groups.get(root);
    if (list) list.push(i);
    else groups.set(root, [i]);
  }
  const hiddenIds = new Set<string>();
  const badges: ClusterBadge[] = [];
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    let best = members[0];
    for (const member of members) {
      if (active[member].importance > active[best].importance) best = member;
    }
    for (const member of members) {
      if (member !== best) hiddenIds.add(active[member].id);
    }
    const rep = active[best];
    badges.push({
      key: rep.id,
      count: members.length,
      x: rep.worldX,
      y: rep.worldY,
      z: rep.worldZ,
    });
  }
  badges.sort((a, b) => b.count - a.count);
  return { hiddenIds, badges };
}
