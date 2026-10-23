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
  /** City labels stay on their pins. Island labels move around them. */
  locked: boolean;
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

function solveLabelOverlaps() {
  const list: LabelSlot[] = [];
  for (const slot of labelSlots.values()) {
    if (!slot.active) continue;
    list.push(slot);
  }
  const maxDrift = 96;
  for (const slot of list) {
    if (slot.locked) {
      slot.ox = 0;
      slot.oy = 0;
      slot.homeOy = 0;
      continue;
    }
    const widthChanged = slot.hasSolve && Math.abs(slot.w - slot.solvedW) > 10;
    if (!slot.hasSolve || widthChanged) {
      slot.ox = 0;
      slot.oy = slot.drop;
    }
    slot.homeOy = 0;
  }
  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.locked && b.locked) continue;
        const ax = a.ax + a.ox;
        const ay = a.ay + a.oy;
        const bx = b.ax + b.ox;
        const by = b.ay + b.oy;
        const gapX = (a.w + b.w) * 0.5 + 8 - Math.abs(dx(ax, bx));
        const gapY = (a.h + b.h) * 0.5 + 8 - Math.abs(dy(ay, by));
        if (gapX <= 1 || gapY <= 1) continue;
        if (a.locked || b.locked) {
          const free = a.locked ? b : a;
          const fixed = free === a ? b : a;
          const fx = fixed.ax + fixed.ox;
          const fy = fixed.ay + fixed.oy;
          const px = free.ax + free.ox;
          const py = free.ay + free.oy;
          if (gapX < gapY) {
            free.ox += (px >= fx ? 1 : -1) * gapX;
          } else {
            free.oy += (py >= fy ? 1 : -1) * gapY;
          }
          continue;
        }
        const xDir =
          Math.abs(bx - ax) < 4 ? (a.ax <= b.ax ? -1 : 1) : Math.sign(bx - ax);
        const aWould = a.ox - xDir * gapX * 0.5;
        const bWould = b.ox + xDir * gapX * 0.5;
        if (Math.abs(aWould) <= maxDrift && Math.abs(bWould) <= maxDrift && gapX <= gapY) {
          a.ox = aWould;
          b.ox = bWould;
        } else if (ay >= by) {
          a.oy += gapY;
        } else {
          b.oy += gapY;
        }
      }
    }
    for (const slot of list) {
      if (slot.locked) {
        slot.ox = 0;
        slot.oy = 0;
        continue;
      }
      if (slot.ox > maxDrift) slot.ox = maxDrift;
      if (slot.ox < -maxDrift) slot.ox = -maxDrift;
      if (slot.oy > maxDrift) slot.oy = maxDrift;
      if (slot.oy < -maxDrift) slot.oy = -maxDrift;
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

export function queueLabelSolve() {
  if (solveQueued) return;
  solveQueued = true;
  queueMicrotask(() => {
    solveQueued = false;
    if (anchorsMoved()) solveLabelOverlaps();
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
