import type { ScenarioEvent, Truck } from '../data/types'
import { BIN_COUNT, ZONE_COUNT, binPosition, binZones, hash, zoneForLatLon } from '../data/model'

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

  // Fast loop using precomputed zone lookups
  for (let i = 0; i < BIN_COUNT; i++) {
    const base = 2.7 + hash(i * 5.13) * 6.8
    const zoneFactor = 1 + ((binZones[i] % ZONE_COUNT) / ZONE_COUNT) * 0.16
    const variance = 0.82 + hash(i * 1.917) * 0.36
    const ef = events.length > 0 ? eventFactor(i, events, simTime) : 1
    const nextVal = fill[i] + base * zoneFactor * variance * sf * tf * hf * ef * step
    fill[i] = nextVal > 100 ? 100 : nextVal < 0 ? 0 : nextVal
  }
}

export function visibleCriticalBins(fill: Float32Array, limit = 2600): number[] {
  const ids: number[] = []
  for (let i = 0; i < fill.length; i++) {
    if (fill[i] >= 70) ids.push(i)
  }
  ids.sort((a, b) => fill[b] - fill[a])
  return ids.slice(0, limit)
}

export function advanceTrucks(trucks: Truck[], fill: Float32Array, dtHours: number, events: ScenarioEvent[] = []): Truck[] {
  const next = trucks.map(t => ({ ...t, route: [...t.route] }))
  const hour = Date.now() / 3600000

  // Check active zone-level disruption modifiers
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
    // Sanity check coordinates
    if (!Number.isFinite(t.lat) || !Number.isFinite(t.lon)) {
      t.lat = 12.9716
      t.lon = 77.5946
    }

    if (t.status === 'breakdown' || !t.route.length) continue

    // Boundary safety on routeIndex
    if (!Number.isFinite(t.routeIndex) || t.routeIndex < 0 || t.routeIndex >= t.route.length) {
      t.route = []
      t.routeIndex = 0
      t.status = 'idle'
      continue
    }

    const targetIndex = t.route[t.routeIndex]
    if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= BIN_COUNT) {
      t.routeIndex++
      if (t.routeIndex >= t.route.length) {
        t.route = []
        t.routeIndex = 0
        t.status = 'returning'
      }
      continue
    }

    const target = binPosition(targetIndex)
    const truckZone = zoneForLatLon(t.lat, t.lon)
    const zoneMod = zoneSpeedModifiers[truckZone] ?? 1.0

    const metersPerHour = t.speedKph * 1000 * zoneMod
    const latDelta = target.lat - t.lat
    const lonDelta = target.lon - t.lon
    const roughKm = Math.sqrt((latDelta * 111) ** 2 + (lonDelta * 102) ** 2)

    if (!Number.isFinite(roughKm) || roughKm <= 0.01) {
      t.lat = target.lat
      t.lon = target.lon
      t.segmentProgress = 1
    } else {
      const advance = Math.min(1, (metersPerHour * dtHours) / (roughKm * 1000))
      t.lat += latDelta * advance
      t.lon += lonDelta * advance
      t.segmentProgress = advance
    }

    // Finished visiting the bin stop
    if (t.segmentProgress >= 0.99) {
      const collected = Math.min(fill[targetIndex], Math.max(0, (t.capacityKg - t.loadKg) / 12))
      fill[targetIndex] = Math.max(0, fill[targetIndex] - collected)
      t.loadKg = Math.min(t.capacityKg, t.loadKg + collected * 12)
      t.routeIndex++

      if (t.routeIndex >= t.route.length) {
        t.route = []
        t.routeIndex = 0
        t.status = t.loadKg >= t.capacityKg * 0.85 ? 'returning' : 'idle'
      } else {
        t.status = 'active'
      }
    }
  }
  return next
}
