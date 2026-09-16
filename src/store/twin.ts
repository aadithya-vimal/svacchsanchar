import { create } from 'zustand'
import { BIN_COUNT, CITY, createFillArray, makeTrucks, zoneForLatLon } from '../data/model'
import type { Metrics, ScenarioEvent, ThemeMode, Truck, ViewMode, MapStyle, AuditLogItem } from '../data/types'
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
    if (val >= 85) critical++
  }

  const active = trucks.filter(t => t.status !== 'breakdown')
  const totalLoad = trucks.reduce((a, t) => a + (t.capacityKg > 0 ? (t.loadKg || 0) / t.capacityKg : 0), 0)
  const fleetLoadPct = trucks.length > 0
    ? Math.round(Math.max(0, Math.min(100, (totalLoad / trucks.length) * 100)))
    : 0

  const kmAvoided = Math.max(0, fd - od)
  const fuelSaved = kmAvoided / 3.8 // Heavy compactor diesel economy ~3.8 km/L
  const co2Avoided = fuelSaved * 2.68 // 2.68 kg CO2 per liter diesel
  const costSaved = fuelSaved * 88 // ₹88 / Liter municipal diesel rate

  return {
    fixedKm: Number.isFinite(fd) ? Number(fd.toFixed(1)) : 0,
    optimizedKm: Number.isFinite(od) ? Number(od.toFixed(1)) : 0,
    fixedMinutes: Number.isFinite(fm) ? Math.round(fm) : 0,
    optimizedMinutes: Number.isFinite(om) ? Math.round(om) : 0,
    criticalBins: critical,
    overflowRiskPct: fill.length ? Math.round(Math.max(0, Math.min(100, sum / fill.length))) : 0,
    fleetLoadPct,
    projectedOverflow24h: Math.round(critical * 1.5),
    activeTrucks: active.length,
    fuelSavedLiters: Number(fuelSaved.toFixed(1)),
    co2AvoidedKg: Number(co2Avoided.toFixed(1)),
    costSavedInr: Math.round(costSaved)
  }
}

