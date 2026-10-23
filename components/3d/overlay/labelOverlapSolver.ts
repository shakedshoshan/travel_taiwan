export interface LabelSlot {
  ax: number;
  ay: number;
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

export function setFarZoom(next: boolean) {
  farZoom = next;
}

function overlaps(a: LabelSlot, b: LabelSlot): boolean {
  const scale = Math.min(a.scale, b.scale);
  const gapX = (a.w + b.w) * 0.5 * scale + 6 - Math.abs(b.ax - a.ax);
  const gapY = (a.h + b.h) * 0.5 * scale + 4 - Math.abs(b.ay - a.ay);
  return gapX > 1 && gapY > 1;
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
  if (solveQueued) return;
  solveQueued = true;
  queueMicrotask(() => {
    solveQueued = false;
    solveLabelVisibility();
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
      el.style.pointerEvents = "auto";
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
