import { BENGALURU_WARDS, ALL_ROAD_BINS, BBMP_DEPOTS } from './bengaluruRoads'

export const CITY = {
  name: 'Bengaluru',
  center: { lat: 12.9716, lon: 77.5946 },
  bounds: { minLat: 12.83, maxLat: 13.12, minLon: 77.48, maxLon: 77.78 }
}

export const BIN_COUNT = ALL_ROAD_BINS.length // 288 road-snapped smart bins
export const TRUCK_COUNT = 32 // 32 high-visibility compactor trucks
export const ZONE_COUNT = BENGALURU_WARDS.length // 24 wards

export const zoneNames = BENGALURU_WARDS.map(w => w.name)
export const zoneCenters = BENGALURU_WARDS.map(w => w.center)
export { ALL_ROAD_BINS, BENGALURU_WARDS, BBMP_DEPOTS }

export function fract(n: number) { return n - Math.floor(n) }
export function hash(n: number) { return fract(Math.sin(n * 12.9898 + 78.233) * 43758.5453123) }

export function zoneForLatLon(lat: number, lon: number): number {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 0
  let bestDist = 1e9
  let bestZone = 0
  for (let i = 0; i < BENGALURU_WARDS.length; i++) {
    const c = BENGALURU_WARDS[i].center
    const d = (lat - c.lat) ** 2 + (lon - c.lon) ** 2
    if (d < bestDist) {
      bestDist = d
      bestZone = i
    }
  }
  return bestZone
}

// Precomputed flat arrays for ultra-fast simulation ticks
export const binLats = new Float32Array(BIN_COUNT)
export const binLons = new Float32Array(BIN_COUNT)
export const binZones = new Uint8Array(BIN_COUNT)

for (let i = 0; i < BIN_COUNT; i++) {
  const b = ALL_ROAD_BINS[i]
  binLats[i] = b.lat
  binLons[i] = b.lon
  binZones[i] = b.wardId
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
    // Initial fill variance between 20% and 88%
    out[i] = Math.round(22 + hash(i * 19.17) * 62)
  }
  return out
}

export function makeTrucks() {
  return Array.from({ length: TRUCK_COUNT }, (_, i) => {
    // Start trucks at assigned municipal depots or ward transfer stations
    const depot = BBMP_DEPOTS[i % BBMP_DEPOTS.length]
    const assignedWard = BENGALURU_WARDS[i % BENGALURU_WARDS.length]
    const startLoc = i < 16 ? depot : assignedWard.center

    return {
      id: i,
      name: `SWC-${String(i + 1).padStart(3, '0')}`,
      capacityKg: 1200 + (i % 3) * 400,
      loadKg: Math.round((0.18 + hash(i * 2.17) * 0.35) * (1200 + (i % 3) * 400)),
      status: (i % 8 === 0 ? 'idle' : 'active') as 'idle' | 'active' | 'returning' | 'breakdown',
      lat: startLoc.lat + (hash(i * 3.7) - 0.5) * 0.003,
      lon: startLoc.lon + (hash(i * 5.1) - 0.5) * 0.003,
      speedKph: 26 + hash(i * 2.9) * 12,
      route: [] as number[],
      routeIndex: 0,
      segmentProgress: 0,
      roadPath: [] as Array<[number, number]>,
      pathIndex: 0,
      currentStreet: assignedWard.name
    }
  })
}