const INITIAL_LOGS: AuditLogItem[] = [
  {
    id: 'seed-1',
    time: '07:00 AM',
    truckName: 'SWC-001',
    zoneName: 'CBD Central',
    action: 'Route initialized via OSRM',
    rationale: 'Dispatched from BBMP Central Depot to MG Road / Brigade Road commercial corridor.',
    type: 'optimization'
  },
  {
    id: 'seed-2',
    time: '07:05 AM',
    truckName: 'SWC-003',
    zoneName: 'Koramangala',
    action: 'Cluster reroute triggered',
    rationale: 'Prioritized 4 high-density bins along 80ft Road (+18% fuel efficiency vs static schedule).',
    type: 'reroute'
  },
  {
    id: 'seed-3',
    time: '07:11 AM',
    truckName: 'SWC-005',
    zoneName: 'Indiranagar',
    action: 'Critical fill threshold mitigated',
    rationale: 'Bin #14 at 100ft / CMH Junction reached 91% capacity. Rerouted prior to spillover.',
    type: 'collection'
  },
  {
    id: 'seed-4',
    time: '07:16 AM',
    truckName: 'SWC-008',
    zoneName: 'Outer Ring Road',
    action: 'Arterial detour confirmed',
    rationale: 'Silk Board flyover construction avoidance: traversed via Iblur service lane.',
    type: 'optimization'
  }
]

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
  auditLogs: AuditLogItem[]
  selectedBin: number | null
  selectedTruck: number | null
  setView: (v: ViewMode) => void
  setMapStyle: (v: MapStyle) => void
  setTheme: (v: ThemeMode) => void
  togglePlaying: () => void
  setPlaying: (p: boolean) => void
  setSpeed: (n: number) => void
  step: (hours: number) => void
  seekTime: (targetTime: number) => void
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
  mapStyle: 'streets', // OpenStreetMap by default!
  theme: 'dark',
  playing: false,
  speed: 10,
  time: START,
  fill: initFill,
  trucks: initTrucks,
  events: [],
  history: [],
  metrics: calc(initFill, initTrucks),
  auditLogs: INITIAL_LOGS,
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

    // Advance trucks along real road coordinates and collect logs
    const { trucks: moved, newLogs } = advanceTrucks(s.trucks, fill, hours, s.events, time)

    // Optimize routes
    const plans = optimize(fill, moved)
    for (const p of plans) {
      const t = moved[p.truckId]
      if (t && t.status !== 'breakdown' && p.stops.length > 0) {
        // If truck completed its previous route or is idle, assign the fresh plan
        if (t.route.length === 0 || t.routeIndex >= t.route.length || t.status === 'idle') {
          t.route = p.stops
          t.routeIndex = 0
          t.status = 'active'
          t.roadPath = []
          t.pathIndex = 0
        }
      }
    }

    const metrics = calc(fill, moved, plans)
    const historyItem = {
      t: time,
      fill: fill.slice(),
      trucks: moved.map(t => ({ ...t, route: [...t.route] }))
    }

    const mergedLogs = newLogs.length > 0
      ? [...newLogs, ...s.auditLogs].slice(0, 45)
      : s.auditLogs

    set({
      time,
      fill,
      trucks: moved,
      metrics,
      auditLogs: mergedLogs,
      history: [...s.history, historyItem].slice(-24)
    })
  },

  seekTime: (targetTime: number) => {
    const s = get()
    const deltaHours = (targetTime - s.time) / 3600000
    if (Math.abs(deltaHours) < 0.01) return

    // If historical state exists, interpolate from history
    const cand = s.history.filter(h => h.t <= targetTime).at(-1)
    if (cand && deltaHours < 0) {
      const fill = cand.fill.slice()
      const trucks = cand.trucks.map(t => ({ ...t, route: [...t.route] }))
      set({
        time: targetTime,
        fill,
        trucks,
        metrics: calc(fill, trucks)
      })
    } else {
      // Advance or step to target time
      s.step(Math.max(-2, Math.min(2, deltaHours)))
    }
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
      auditLogs: INITIAL_LOGS,
      selectedBin: null,
      selectedTruck: null
    })
  },

  addScenario: (e) => set((s) => {
    let nextTrucks = s.trucks
    // If truck breakdown scenario, mark target trucks in that zone as breakdown
    if (e.type === 'truck-breakdown' || e.type === 'fleet-reduction') {
      const targetZone = e.targetZone ?? 0
      nextTrucks = s.trucks.map(t => {
        const tz = zoneForLatLon(t.lat, t.lon)
        if (tz === targetZone && (t.id % 2 === 0)) {
          return { ...t, status: 'breakdown' as const, route: [], routeIndex: 0, roadPath: [] }
        }
        return t
      })
    }
    const log: AuditLogItem = {
      id: `scen-${Date.now()}`,
      time: new Date(s.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      truckName: 'System Core',
      zoneName: `Zone ${e.targetZone ?? 'All'}`,
      action: `Stress Test: ${e.title}`,
      rationale: `Disruption intensity ${(e.intensity * 100).toFixed(0)}% injected. Re-computing dynamic road dispatches.`,
      type: 'disruption'
    }
    return {
      events: [...s.events, e],
      trucks: nextTrucks,
      auditLogs: [log, ...s.auditLogs].slice(0, 45),
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
    const trucks = s.trucks.map(t => (t.id === id ? { ...t, status: 'breakdown' as const, route: [], routeIndex: 0, roadPath: [] } : t))
    return { trucks, metrics: calc(s.fill, trucks) }
  }),

  repairTruck: (id) => set((s) => {
    const trucks = s.trucks.map(t => (t.id === id ? { ...t, status: 'idle' as const } : t))
    return { trucks, metrics: calc(s.fill, trucks) }
  })
}))

export const getCityCenter = () => CITY.center
