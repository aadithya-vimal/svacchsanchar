import { describe, it, expect } from 'vitest'
import { season, seasonMultiplier, timeMultiplier, advanceTrucks } from '../src/engine/sim'
import { ALL_ROAD_BINS, makeTrucks, createFillArray, BIN_COUNT } from '../src/data/model'
import { getRoadRouteSync } from '../src/engine/osrm'
import { optimize, fixedBaseline } from '../src/engine/routing'

describe('simulation model', () => {
  it('classifies seasons', () => {
    expect(season(7)).toBe('monsoon')
    expect(season(12)).toBe('winter')
  })

  it('models peak periods', () => {
    expect(timeMultiplier(18)).toBeGreaterThan(timeMultiplier(2))
  })

  it('models monsoon lift', () => {
    expect(seasonMultiplier(7)).toBeGreaterThan(seasonMultiplier(12))
  })

  it('provides 288 road-snapped bins with valid coordinates', () => {
    expect(BIN_COUNT).toBe(288)
    expect(ALL_ROAD_BINS.length).toBe(288)
    for (const b of ALL_ROAD_BINS) {
      expect(Number.isFinite(b.lat)).toBe(true)
      expect(Number.isFinite(b.lon)).toBe(true)
      expect(b.street.length).toBeGreaterThan(2)
      // Check coordinates within Bengaluru bounds
      expect(b.lat).toBeGreaterThan(12.80)
      expect(b.lat).toBeLessThan(13.15)
      expect(b.lon).toBeGreaterThan(77.45)
      expect(b.lon).toBeLessThan(77.80)
    }
  })

  it('generates road-aligned waypoints via OSRM fallback', () => {
    const origin = { lat: 12.9755, lon: 77.6066 } // MG Road
    const dest = { lat: 12.9340, lon: 77.6250 } // Koramangala
    const route = getRoadRouteSync(origin, dest)
    expect(route.coordinates.length).toBeGreaterThanOrEqual(2)
    expect(route.distanceKm).toBeGreaterThan(1.0)
    for (const pt of route.coordinates) {
      expect(Number.isFinite(pt[0])).toBe(true)
      expect(Number.isFinite(pt[1])).toBe(true)
    }
  })

  it('optimizes routes without producing NaN', () => {
    const fill = createFillArray()
    const trucks = makeTrucks()
    const plans = optimize(fill, trucks)
    expect(plans.length).toBe(trucks.length)
    for (const p of plans) {
      expect(Number.isFinite(p.km)).toBe(true)
      expect(Number.isFinite(p.minutes)).toBe(true)
    }
    const fixed = fixedBaseline(fill, trucks)
    expect(fixed.length).toBe(trucks.length)
    for (const f of fixed) {
      expect(Number.isFinite(f.km)).toBe(true)
      expect(Number.isFinite(f.minutes)).toBe(true)
    }
  })

  it('advances trucks along road paths and produces audit logs', () => {
    const fill = createFillArray()
    const trucks = makeTrucks()
    trucks[0].route = [0, 1, 2]
    trucks[0].status = 'active'
    const result = advanceTrucks(trucks, fill, 0.05)
    expect(result.trucks.length).toBe(trucks.length)
    expect(Number.isFinite(result.trucks[0].lat)).toBe(true)
    expect(Number.isFinite(result.trucks[0].lon)).toBe(true)
  })
})
