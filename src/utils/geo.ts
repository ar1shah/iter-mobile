// Small helpers for turning raw GPS points into the numbers we show on screen.
// Nothing fancy - just the standard haversine formula plus some formatting.

export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_MI = 3958.8;

// Distance between two points on the globe, in miles.
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Adds up the distance across a whole route (a list of points in order).
export function totalDistanceMiles(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMiles(points[i - 1], points[i]);
  }
  return total;
}

// "1234" -> "20:34". Used for run timers.
export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Given elapsed seconds and distance in miles, return a "M:SS" pace string.
// Bails out to "--:--" if we don't have enough data yet to make this meaningful.
export function formatPace(
  elapsedSeconds: number,
  distanceMiles: number,
): string {
  // Wait until the runner has traveled about 0.05 miles.
  if (elapsedSeconds <= 0 || distanceMiles < 0.05) {
    return '--:--';
  }

  const totalPaceSeconds = Math.round(elapsedSeconds / distanceMiles);

  // Hide invalid or unrealistic paces above 99:59 per mile.
  if (!Number.isFinite(totalPaceSeconds) || totalPaceSeconds >= 6000) {
    return '--:--';
  }

  const minutes = Math.floor(totalPaceSeconds / 60);
  const seconds = totalPaceSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
