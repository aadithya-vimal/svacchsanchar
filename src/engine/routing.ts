import { binPosition, TRUCK_COUNT, BIN_COUNT } from '../data/model'
import { visibleCriticalBins } from './sim'
import type { Truck } from '../data/types'

export interface Plan { truckId: number; stops: number[]; km: number; minutes: number }

const dist = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const aLat = Number.isFinite(a?.lat) ? a.lat : 12.9716
  const aLon = Number.isFinite(a?.lon) ? a.lon : 77.5946
  const bLat = Number.isFinite(b?.lat) ? b.lat : 12.9716
  const bLon = Number.isFinite(b?.lon) ? b.lon : 77.5946
  const dLat = (aLat - bLat) * 111
  const dLon = (aLon - bLon) * 102
  const d = Math.sqrt(dLat * dLat + dLon * dLon)
  return Number.isFinite(d) ? d : 0
}

export function optimize(fill: Float32Array, trucks: Truck[]): Plan[] {
  const candidateIds = visibleCriticalBins(fill, Math.min(2400, Math.max(600, trucks.length * 6)))
  const taken = new Uint8Array(BIN_COUNT)
  const plans: Plan[] = []

  for (const truck of trucks) {
    if (truck.status === 'breakdown') {
      plans.push({ truckId: truck.id, stops: [], km: 0, minutes: 0 })
      continue
    }

    let current = {
      lat: Number.isFinite(truck.lat) ? truck.lat : 12.9716,
      lon: Number.isFinite(truck.lon) ? truck.lon : 77.5946
    }
    let loadLeft = Math.max(60, truck.capacityKg - truck.loadKg)
    let km = 0
    const stops: number[] = []

    // Greedily find closest critical stops for this vehicle
    while (stops.length < 8 && loadLeft > 80) {
      let bestId = -1
      let bestScore = 1e9

      for (let i = 0; i < Math.min(candidateIds.length, 250); i++) {
        const binId = candidateIds[i]
        if (!Number.isFinite(binId) || binId < 0 || binId >= BIN_COUNT || taken[binId]) continue

        const p = binPosition(binId)
        const d = dist(current, p)
        const urgency = (fill[binId] || 70) / 100
        const score = d * (1.18 - urgency * 0.34) + (loadLeft < 240 ? 6 : 0)

        if (score < bestScore) {
          bestScore = score
          bestId = binId
        }
      }

      if (bestId < 0) break
      taken[bestId] = 1
      const p = binPosition(bestId)
      const d = dist(current, p)
      km += d
      loadLeft -= Math.min(140, (fill[bestId] || 50) * 12 * 0.18)
      stops.push(bestId)
      current = p
    }

    const finalKm = Number((km + 3.2).toFixed(1))
    const finalMinutes = Math.round((km + 3.2) * 3.5 + 10)
    plans.push({ truckId: truck.id, stops, km: Number.isFinite(finalKm) ? finalKm : 3.2, minutes: Number.isFinite(finalMinutes) ? finalMinutes : 15 })
  }

  return plans
}

export function fixedBaseline(fill: Float32Array, trucks: Truck[]): Plan[] {
  const candidates = visibleCriticalBins(fill, 1800)
  const chunk = Math.max(1, Math.ceil(candidates.length / Math.max(1, trucks.length)))
  const out: Plan[] = []

  trucks.forEach((t, i) => {
    const stops = candidates.slice(i * chunk, (i + 1) * chunk).slice(0, 6)
    let km = 3.5
    let cur = {
      lat: Number.isFinite(t.lat) ? t.lat : 12.9716,
      lon: Number.isFinite(t.lon) ? t.lon : 77.5946
    }
    for (const id of stops) {
      if (!Number.isFinite(id) || id < 0 || id >= BIN_COUNT) continue
      const p = binPosition(id)
      km += dist(cur, p)
      cur = p
    }
    const finalKm = Number.isFinite(km) ? Number(km.toFixed(1)) : 3.5
    out.push({
      truckId: t.id,
      stops,
      km: finalKm,
      minutes: Number.isFinite(finalKm) ? Math.round(finalKm * 4.4 + 12) : 25
    })
  })

  return out
}
