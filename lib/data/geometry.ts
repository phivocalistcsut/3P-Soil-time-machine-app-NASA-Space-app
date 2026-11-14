import { validCoordinates } from "./evidence";

type Vertex = [number, number];

/** Validate small field rings and return an approximate area in hectares. */
export function fieldBoundary(ring: Vertex[]) {
  if (ring.length < 3 || ring.length > 100 || ring.some(([lon, lat]) => !validCoordinates(lat, lon))) return null;
  if (new Set(ring.map((p) => p.join(","))).size !== ring.length) return null;
  const origin = ring[0];
  const mx = 111320 * Math.cos(origin[1] * Math.PI / 180);
  const points: Vertex[] = ring.map(([x, y]) => [((x - origin[0] + 540) % 360 - 180) * mx, (y - origin[1]) * 110540]);
  if (points.some(([x, y]) => Math.hypot(x, y) > 25000)) return null;
  const cross = (a: Vertex, b: Vertex, c: Vertex) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const intersects = (a: Vertex, b: Vertex, c: Vertex, d: Vertex) => {
    const separated = (axis: 0 | 1) => Math.max(a[axis], b[axis]) < Math.min(c[axis], d[axis]) ||
      Math.max(c[axis], d[axis]) < Math.min(a[axis], b[axis]);
    return !separated(0) && !separated(1) &&
      cross(a, b, c) * cross(a, b, d) <= 0 && cross(c, d, a) * cross(c, d, b) <= 0;
  };
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    twiceArea += points[i][0] * points[next][1] - points[next][0] * points[i][1];
    for (let j = i + 2; j < points.length; j++) {
      const after = (j + 1) % points.length;
      if (after !== i && intersects(points[i], points[next], points[j], points[after])) return null;
    }
  }
  const areaHa = Math.abs(twiceArea) / 20000;
  if (areaHa < 0.0001 || areaHa >= 10000) return null;
  // A midpoint of an interior horizontal span remains inside a concave ring.
  const ys = [...new Set(points.map((p) => p[1]))].sort((a, b) => a - b);
  let bestSpan = 0;
  let center: Vertex = [0, 0];
  for (let j = 1; j < ys.length; j++) {
    const y = (ys[j - 1] + ys[j]) / 2;
    const cuts = points.flatMap(([ax, ay], i) => {
      const [bx, by] = points[(i + 1) % points.length];
      return (ay > y) !== (by > y) ? [ax + (y - ay) * (bx - ax) / (by - ay)] : [];
    }).sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i += 2) {
      const span = cuts[i + 1] - cuts[i];
      if (span > bestSpan) {
        bestSpan = span;
        center = [(cuts[i + 1] + cuts[i]) / 2, y];
      }
    }
  }
  const lon = (origin[0] + center[0] / mx + 540) % 360 - 180;
  const lat = origin[1] + center[1] / 110540;
  return { areaHa, lon, lat };
}
