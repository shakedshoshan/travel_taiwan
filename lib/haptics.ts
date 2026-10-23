/**
 * Triggers a light haptic tap on supported mobile devices when selecting a 3D marker or pin.
 */
export function triggerHapticTap(durationMs = 10): void {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore vibration errors on unsupported or restricted contexts
    }
  }
}
