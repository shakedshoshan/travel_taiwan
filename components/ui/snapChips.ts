const EDGE = 1;

function chipsOf(scroller: HTMLElement) {
  return [...scroller.querySelectorAll<HTMLElement>("[data-chip-id]")];
}

/** Moves a chip by `dx` screen pixels. Positive moves it to the right. */
function nudge(scroller: HTMLElement, chip: HTMLElement, dx: number): number {
  if (Math.abs(dx) < 1) return 0;
  const startScroll = scroller.scrollLeft;
  const before = chip.getBoundingClientRect().left;
  scroller.scrollBy({ left: -dx });
  if (Math.abs(chip.getBoundingClientRect().left - before) < 0.5) {
    scroller.scrollBy({ left: dx });
  }
  const moved = chip.getBoundingClientRect().left - before;
  if (Math.abs(moved) < 0.5 || Math.sign(moved) !== Math.sign(dx)) {
    scroller.scrollLeft = startScroll;
    return 0;
  }
  return moved;
}

function isFull(rect: DOMRect, box: DOMRect) {
  return rect.width > EDGE && rect.left >= box.left - EDGE && rect.right <= box.right + EDGE;
}

function countFull(scroller: HTMLElement) {
  const box = scroller.getBoundingClientRect();
  return chipsOf(scroller).filter((chip) => isFull(chip.getBoundingClientRect(), box)).length;
}

/** Hides a chip that crosses the clip so its label is never sliced mid-word. */
export function syncChipClip(scroller: HTMLElement | null) {
  if (!scroller) return;
  const box = scroller.getBoundingClientRect();
  for (const chip of chipsOf(scroller)) {
    const full = isFull(chip.getBoundingClientRect(), box);
    chip.style.visibility = full ? "" : "hidden";
  }
}

/**
 * At rest, pull a mostly-visible chip fully in when that shows more whole chips.
 * Anything still crossing the clip stays hidden.
 */
export function snapChipRow(scroller: HTMLElement | null) {
  if (!scroller) return;
  const box = scroller.getBoundingClientRect();
  if (box.width < 8) {
    syncChipClip(scroller);
    return;
  }

  const partial = chipsOf(scroller)
    .map((chip) => {
      const rect = chip.getBoundingClientRect();
      const overlaps = rect.right > box.left + EDGE && rect.left < box.right - EDGE;
      const visible = Math.min(rect.right, box.right) - Math.max(rect.left, box.left);
      return { chip, rect, overlaps, visible, full: isFull(rect, box) };
    })
    .filter((item) => item.overlaps && !item.full)
    .sort((a, b) => b.visible - a.visible)[0];

  if (partial && partial.visible >= partial.rect.width * 0.5) {
    const crossesLeft = partial.rect.left < box.left;
    const pullIn = crossesLeft ? box.left - partial.rect.left : box.right - partial.rect.right;
    const before = countFull(scroller);
    const start = scroller.scrollLeft;
    const moved = nudge(scroller, partial.chip, pullIn);
    const improved = Math.abs(moved) > 1 && countFull(scroller) > before;
    if (!improved && Math.abs(scroller.scrollLeft - start) > 0.5) {
      scroller.scrollLeft = start;
    }
  }

  syncChipClip(scroller);
}

/** Aligns the first chip with the inline start (the right edge in RTL). */
export function revealChipStart(scroller: HTMLElement | null) {
  if (!scroller) return;
  const first = scroller.querySelector<HTMLElement>("[data-chip-id]");
  if (!first) return;
  const box = scroller.getBoundingClientRect();
  const rect = first.getBoundingClientRect();
  const rtl = getComputedStyle(scroller).direction === "rtl";
  const dx = rtl ? box.right - rect.right : box.left - rect.left;
  nudge(scroller, first, dx);
  snapChipRow(scroller);
}

/** Scrolls one chip fully into the clip, used when the user toggles it. */
export function revealChipById(scroller: HTMLElement | null, chipId: string) {
  if (!scroller || !chipId) return;
  const chip = scroller.querySelector<HTMLElement>(`[data-chip-id="${CSS.escape(chipId)}"]`);
  if (!chip) return;
  const box = scroller.getBoundingClientRect();
  const rect = chip.getBoundingClientRect();
  if (rect.left < box.left - EDGE) nudge(scroller, chip, box.left - rect.left);
  else if (rect.right > box.right + EDGE) nudge(scroller, chip, box.right - rect.right);
  chip.style.visibility = "";
  snapChipRow(scroller);
}
