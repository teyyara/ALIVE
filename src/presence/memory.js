const STORAGE_KEY = 'alive-presence';

function readMemory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function createPresenceMemory() {
  const previous = readMemory();
  const visitCount = Number.isFinite(previous.visitCount) ? previous.visitCount + 1 : 1;
  const previousLastSeen = Date.parse(previous.lastSeen || '');
  const awayForMs = Number.isFinite(previousLastSeen) ? Math.max(0, Date.now() - previousLastSeen) : Infinity;
  const returning = visitCount > 1 && awayForMs >= 5 * 60 * 1000;

  const memory = {
    visitCount,
    firstSeen: previous.firstSeen || new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Memory remains session-only when localStorage is unavailable.
  }

  return Object.freeze({
    visitCount,
    returning,
    firstVisit: visitCount === 1,
    awayForMs
  });
}
