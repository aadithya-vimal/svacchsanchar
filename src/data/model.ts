export const CITY = {
  name: 'Bengaluru',
  center: { lat: 12.9716, lon: 77.5946 },
  bounds: { minLat: 12.87, maxLat: 13.12, minLon: 77.45, maxLon: 77.78 }
}

export const BIN_COUNT = 120000
export const TRUCK_COUNT = 512
export const ZONE_COUNT = 24

export const zoneNames = [
  'Central', 'Indiranagar', 'Domlur', 'Koramangala', 'Whitefield', 'Electronic City',
  'Jayanagar', 'JP Nagar', 'HSR Layout', 'BTM', 'Malleshwaram', 'Rajajinagar',
  'Yeshwanthpur', 'Hebbal', 'Marathahalli', 'Bellandur', 'Banashankari', 'Basavanagudi',
  'Ulsoor', 'Sadashivanagar', 'RT Nagar', 'Vijayanagar', 'Mahadevapura', 'Peenya'
]

export const zoneCenters: Array<{ lat: number; lon: number }> = [
  { lat: 12.9716, lon: 77.5946 }, // Central
  { lat: 12.9784, lon: 77.6408 }, // Indiranagar
  { lat: 12.9609, lon: 77.6387 }, // Domlur
  { lat: 12.9352, lon: 77.6245 }, // Koramangala
  { lat: 12.9698, lon: 77.7499 }, // Whitefield
  { lat: 12.8452, lon: 77.6602 }, // Electronic City
  { lat: 12.9308, lon: 77.5838 }, // Jayanagar
  { lat: 12.9063, lon: 77.5857 }, // JP Nagar
  { lat: 12.9121, lon: 77.6446 }, // HSR Layout
  { lat: 12.9166, lon: 77.6101 }, // BTM
  { lat: 12.9982, lon: 77.5704 }, // Malleshwaram
  { lat: 12.9915, lon: 77.5524 }, // Rajajinagar
  { lat: 13.0284, lon: 77.5409 }, // Yeshwanthpur
  { lat: 13.0358, lon: 77.5970 }, // Hebbal
  { lat: 12.9569, lon: 77.7011 }, // Marathahalli
  { lat: 12.9304, lon: 77.6784 }, // Bellandur
  { lat: 12.9255, lon: 77.5468 }, // Banashankari
  { lat: 12.9421, lon: 77.5753 }, // Basavanagudi
  { lat: 12.9817, lon: 77.6200 }, // Ulsoor
  { lat: 13.0068, lon: 77.5813 }, // Sadashivanagar
  { lat: 13.0184, lon: 77.5946 }, // RT Nagar
  { lat: 12.9719, lon: 77.5303 }, // Vijayanagar
  { lat: 12.9912, lon: 77.6974 }, // Mahadevapura
  { lat: 13.0329, lon: 77.5140 }, // Peenya
]

export function fract(n: number) { return n - Math.floor(n) }
export function hash(n: number) { return fract(Math.sin(n * 12.9898 + 78.233) * 43758.5453123) }

export function zoneForLatLon(lat: number, lon: number): number {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 0
  const gx = Math.min(5, Math.max(0, Math.floor((lon - CITY.bounds.minLon) / (CITY.bounds.maxLon - CITY.bounds.minLon) * 6)))
  const gy = Math.min(3, Math.max(0, Math.floor((lat - CITY.bounds.minLat) / (CITY.bounds.maxLat - CITY.bounds.minLat) * 4)))
  return Math.min(ZONE_COUNT - 1, gy * 6 + gx)
}

// Precomputed flat arrays for ultra-fast simulation ticks (avoiding 360k trigonometric operations/sec)
export const binLats = new Float32Array(BIN_COUNT)
export const binLons = new Float32Array(BIN_COUNT)
export const binZones = new Uint8Array(BIN_COUNT)

for (let i = 0; i < BIN_COUNT; i++) {
  const a = hash(i + 17), b = hash(i * 7.31 + 31), c = hash(i * 17.41 + 9)
  const lat = CITY.bounds.minLat + (a * 0.82 + b * 0.18) * (CITY.bounds.maxLat - CITY.bounds.minLat)
  const lon = CITY.bounds.minLon + (b * 0.88 + c * 0.12) * (CITY.bounds.maxLon - CITY.bounds.minLon)
  binLats[i] = lat
  binLons[i] = lon
  binZones[i] = zoneForLatLon(lat, lon)
}

export function binPosition(i: number): { lat: number; lon: number } {
  if (!Number.isFinite(i) || i < 0 || i >= BIN_COUNT) {
    return { lat: CITY.center.lat, lon: CITY.center.lon }
  }
  const lat = binLats[i]
  const lon = binLons[i]
  return {
    lat: Number.isFinite(lat) ? lat : CITY.center.lat,
    lon: Number.isFinite(lon) ? lon : CITY.center.lon
  }
}

export function createFillArray(): Float32Array {
  const out = new Float32Array(BIN_COUNT)
  for (let i = 0; i < BIN_COUNT; i++) {
    out[i] = 18 + hash(i * 19.17) * 73
  }
  return out
}

export function makeTrucks() {
  return Array.from({ length: TRUCK_COUNT }, (_, i) => ({
    id: i,
    name: `SWC-${String(i + 1).padStart(3, '0')}`,
    capacityKg: 900 + (i % 4) * 300,
    loadKg: Math.round((0.15 + hash(i * 2.17) * 0.45) * (900 + (i % 4) * 300)),
    status: (i % 13 === 0 ? 'active' : 'idle') as 'idle' | 'active' | 'returning' | 'breakdown',
    lat: 12.89 + hash(i * 1.7) * 0.18,
    lon: 77.48 + hash(i * 3.1) * 0.29,
    speedKph: 22 + hash(i * 2.9) * 18,
    route: [] as number[],
    routeIndex: 0,
    segmentProgress: 0
  }))
}
