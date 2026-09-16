import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, Clock3, Eye, Flame, Layers3, Map,
  Pause, Play, RotateCcw, Settings, SlidersHorizontal, Truck, Zap
} from 'lucide-react'
import { useTwin } from '../store/twin'
import { useProviders } from '../store/providers'
import { CesiumWorld } from './CesiumWorld'
import { ProviderPanel } from './ProviderPanel'
import { SearchBar } from './SearchBar'
import { SpeedSelect } from './SpeedSelect'
import type { MapStyle } from '../data/types'

export function SimulatorPage({ go }: { go: (p: string) => void }) {
  const s = useTwin()
  const p = useProviders()
  const [panel, setPanel] = useState<'none' | 'providers' | 'layers'>('none')
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lon: number; height?: number } | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme
    const dark = s.theme === 'dark' || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }, [s.theme])

  // Simulation clock ticker
  useEffect(() => {
    if (!s.playing) return
    const t = window.setInterval(() => s.step(0.02 * s.speed), 1000)
    return () => window.clearInterval(t)
  }, [s.playing, s.speed])

  const d = new Date(s.time)
  const timeText = d.toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
  const critical = s.metrics.criticalBins

  const [mapStyle, setMapStyle] = useState<MapStyle>(s.mapStyle)
  const styleButtons: [MapStyle, string][] = [
    ['streets', 'Standard'],
    ['light', 'Light'],
    ['dark', 'Dark'],
    ['satellite', 'Satellite'],
    ['terrain', 'Terrain']
  ]

  const focused = s.selectedBin != null ? s.selectedBin : null
  const focusedBins = useMemo(() => (focused != null ? [focused] : []), [focused])

  const handleSelectBin = (id: number) => {
    s.selectBin(id)
  }

  const handleSelectTruck = (id: number) => {
    s.selectTruck(id)
  }

  return (
    <div className="sim-page">
      <div className="sim-world">
        <CesiumWorld
          view={s.view}
          bins={focusedBins}
          fill={s.fill}
          trucks={s.trucks}
          mapStyle={mapStyle}
          googleKey={p.googleMapsKey}
          cesiumToken={p.cesiumIonToken}
          mapTilerKey={p.mapTilerKey}
          mapboxToken={p.mapboxToken}
          stadiaKey={p.stadiaKey}
          flyToTarget={flyToTarget}
          onSelectBin={handleSelectBin}
          onSelectTruck={handleSelectTruck}
        />
      </div>

      {/* Top Bar with Brand, Search, Clock, and Quick Actions */}
      <header className="sim-topbar glass">
        <button className="back-btn" onClick={() => go('/')} title="Return to Landing Page">
          <ArrowLeft size={16} />
        </button>

        <div className="sim-brand">
          <b>SvacchSanchar</b>
          <span>BENGALURU / LIVE TWIN</span>
        </div>

        {/* Global Interactive Search Bar */}
        <SearchBar
          trucks={s.trucks}
          fill={s.fill}
          onNavigate={setFlyToTarget}
          onSelectBin={handleSelectBin}
          onSelectTruck={handleSelectTruck}
        />

        <div className="clock-chip">
          <span className="live-dot" />
          <b>{timeText}</b>
          <span className="speed-chip-badge">{s.speed}×</span>
        </div>

        <div className="top-actions">
          <button
            onClick={() => setPanel(panel === 'providers' ? 'none' : 'providers')}
            title="Settings & Map Providers"
            className={panel === 'providers' ? 'active-top-btn' : ''}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => s.setTheme(s.theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
          >
            {s.theme === 'dark' ? '☼' : '◐'}
          </button>
          <button onClick={() => s.reset()} title="Reset Simulation">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Navigation Dock */}
      <div className="sim-nav glass">
        <button onClick={() => go('/simulator')} className="active">
          <Activity size={14} className="text-emerald" />Twin
        </button>
        <button onClick={() => go('/fleet')}>
          <Truck size={14} className="text-cyan" />Fleet
        </button>
        <button onClick={() => go('/scenarios')}>
          <Flame size={14} className="text-coral" />Scenarios
        </button>
        <button onClick={() => go('/analytics')}>
          <SlidersHorizontal size={14} className="text-indigo" />Analytics
        </button>
        <button onClick={() => go('/data')}>
          <Layers3 size={14} className="text-amber" />Data
        </button>
      </div>

      {/* 2D / 3D Mode Switcher */}
      <div className="mode-switch glass">
        <button
          className={s.view === '2d' ? 'active' : ''}
          onClick={() => s.setView('2d')}
        >
          <Map size={14} />2D
        </button>
        <button
          className={s.view === '3d' ? 'active' : ''}
          onClick={() => s.setView('3d')}
        >
          <Eye size={14} />3D
        </button>
      </div>

      {/* Left Cockpit Controls */}
      <div className="left-cockpit">
        <div className="eyebrow cyber-tag">CITY OPS / BENGALURU</div>
        <h1>Under one view.</h1>
        <p>Watch municipal waste demand evolve dynamically across a 120,000-bin living twin.</p>
        <div className="cockpit-actions">
          <button
            className={`primary-btn ${s.playing ? 'active-run-btn' : 'glow-btn'}`}
            onClick={() => s.togglePlaying()}
          >
            {s.playing ? <Pause size={15} /> : <Play size={15} />}
            {s.playing ? 'Pause Simulation' : 'Run Simulation'}
          </button>
          <button className="secondary-btn glass" onClick={() => go('/scenarios')}>
            <Flame size={15} className="text-coral" /> Stress Test
          </button>
        </div>
      </div>

      {/* Metrics Rail */}
      <div className="metrics-rail">
        <Metric
          label="OPTIMIZED ROUTE"
          value={`${s.metrics.optimizedKm} km`}
          sub={`vs ${s.metrics.fixedKm} km fixed`}
          icon={<Zap size={14} className="text-emerald" />}
          trend="optimal"
        />
        <Metric
          label="ROUTE TIME"
          value={`${s.metrics.optimizedMinutes} min`}
          sub={`vs ${s.metrics.fixedMinutes} min fixed`}
          icon={<Clock3 size={14} className="text-cyan" />}
          trend="optimal"
        />
        <Metric
          label="CRITICAL BINS"
          value={critical.toLocaleString()}
          sub={`${s.fill.length.toLocaleString()} monitored`}
          icon={<AlertTriangle size={14} className="text-coral" />}
          trend={critical > 500 ? 'alert' : 'neutral'}
        />
        <Metric
          label="FLEET LOAD"
          value={`${s.metrics.fleetLoadPct}%`}
          sub={`${s.metrics.activeTrucks} vehicles active`}
          icon={<Truck size={14} className="text-indigo" />}
          trend="neutral"
        />
      </div>

      {/* Map Style Controls */}
      <div className="map-controls glass">
        <div className="section-title">BASEMAP & IMAGERY</div>
        <div className="style-row">
          {styleButtons.map(([v, l]) => (
            <button
              key={v}
              className={mapStyle === v ? 'active' : ''}
              onClick={() => {
                setMapStyle(v)
                s.setMapStyle(v)
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="control-note">
          {mapStyle === 'satellite' && !p.mapTilerKey && !p.stadiaKey && !p.mapboxToken
            ? 'Satellite uses Esri high-res imagery.'
            : ''}
          {s.view === '3d' && p.googleMapsKey
            ? 'Google Photorealistic 3D enabled.'
            : 'Procedural 3D city blocks active.'}
        </div>
      </div>

      {/* Simulation Timeline with Styled Speed Dropdown */}
      <div className="timeline glass">
        <button onClick={() => s.rewind(1)} title="Rewind 1 hour">
          ↶
        </button>
        <div className="timeline-main">
          <div className="timeline-title">
            SIMULATION CLOCK{' '}
            <span>
              {d.getHours().toString().padStart(2, '0')}:
              {d.getMinutes().toString().padStart(2, '0')} IST
            </span>
          </div>
          <div className="timeline-track">
            <div
              className="timeline-fill"
              style={{
                width: `${(((d.getMinutes() + d.getHours() * 60) % 1440) / 1440) * 100}%`
              }}
            />
          </div>
          <div className="timeline-meta">
            <span>ROLLING 60-MIN BUFFER</span>
            <span>{s.history.length} snapshots</span>
          </div>
        </div>

        {/* Custom UI-Styled Speed Dropdown */}
        <SpeedSelect speed={s.speed} onChange={s.setSpeed} />
      </div>

      {/* Status Pill */}
      <div className="status-pill glass">
        <span className={`live-dot ${s.events.length ? 'disruption-active' : ''}`} />
        {s.events.length
          ? `${s.events.length} scenario disruption${s.events.length > 1 ? 's' : ''} active`
          : 'Baseline simulation running'}
      </div>

      {/* Focused Bin Entity Card */}
      {focused != null && (
        <div className="entity-card glass">
          <div className="entity-kicker">SMART BIN #{String(focused + 1).padStart(6, '0')}</div>
          <b className={s.fill[focused] >= 90 ? 'text-coral' : s.fill[focused] >= 70 ? 'text-amber' : 'text-emerald'}>
            {s.fill[focused].toFixed(0)}% full
          </b>
          <div className="progress">
            <div
              style={{
                width: `${s.fill[focused]}%`,
                background:
                  s.fill[focused] >= 90
                    ? 'var(--coral)'
                    : s.fill[focused] >= 70
                    ? 'var(--amber)'
                    : 'var(--emerald)'
              }}
            />
          </div>
          <div className="entity-row">
            <span>Sensor Status</span>
            <strong>{s.fill[focused] >= 90 ? 'Critical Urgent' : 'Operational'}</strong>
          </div>
          <button onClick={() => s.selectBin(null)}>Dismiss</button>
        </div>
      )}

      {/* Focused Truck Entity Card */}
      {s.selectedTruck != null && (
        <div className="entity-card glass">
          <div className="entity-kicker">VEHICLE {s.trucks[s.selectedTruck]?.name}</div>
          <b className={`status-badge ${s.trucks[s.selectedTruck]?.status}`}>
            {s.trucks[s.selectedTruck]?.status.toUpperCase()}
          </b>
          <div className="progress">
            <div
              style={{
                width: `${Math.round(
                  ((s.trucks[s.selectedTruck]?.loadKg || 0) /
                    (s.trucks[s.selectedTruck]?.capacityKg || 1)) *
                    100
                )}%`,
                background: 'var(--cyan)'
              }}
            />
          </div>
          <div className="entity-row">
            <span>Payload</span>
            <strong>
              {Math.round(s.trucks[s.selectedTruck]?.loadKg || 0)} /{' '}
              {s.trucks[s.selectedTruck]?.capacityKg} kg
            </strong>
          </div>
          <div className="entity-row">
            <span>Remaining Stops</span>
            <strong>{s.trucks[s.selectedTruck]?.route.length || 0} bins</strong>
          </div>
          <button onClick={() => s.selectTruck(null)}>Dismiss</button>
        </div>
      )}

      {/* Settings / Provider Panel Drawer */}
      {panel === 'providers' && <ProviderPanel onClose={() => setPanel('none')} />}

      <div className="bottom-hint">120,000 Smart Bins · 512 Fleet Units · High-Frequency Municipal Model</div>
    </div>
  )
}

function Metric({
  label,
  value,
  sub,
  icon,
  trend
}: {
  label: string
  value: string
  sub: string
  icon: any
  trend?: 'optimal' | 'alert' | 'neutral'
}) {
  return (
    <div className={`metric glass ${trend || ''}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <b>{value}</b>
        <small>{sub}</small>
      </div>
    </div>
  )
}
