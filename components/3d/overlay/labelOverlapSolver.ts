export interface LabelSlot {
  ax: number;
  ay: number;
  baseAx: number;
  baseAy: number;
  w: number;
  h: number;
  priority: number;
  showWhenFar: boolean;
  active: boolean;
  hidden: boolean;
  scale: number;
}

export const labelSlots = new Map<string, LabelSlot>();
export const labelElements = new Map<string, HTMLDivElement>();

let farZoom = false;
let solveQueued = false;
let resizeBound = false;

function bindLabelResize() {
  if (resizeBound || typeof window === "undefined") return;
  resizeBound = true;
  window.addEventListener("resize", () => {
    queueLabelSolve();
    window.setTimeout(queueLabelSolve, 450);
  });
}

export function setFarZoom(next: boolean) {
  farZoom = next;
}

function overlaps(a: LabelSlot, b: LabelSlot): boolean {
  const scale = Math.min(a.scale, b.scale);
  const gapX = (a.w + b.w) * 0.5 * scale + 10 - Math.abs(b.ax - a.ax);
  const gapY = (a.h + b.h) * 0.5 * scale + 12 - Math.abs(b.ay - a.ay);
  return gapX > 1 && gapY > 1;
}

function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return x > 2 && y > 2;
}

function chromeRects(): DOMRect[] {
  const rects: DOMRect[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("[data-map-chrome], header, nav")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 2 && rect.height > 2) rects.push(rect);
  }
  return rects;
}

function applySlotTransform(el: HTMLDivElement, slot: LabelSlot) {
  el.style.transform = `translate3d(${slot.ax.toFixed(1)}px, ${slot.ay.toFixed(1)}px, 0)`;
}

function shortestEscape(rect: DOMRect, block: DOMRect) {
  const options = [
    { dx: 0, dy: block.top - rect.bottom - 6 },
    { dx: 0, dy: block.bottom - rect.top + 6 },
    { dx: block.left - rect.right - 6, dy: 0 },
    { dx: block.right - rect.left + 6, dy: 0 },
  ];
  options.sort((a, b) => Math.abs(a.dx) + Math.abs(a.dy) - (Math.abs(b.dx) + Math.abs(b.dy)));
  return options[0];
}

function hideSlot(item: { slot: LabelSlot; el: HTMLDivElement }) {
  item.slot.hidden = true;
  item.el.hidden = true;
  item.el.style.opacity = "0";
  item.el.style.pointerEvents = "none";
}

/** Nudge a label off chrome along the shortest axis. A long jump is hidden. */
function dodgeChrome(items: Array<{ slot: LabelSlot; el: HTMLDivElement; rect: DOMRect }>) {
  const blockers = chromeRects();
  if (!blockers.length) return;
  for (const item of items) {
    if (item.slot.hidden || item.el.hidden) continue;
    let dx = 0;
    let dy = 0;
    let guard = 0;
    while (guard < 4) {
      guard += 1;
      const block = blockers.find((candidate) => rectsOverlap(item.rect, candidate));
      if (!block) break;
      const step = shortestEscape(item.rect, block);
      if (Math.abs(dx + step.dx) + Math.abs(dy + step.dy) > 64) {
        hideSlot(item);
        break;
      }
      dx += step.dx;
      dy += step.dy;
      item.slot.ax = item.slot.baseAx + dx;
      item.slot.ay = item.slot.baseAy + dy;
      item.rect = new DOMRect(item.rect.x + step.dx, item.rect.y + step.dy, item.rect.width, item.rect.height);
      applySlotTransform(item.el, item.slot);
    }
  }
}

/** Ground-truth pass: hide the lower-priority label when the painted boxes touch. */
function hideDomOverlaps() {
  const items: Array<{ slot: LabelSlot; el: HTMLDivElement; rect: DOMRect }> = [];
  for (const [id, slot] of labelSlots) {
    const el = labelElements.get(id);
    if (!el || !slot.active || slot.hidden || el.hidden) continue;
    const target = el.querySelector("[data-map-label]") ?? el;
    const rect = target.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    items.push({ slot, el, rect });
  }
  dodgeChrome(items);
  items.sort((a, b) => b.slot.priority - a.slot.priority || a.rect.top - b.rect.top);
  const kept: typeof items = [];
  for (const item of items) {
    if (kept.some((other) => rectsOverlap(other.rect, item.rect))) {
      item.slot.hidden = true;
      item.el.hidden = true;
      item.el.style.opacity = "0";
      item.el.style.pointerEvents = "none";
      continue;
    }
    kept.push(item);
  }
}

function solveLabelVisibility() {
  const list: LabelSlot[] = [];
  for (const slot of labelSlots.values()) {
    if (!slot.active) continue;
    slot.hidden = farZoom && !slot.showWhenFar;
    slot.scale = 1;
    list.push(slot);
  }

  const visible = list
    .filter((slot) => !slot.hidden)
    .sort((a, b) => b.priority - a.priority || a.ay - b.ay);
  const kept: LabelSlot[] = [];

  for (const slot of visible) {
    const hit = kept.find((other) => overlaps(other, slot));
    if (!hit) {
      kept.push(slot);
      continue;
    }
    if (slot.priority <= hit.priority) {
      slot.hidden = true;
      continue;
    }
    hit.hidden = true;
    kept.push(slot);
  }
}

export function queueLabelSolve() {
  bindLabelResize();
  if (solveQueued) return;
  solveQueued = true;
  queueMicrotask(() => {
    solveQueued = false;
    for (const slot of labelSlots.values()) {
      slot.ax = slot.baseAx;
      slot.ay = slot.baseAy;
    }
    solveLabelVisibility();
    requestAnimationFrame(hideDomOverlaps);
    for (const [id, slot] of labelSlots) {
      const el = labelElements.get(id);
      if (!el || !slot.active) continue;
      el.dataset.slot = `${slot.ax.toFixed(0)},${slot.ay.toFixed(0)},p${slot.priority},${slot.hidden ? "h" : "v"}`;
      const decorative = el.dataset.decorative === "1";
      if (slot.hidden) {
        el.hidden = true;
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.setAttribute("aria-hidden", "true");
        continue;
      }
      el.hidden = false;
      el.style.opacity = "1";
      el.style.pointerEvents = el.dataset.passive === "1" ? "none" : "auto";
      if (decorative) el.setAttribute("aria-hidden", "true");
      else el.removeAttribute("aria-hidden");
      el.style.transform = `translate3d(${slot.ax.toFixed(1)}px, ${slot.ay.toFixed(1)}px, 0)`;
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) {
        const anchor = inner.dataset.anchor;
        const base =
          anchor === "bottom"
            ? "translate3d(-50%, -100%, 0)"
            : anchor === "center"
              ? "translate3d(-50%, -50%, 0)"
              : "";
        inner.style.transformOrigin = anchor === "bottom" ? "50% 100%" : "50% 50%";
        inner.style.transform =
          slot.scale === 1 ? base : `${base} scale(${slot.scale})`.trim();
      }
    }
  });
}
