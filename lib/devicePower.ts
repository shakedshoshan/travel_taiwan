type NetworkInfo = { saveData?: boolean };

type NavigatorPower = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInfo;
};

/** Skip decorative 3D landmarks on low-power or reduced-motion devices. */
export function shouldSkipLandmarks(prefersReducedMotion: boolean): boolean {
  if (prefersReducedMotion) return true;
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorPower;
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4) return true;
  return false;
}
