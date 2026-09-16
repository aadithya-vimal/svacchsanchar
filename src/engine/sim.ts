import type { ScenarioEvent, Truck, AuditLogItem } from '../data/types'
import { BIN_COUNT, ZONE_COUNT, binPosition, binZones, zoneForLatLon, ALL_ROAD_BINS, BBMP_DEPOTS, hash } from '../data/model'
import { getRoadRouteSync, fetchRoadRoute } from './osrm'

// Weight of waste in a fully-filled bin (100% = 500 kg)
const BIN_FULL_KG = 500

export function season(month: number) {
  if ([6, 7, 8, 9].includes(month)) return 'monsoon'
  if ([11, 12, 1, 2].includes(month)) return 'winter'
  return 'summer'
}

export function seasonMultiplier(month: number) {
  return { monsoon: 1.16, winter: 0.94, summer: 1.04 }[season(month)]
}

export function timeMultiplier(hour: number) {
  if (hour >= 6 && hour < 10) return 1.20
  if (hour >= 10 && hour < 16) return 1.04
  if (hour >= 16 && hour < 21) return 1.28
  return 0.70
}

export function humidityMultiplier(month: number) {
  return season(month) === 'monsoon' ? 1.08 : 1
}

export function eventFactor(i: number, events: ScenarioEvent[], simTime: number): number {
  if (!events || events.length === 0) return 1
  let f = 1
  const hour = simTime / 3600000
  const zone = binZones[i]

  for (const e of events) {
    const sh = e.startAt / 3600000, eh = sh + e.durationHours
    if (hour < sh || hour > eh) continue
    if (e.targetZone != null && zone !== e.targetZone) continue

    if (e.type === 'waste-surge' || e.type === 'demand-shift') f *= 1 + e.intensity * 1.5
    else if (e.type === 'overflow-risk') f *= 1 + e.intensity * 1.2
    else if (e.type === 'heavy-rain') f *= 1 + 0.5 * e.intensity
    else if (e.type === 'sensor-failure') f *= 0.8
    else if (e.type === 'combined') f *= 1 + e.intensity * 1.3
  }
  return f
}

export function tickFill(fill: Float32Array, events: ScenarioEvent[], simTime: number, deltaHours: number) {
  const date = new Date(simTime)
  const month = date.getMonth() + 1
  const hour = date.getHours() + date.getMinutes() / 60
  const sf = seasonMultiplier(month), tf = timeMultiplier(hour), hf = humidityMultiplier(month)
  const step = Math.max(0.01, Math.min(1.0, deltaHours))

  for (let i = 0; i < BIN_COUNT; i++) {
    const base = 2.4 + hash(i * 5.13) * 5.5
    const zoneFactor = 1 + ((binZones[i] % ZONE_COUNT) / ZONE_COUNT) * 0.15
    const variance = 0.85 + hash(i * 1.917) * 0.30
    const ef = events.length > 0 ? eventFactor(i, events, simTime) : 1
    const nextVal = fill[i] + base * zoneFactor * variance * sf * tf * hf * ef * step
    fill[i] = nextVal > 100 ? 100 : nextVal < 0 ? 0 : nextVal
  }
}

export function visibleCriticalBins(fill: Float32Array, limit = 288): number[] {
  const ids: number[] = []
  for (let i = 0; i < fill.length; i++) {
    if (fill[i] >= 65) ids.push(i)
  }
  ids.sort((a, b) => fill[b] - fill[a])
  return ids.slice(0, limit)
}

export interface AdvanceResult {
  trucks: Truck[]
  newLogs: AuditLogItem[]
}

/**
 * Pre-fetch OSRM routes async for trucks that need a new road path.
 * Stores decoded polyline in truck.roadPath so advanceTrucks() can follow it.
 */
export async function prefetchTruckRoutes(trucks: Truck[]): Promise<Truck[]> {
  const updated = trucks.map(t => ({ ...t, roadPath: t.roadPath ? [...t.roadPath] : [], route: [...t.route] }))
  const promises: Promise<void>[] = []

  for (const t of updated) {
    if (t.status === 'breakdown') continue
    // Need to fetch route for current target bin
    if (t.route.length > 0 && t.routeIndex < t.route.length && (!t.roadPath || t.roadPath.length === 0)) {
      const targetIndex = t.route[t.routeIndex]
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= BIN_COUNT) continue
      const targetBin = ALL_ROAD_BINS[targetIndex] || binPosition(targetIndex)
      const p = fetchRoadRoute(
        { lat: t.lat, lon: t.lon },
        { lat: targetBin.lat, lon: targetBin.lon }
      ).then(route => {
        t.roadPath = route.coordinates
        t.pathIndex = 0
        t.currentStreet = (targetBin as any).street || 'Municipal Road'
      }).catch(() => {})
      promises.push(p)
    }
    // Also pre-fetch depot route when returning
    if (t.status === 'returning' && (!t.roadPath || t.roadPath.length === 0)) {
      const nearest = nearestDepot(t.lat, t.lon)
      const p = fetchRoadRoute(
        { lat: t.lat, lon: t.lon },
        { lat: nearest.lat, lon: nearest.lon }
      ).then(route => {
        t.roadPath = route.coordinates
        t.pathIndex = 0
        t.currentStreet = nearest.name
      }).catch(() => {})
      promises.push(p)
    }
  }

  // Wait up to 2.5 seconds for routes to come back; continue with cached/fallback otherwise
  await Promise.race([
    Promise.all(promises),
    new Promise(res => setTimeout(res, 2500))
  ])

  return updated
}

