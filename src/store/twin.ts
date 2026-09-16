import { create } from 'zustand'
import { BIN_COUNT, CITY, createFillArray, makeTrucks, zoneForLatLon } from '../data/model'
import type { Metrics, ScenarioEvent, ThemeMode, Truck, ViewMode, MapStyle } from '../data/types'
import { tickFill, advanceTrucks } from '../engine/sim'
import { fixedBaseline, optimize, type Plan } from '../engine/routing'

const START = new Date('2026-09-16T07:00:00+05:30').getTime()

function calc(fill: Float32Array, trucks: Truck[], existingPlans?: Plan[]): Metrics {
  const o = existingPlans ?? optimize(fill, trucks)
  const f = fixedBaseline(fill, trucks)
  const od = o.reduce((a, p) => a + (Number.isFinite(p.km) ? p.km : 0), 0)
  const fd = f.reduce((a, p) => a + (Number.isFinite(p.km) ? p.km : 0), 0)
  const om = o.reduce((a, p) => a + (Number.isFinite(p.minutes) ? p.minutes : 0), 0)
  const fm = f.reduce((a, p) => a + (Number.isFinite(p.minutes) ? p.minutes : 0), 0)

  let critical = 0, sum = 0
  for (let i = 0; i < fill.length; i++) {
    const val = Number.isFinite(fill[i]) ? fill[i] : 50
    sum += val
    if (val >= 90) critical++
  }

  const active = trucks.filter(t => t.status !== 'breakdown')
  const totalLoad = trucks.reduce((a, t) => a + (t.capacityKg > 0 ? (t.loadKg || 0) / t.capacityKg : 0), 0)
  const fleetLoadPct = trucks.length > 0
    ? Math.round(Math.max(0, Math.min(100, (totalLoad / trucks.length) * 100)))
    : 0

  return {
    fixedKm: Number.isFinite(fd) ? Number(fd.toFixed(1)) : 0,
    optimizedKm: Number.isFinite(od) ? Number(od.toFixed(1)) : 0,
    fixedMinutes: Number.isFinite(fm) ? Math.round(fm) : 0,
    optimizedMinutes: Number.isFinite(om) ? Math.round(om) : 0,
    criticalBins: critical,
    overflowRiskPct: fill.length ? Math.round(Math.max(0, Math.min(100, sum / fill.length))) : 0,
    fleetLoadPct,
    projectedOverflow24h: Math.round(critical * 1.8),
    activeTrucks: active.length
  }
}

interface State {
  view: ViewMode
  mapStyle: MapStyle
  theme: ThemeMode
  playing: boolean
  speed: number
  time: number
  fill: Float32Array
  trucks: Truck[]
  events: ScenarioEvent[]
  history: Array<{ t: number; fill: Float32Array; trucks: Truck[] }>
  metrics: Metrics
  selectedBin: number | null
  selectedTruck: number | null
  setView: (v: ViewMode) => void
  setMapStyle: (v: MapStyle) => void
  setTheme: (v: ThemeMode) => void
  togglePlaying: () => void
  setPlaying: (p: boolean) => void
  setSpeed: (n: number) => void
  step: (hours: number) => void
  rewind: (hours: number) => void
  reset: () => void
  addScenario: (e: ScenarioEvent) => void
  removeScenario: (id: string) => void
  selectBin: (i: number | null) => void
  selectTruck: (i: number | null) => void
  markTruckBroken: (id: number) => void
  repairTruck: (id: number) => void
}

const initFill = createFillArray()
const initTrucks = makeTrucks()

export const useTwin = create<State>((set, get) => ({
  view: '3d',
  mapStyle: 'satellite',
  theme: 'dark',
  playing: false,
  speed: 10,
  time: START,
  fill: initFill,
  trucks: initTrucks,
  events: [],
  history: [],
  metrics: calc(initFill, initTrucks),
  selectedBin: null,
  selectedTruck: null,

  setView: (view) => set({ view }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setTheme: (theme) => set({ theme }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),

  step: (hours) => {
    const s = get()
    const fill = s.fill.slice()
    const time = s.time + hours * 3600000

    // Advance fill levels with active disruption events
    tickFill(fill, s.events, time, hours)

    // Advance trucks along routes with safety bounds
    const moved = advanceTrucks(s.trucks, fill, hours, s.events)

    // Optimize routes
    const plans = optimize(fill, moved)
    for (const p of plans) {
      const t = moved[p.truckId]
      if (t && t.status !== 'breakdown' && p.stops.length > 0) {
        // If the truck has completed its previous route or is idle, assign the fresh plan
        if (t.route.length === 0 || t.routeIndex >= t.route.length || t.status === 'idle') {
          t.route = p.stops
          t.routeIndex = 0
          t.status = 'active'
        }
      }
    }

    const metrics = calc(fill, moved, plans)
    const historyItem = {
      t: time,
      fill: fill.slice(),
      trucks: moved.map(t => ({ ...t, route: [...t.route] }))
    }

    set({
      time,
      fill,
      trucks: moved,
      metrics,
      history: [...s.history, historyItem].slice(-13)
    })
  },

  rewind: (hours) => {
    const s = get()
    const target = s.time - hours * 3600000
    const cand = s.history.filter(h => h.t <= target).at(-1) || s.history[0]
    if (!cand) return
    const fill = cand.fill.slice()
    const trucks = cand.trucks.map(t => ({ ...t, route: [...t.route] }))
    set({
      time: cand.t,
      fill,
      trucks,
      metrics: calc(fill, trucks),
      history: s.history.filter(h => h.t <= cand.t)
    })
  },

  reset: () => {
    const fill = createFillArray()
    const trucks = makeTrucks()
    set({
      time: START,
      fill,
      trucks,
      events: [],
      history: [],
      playing: false,
      metrics: calc(fill, trucks),
      selectedBin: null,
      selectedTruck: null
    })
  },

  addScenario: (e) => set((s) => {
    let nextTrucks = s.trucks
    // If truck breakdown scenario, break some trucks in that zone
    if (e.type === 'truck-breakdown' || e.type === 'fleet-reduction') {
      const targetZone = e.targetZone ?? 0
      nextTrucks = s.trucks.map(t => {
        const tz = zoneForLatLon(t.lat, t.lon)
        if (tz === targetZone && (t.id % 3 === 0)) {
          return { ...t, status: 'breakdown' as const, route: [], routeIndex: 0 }
        }
        return t
      })
    }
    return {
      events: [...s.events, e],
      trucks: nextTrucks,
      metrics: calc(s.fill, nextTrucks)
    }
  }),

  removeScenario: (id) => set((s) => {
    const remaining = s.events.filter(e => e.id !== id)
    return {
      events: remaining,
      metrics: calc(s.fill, s.trucks)
    }
  }),

  selectBin: (selectedBin) => set({ selectedBin }),
  selectTruck: (selectedTruck) => set({ selectedTruck }),

  markTruckBroken: (id) => set((s) => {
    const trucks = s.trucks.map(t => (t.id === id ? { ...t, status: 'breakdown' as const, route: [], routeIndex: 0 } : t))
    return { trucks, metrics: calc(s.fill, trucks) }
  }),

  repairTruck: (id) => set((s) => {
    const trucks = s.trucks.map(t => (t.id === id ? { ...t, status: 'idle' as const } : t))
    return { trucks, metrics: calc(s.fill, trucks) }
  })
}))

export const getCityCenter = () => CITY.center

