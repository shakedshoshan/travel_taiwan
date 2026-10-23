let lastActivity = 0;
const listeners = new Set<() => void>();

export function markMapActivity() {
  lastActivity = typeof performance !== "undefined" ? performance.now() : Date.now();
  for (const listener of listeners) listener();
}

export function mapNeedsFrames(idleMs = 700): boolean {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  return now - lastActivity < idleMs;
}

export function subscribeMapActivity(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