/**
 * Finds the nearest BBMP depot to a truck's current position.
 */
function nearestDepot(lat: number, lon: number): { lat: number; lon: number; name: string } {
  let bestDist = 1e9
  let best = BBMP_DEPOTS[0]
  for (const d of BBMP_DEPOTS) {
    const dLat = d.lat - lat
    const dLon = d.lon - lon
    const dist = dLat * dLat + dLon * dLon
    if (dist < bestDist) {
      bestDist = dist
      best = d
    }
  }
  return best
}

/**
 * Advances trucks strictly along real road geometry waypoints.
 * Emits live operational audit logs.
 * Handles: bin collection, depot unloading when full, idle pickup when empty.
 */
export function advanceTrucks(
  trucks: Truck[],
  fill: Float32Array,
  dtHours: number,
  events: ScenarioEvent[] = [],
  simTime: number = Date.now()
): AdvanceResult {
  const next = trucks.map(t => ({
    ...t,
    route: [...t.route],
    roadPath: t.roadPath ? [...t.roadPath] : []
  }))
  const newLogs: AuditLogItem[] = []
  const timeStr = new Date(simTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  // Zone-level speed modifiers from events
  const zoneSpeedModifiers = new Float32Array(ZONE_COUNT).fill(1.0)
  for (const e of events) {
    if (e.targetZone == null) continue
    if (e.type === 'traffic-slowdown' || e.type === 'road-closure') {
      zoneSpeedModifiers[e.targetZone] = Math.max(0.2, 1 - e.intensity * 0.7)
    } else if (e.type === 'heavy-rain') {
      zoneSpeedModifiers[e.targetZone] = Math.max(0.4, 1 - e.intensity * 0.4)
    }
  }

  for (const t of next) {
    if (!Number.isFinite(t.lat) || !Number.isFinite(t.lon)) {
      t.lat = 12.9716
      t.lon = 77.5946
    }

    if (t.status === 'breakdown') continue

    const truckZone = zoneForLatLon(t.lat, t.lon)
    const zoneMod = zoneSpeedModifiers[truckZone] ?? 1.0
    const kmPerHour = t.speedKph * zoneMod
    const kmToAdvance = Math.max(0.001, kmPerHour * dtHours)

    // ─── RETURNING: drive to nearest depot to unload ─────────────────────────
    if (t.status === 'returning') {
      const depot = nearestDepot(t.lat, t.lon)

      // Get road path to depot (sync, uses cache or fallback)
      if (!t.roadPath || t.roadPath.length === 0) {
        const depotRoute = getRoadRouteSync({ lat: t.lat, lon: t.lon }, { lat: depot.lat, lon: depot.lon })
        t.roadPath = depotRoute.coordinates
        t.pathIndex = 0
        t.currentStreet = depot.name
      }

      // Advance along depot road path
      const arrived = advanceAlongPath(t, kmToAdvance)
      if (arrived) {
        // Arrived at depot — unload!
        const unloaded = t.loadKg
        t.loadKg = 0
        t.status = 'idle'
        t.roadPath = []
        t.pathIndex = 0
        t.lat = depot.lat + (Math.random() - 0.5) * 0.001
        t.lon = depot.lon + (Math.random() - 0.5) * 0.001

        newLogs.push({
          id: `log-depot-${Date.now()}-${t.id}`,
          time: timeStr,
          truckName: t.name,
          zoneName: depot.name,
          action: `Unloaded ${Math.round(unloaded)} kg at ${depot.name}`,
          rationale: `Vehicle returned to transfer station. Capacity cleared. Ready for next dispatch cycle.`,
          type: 'optimization'
        })
      }
      continue
    }

    // ─── NO ROUTE: truck is idle, nothing to do ───────────────────────────────
    if (!t.route.length || t.routeIndex >= t.route.length) {
      t.status = 'idle'
      continue
    }

    // Validate route index
    if (!Number.isFinite(t.routeIndex) || t.routeIndex < 0 || t.routeIndex >= t.route.length) {
      t.route = []
      t.routeIndex = 0
      t.status = 'idle'
      t.roadPath = []
      t.pathIndex = 0
      continue
    }

    const targetIndex = t.route[t.routeIndex]
    if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= BIN_COUNT) {
      t.routeIndex++
      t.roadPath = []
      t.pathIndex = 0
      continue
    }

    const targetBin = ALL_ROAD_BINS[targetIndex] || {
      lat: binPosition(targetIndex).lat,
      lon: binPosition(targetIndex).lon,
      street: 'Municipal Corridor',
      ward: 'Central Bengaluru'
    }

    // Get road path to bin (sync, uses cache or fallback)
    if (!t.roadPath || t.roadPath.length === 0) {
      const roadRoute = getRoadRouteSync({ lat: t.lat, lon: t.lon }, { lat: targetBin.lat, lon: targetBin.lon })
      t.roadPath = roadRoute.coordinates
      t.pathIndex = 0
      t.currentStreet = (targetBin as any).street || 'Municipal Road'

      if (Math.random() < 0.2) {
        newLogs.push({
          id: `log-${Date.now()}-${t.id}`,
          time: timeStr,
          truckName: t.name,
          zoneName: (targetBin as any).ward || 'Bengaluru',
          action: `Dispatched to ${(targetBin as any).street || 'bin location'}`,
          rationale: `Bin at ${Math.round(fill[targetIndex])}% fill. Route assigned via OSRM (${roadRoute.distanceKm} km).`,
          type: 'reroute'
        })
      }
    }

    // Advance along road waypoints
    const arrived = advanceAlongPath(t, kmToAdvance)
    if (arrived) {
      // ─── ARRIVED AT BIN: collect waste ───────────────────────────────────
      const fillFraction = fill[targetIndex] / 100
      const availableWaste = fillFraction * BIN_FULL_KG
      const remainingCapacity = t.capacityKg - t.loadKg
      const collected = Math.min(availableWaste, remainingCapacity)
      const prevFillPct = Math.round(fill[targetIndex])

      if (collected > 0) {
        // Remove collected waste from bin proportionally
        fill[targetIndex] = Math.max(0, fill[targetIndex] - (collected / BIN_FULL_KG) * 100)
        t.loadKg = Math.min(t.capacityKg, t.loadKg + collected)
      }

      t.routeIndex++
      t.roadPath = []
      t.pathIndex = 0

      newLogs.push({
        id: `log-col-${Date.now()}-${t.id}`,
        time: timeStr,
        truckName: t.name,
        zoneName: (targetBin as any).ward || 'Bengaluru',
        action: `Collected ${Math.round(collected)} kg at ${(targetBin as any).street || 'bin stop'}`,
        rationale: `Smart bin emptied from ${prevFillPct}% to ${Math.round(fill[targetIndex])}%. Vehicle at ${Math.round((t.loadKg / t.capacityKg) * 100)}% capacity.`,
        type: 'collection'
      })

      // Check if truck is full (>= 85% capacity) → return to depot
      if (t.loadKg >= t.capacityKg * 0.85) {
        t.route = []
        t.routeIndex = 0
        t.status = 'returning'
        t.roadPath = []
        t.pathIndex = 0

        newLogs.push({
          id: `log-ret-${Date.now()}-${t.id}`,
          time: timeStr,
          truckName: t.name,
          zoneName: (targetBin as any).ward || 'Bengaluru',
          action: `Returning to depot (${Math.round((t.loadKg / t.capacityKg) * 100)}% full)`,
          rationale: `Vehicle capacity threshold reached. Routing to nearest BBMP transfer station for unloading.`,
          type: 'optimization'
        })
      } else if (t.routeIndex >= t.route.length) {
        t.route = []
        t.routeIndex = 0
        t.status = 'idle'
      } else {
        t.status = 'active'
      }
    }
  }

  return { trucks: next, newLogs }
}

