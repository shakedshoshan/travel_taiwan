export interface SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
  /** Stop when |position - target| and |velocity| are below this (px, px/ms). */
  restDelta?: number;
  restSpeed?: number;
}

const DEFAULTS: Required<SpringOptions> = {
  stiffness: 380,
  damping: 36,
  mass: 1,
  restDelta: 0.45,
  restSpeed: 0.015,
};

/**
 * Critically-damped-ish spring on `requestAnimationFrame` — updates via callback only (no React).
 */
export function runSpring(
  from: number,
  to: number,
  onFrame: (value: number) => void,
  onComplete?: () => void,
  options?: SpringOptions
): () => void {
  const cfg = { ...DEFAULTS, ...options };
  let value = from;
  let velocity = 0;
  let raf = 0;
  let last = performance.now();
  let cancelled = false;

  const tick = (now: number) => {
    if (cancelled) return;
    const dt = Math.min(0.032, Math.max(0.001, (now - last) / 1000));
    last = now;

    const displacement = value - to;
    const springForce = -cfg.stiffness * displacement;
    const dampingForce = -cfg.damping * velocity;
    const acceleration = (springForce + dampingForce) / cfg.mass;
    velocity += acceleration * dt;
    value += velocity * dt;

    onFrame(value);

    if (
      Math.abs(value - to) < cfg.restDelta &&
      Math.abs(velocity) < cfg.restSpeed
    ) {
      onFrame(to);
      onComplete?.();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}
