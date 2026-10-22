export interface LabelSlot {
  ax: number;
  ay: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
  homeOy: number;
  drop: number;
  active: boolean;
  hasSolve: boolean;
  solvedAx: number;
  solvedAy: number;
  solvedW: number;
}

export const labelSlots = new Map<string, LabelSlot>();
export const labelElements = new Map<string, HTMLDivElement>();
let solveQueued = false;

function anchorsMoved(): boolean {
  for (const slot of labelSlots.values()) {
    if (!slot.active) continue;
    if (!slot.hasSolve) return true;
    if (Math.abs(slot.ax - slot.solvedAx) > 12) return true;
    if (Math.abs(slot.ay - slot.solvedAy) > 12) return true;
    if (Math.abs(slot.w - slot.solvedW) > 10) return true;
  }
  return false;
}

function solveLabelOverlaps(viewportHeight: number) {
  const list: LabelSlot[] = [];
  for (const slot of labelSlots.values()) {
    if (!slot.active) continue;
    list.push(slot);
  }
  const minY = viewportHeight * 0.34;
  const maxY = viewportHeight * 0.72;
  const maxDriftX = 72;
  const maxDriftY = 72;
  for (const slot of list) {
    const widthChanged =
      slot.hasSolve && Math.abs(slot.w - slot.solvedW) > 10;
    const separatedY =
      slot.hasSolve && !widthChanged ? slot.oy - slot.homeOy : 0;
    const separatedX = slot.hasSolve && !widthChanged ? slot.ox : 0;
    let oy = -18;
    if (slot.ay + oy > maxY) oy = maxY - slot.ay;
    if (slot.ay + oy < minY) oy = minY - slot.ay;
    oy += slot.drop;
    if (slot.ay + oy > maxY) oy = maxY - slot.ay;
    slot.homeOy = oy;
    slot.oy = oy + separatedY;
    slot.ox = separatedX;
  }
  const withinY = (slot: LabelSlot, nextOy: number) => {
    const y = slot.ay + nextOy;
    return (
      y >= minY &&
      y <= maxY &&
      nextOy <= slot.homeOy + maxDriftY &&
      nextOy >= slot.homeOy - 6
    );
  };
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const ax = a.ax + a.ox;
        const ay = a.ay + a.oy;
        const bx = b.ax + b.ox;
        const by = b.ay + b.oy;
        const gapX = (a.w + b.w) * 0.5 + 8 - Math.abs(dx(ax, bx));
        const gapY = (a.h + b.h) * 0.5 + 6 - Math.abs(dy(ay, by));
        if (gapX <= 4 || gapY <= 4) continue;
        const xDir =
          Math.abs(bx - ax) < 4 ? (a.ax <= b.ax ? -1 : 1) : Math.sign(bx - ax);
        const aWould = a.ox - xDir * gapX * 0.5;
        const bWould = b.ox + xDir * gapX * 0.5;
        const horizontalFits =
          Math.abs(aWould) <= maxDriftX && Math.abs(bWould) <= maxDriftX;
        const preferred =
          a.drop > 0 && b.drop === 0
            ? a
            : b.drop > 0 && a.drop === 0
              ? b
              : ay >= by
                ? a
                : b;
        const other = preferred === a ? b : a;
        if (horizontalFits && gapX < gapY) {
          a.ox = aWould;
          b.ox = bWould;
        } else if (withinY(preferred, preferred.oy + gapY)) {
          preferred.oy += gapY;
        } else if (withinY(other, other.oy + gapY)) {
          other.oy += gapY;
        } else if (horizontalFits) {
          a.ox = aWould;
          b.ox = bWould;
        }
      }
    }
    for (const slot of list) {
      if (slot.ox > maxDriftX) slot.ox = maxDriftX;
      if (slot.ox < -maxDriftX) slot.ox = -maxDriftX;
      if (slot.oy > slot.homeOy + maxDriftY) slot.oy = slot.homeOy + maxDriftY;
      if (slot.oy < slot.homeOy - 6) slot.oy = slot.homeOy - 6;
      const y = slot.ay + slot.oy;
      if (y > maxY) slot.oy += maxY - y;
      if (y < minY) slot.oy += minY - y;
    }
  }
  for (const slot of list) {
    slot.solvedAx = slot.ax;
    slot.solvedAy = slot.ay;
    slot.solvedW = slot.w;
    slot.hasSolve = true;
  }
}

function dx(ax: number, bx: number) {
  return bx - ax;
}
function dy(ay: number, by: number) {
  return by - ay;
}

export function queueLabelSolve(viewportHeight: number) {
  if (solveQueued) return;
  solveQueued = true;
  queueMicrotask(() => {
    solveQueued = false;
    if (anchorsMoved()) solveLabelOverlaps(viewportHeight);
    for (const [id, slot] of labelSlots) {
      const el = labelElements.get(id);
      if (!el || !slot.active) continue;
      const x = slot.ax + slot.ox;
      const y = slot.ay + slot.oy;
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  });
}