/**
 * Moves truck along its roadPath by kmToAdvance kilometers.
 * Returns true when the truck has reached the end of the path (destination arrived).
 */
function advanceAlongPath(t: Truck, kmToAdvance: number): boolean {
  if (!t.roadPath || t.roadPath.length < 2) return true // No path = consider arrived

  let remaining = kmToAdvance
  const pIdx = t.pathIndex ?? 0

  for (let i = pIdx; i < t.roadPath.length - 1; i++) {
    const from = t.roadPath[i]
    const to = t.roadPath[i + 1]
    const dLat = (to[1] - from[1]) * 111
    const dLon = (to[0] - from[0]) * 102
    const segDist = Math.sqrt(dLat * dLat + dLon * dLon)

    if (remaining >= segDist || segDist < 0.002) {
      // Snap to end of segment
      t.lat = to[1]
      t.lon = to[0]
      t.pathIndex = i + 1
      remaining -= segDist
      if (i + 1 >= t.roadPath.length - 1) return true // Reached destination
    } else {
      // Partial advance within segment
      const ratio = remaining / segDist
      t.lat = from[1] + (to[1] - from[1]) * ratio
      t.lon = from[0] + (to[0] - from[0]) * ratio
      t.pathIndex = i
      return false
    }
  }

  return true
}
