import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, Clock3, Eye, Flame, Layers3, Map,
  Pause, Play, RotateCcw, Settings, SlidersHorizontal, Truck, Zap,
  Navigation, Crosshair, Fuel, Leaf, ChevronDown, ChevronUp, Terminal,
  Radio, CheckCircle2, X, Info
} from 'lucide-react'
import { useTwin } from '../store/twin'
import { useProviders } from '../store/providers'
import { CesiumWorld } from './CesiumWorld'
import { ProviderPanel } from './ProviderPanel'
import { SearchBar } from './SearchBar'
import { SpeedSelect } from './SpeedSelect'
import { BENGALURU_WARDS } from '../data/bengaluruRoads'
import type { MapStyle } from '../data/types'

export function SimulatorPage({ go }: { go: (p: string) => void }) {
  const s = useTwin()
  const p = useProviders()
  const [panel, setPanel] = useState<'none' | 'providers' | 'layers'>('none')
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lon: number; height?: number } | null>(null)
  const [showLogs, setShowLogs] = useState(true)
  const [mobileTab, setMobileTab] = useState<'map' | 'kpis' | 'logs' | 'controls'>('map')
  const [locateStatus, setLocateStatus] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme
    const dark = s.theme === 'dark' || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }, [s.theme])

  // Simulation clock ticker
  useEffect(() => {
    if (!s.playing) return
    const t = window.setInterval(() => s.step(0.015 * s.speed), 1000)
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
    ['streets', 'OSM Streets'],
    ['satellite', 'Satellite'],
    ['dark', 'Dark Cyber'],
    ['light', 'Light Clean']
  ]

  const focused = s.selectedBin != null ? s.selectedBin : null
  const focusedBins = useMemo(() => (focused != null ? [focused] : []), [focused])

  const handleSelectBin = (id: number) => {
    s.selectBin(id)
  }

  const handleSelectTruck = (id: number) => {
    s.selectTruck(id)
  }

  // Locate Feature (Uses true browser live location coordinates)
  const handleLocateMe = () => {
    setLocateStatus('Locating...')
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude
            const lon = pos.coords.longitude
            // Fly directly to user's real live location!
            setFlyToTarget({ lat, lon, height: 1600 })
            setLocateStatus('Live GPS Locked')
            setTimeout(() => setLocateStatus(null), 3500)
          },
          (err) => {
            // If user denies permission, policy blocks, or browser fails, center smoothly on Bengaluru city core
            console.warn('Geolocation unavailable, falling back to Bengaluru Core:', err?.message)
            setFlyToTarget({ lat: 12.9716, lon: 77.5946, height: 2400 })
            setLocateStatus('Centered on City')
            setTimeout(() => setLocateStatus(null), 3000)
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        )
      } else {
        setFlyToTarget({ lat: 12.9716, lon: 77.5946, height: 2400 })
        setLocateStatus('Bengaluru Core')
        setTimeout(() => setLocateStatus(null), 2500)
      }
    } catch (e) {
      setFlyToTarget({ lat: 12.9716, lon: 77.5946, height: 2400 })
      setLocateStatus('Bengaluru Core')
      setTimeout(() => setLocateStatus(null), 2500)
    }
  }

  // Scrubbable Timeline Handler
  const handleTimelineScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutesFromMidnight = Number(e.target.value)
    const base = new Date(s.time)
    base.setHours(0, 0, 0, 0)
    const targetTime = base.getTime() + minutesFromMidnight * 60000
    s.seekTime(targetTime)
  }

  const currentMinutesFromMidnight = d.getHours() * 60 + d.getMinutes()

  return (
    <div className="sim-page">
      {/* 3D WebGL Cesium Map Canvas */}
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

      {/* Top Bar with Brand, Search, Locate, Clock, and Quick Actions */}
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

        {/* Locate Me Button */}
        <button
          className="locate-btn glass"
          onClick={handleLocateMe}
          title="Fly to your live real-time GPS location"
        >
          <Crosshair size={15} className="text-cyan" />
          <span className="hide-on-mobile">{locateStatus || 'Live Location'}</span>
        </button>

        {/* Live Simulation Clock & Speed Badge */}
        <div className="clock-chip">
          <span className="live-dot" />
          <b>{timeText}</b>
          <span className="speed-chip-badge">{s.speed}×</span>
        </div>

        {/* Top Controls */}
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

      {/* 2D / 3D Mode Switcher (Centered Top) */}
      <div className="mode-switch glass">
        <button
          className={s.view === '2d' ? 'active' : ''}
          onClick={() => s.setView('2d')}
        >
          <Map size={14} />2D OSM
        </button>
        <button
          className={s.view === '3d' ? 'active' : ''}
          onClick={() => s.setView('3d')}
        >
          <Eye size={14} />3D City
        </button>
      </div>

      {/* Prominent Active Scenario Disruption Banner with Direct Exit Controls */}
      {s.events.length > 0 && (
        <div className="active-scenario-banner glass">
          <div className="banner-left">
            <Flame size={16} className="text-coral" />
            <div className="banner-text">
              <b>STRESS SCENARIO ACTIVE: {s.events[0].title}</b>
              <span>
                {Math.round(s.events[0].intensity * 100)}% severity · {s.events.length} disruption{s.events.length > 1 ? 's' : ''} active
              </span>
            </div>
          </div>
          <div className="banner-actions">
            <button
              className="exit-scenario-btn"
              onClick={() => s.removeScenario(s.events[0].id)}
              title="Exit this disruption scenario"
            >
              <X size={14} /> Exit Scenario
            </button>
            <button
              className="manage-scenario-btn"
              onClick={() => go('/scenarios')}
              title="Open Scenario Lab"
            >
              Stress Lab →
            </button>
          </div>
        </div>
      )}

      {/* Main HUD Overlay Container (Zero Overlapping Cards) */}
      <div className="sim-hud-container">
        {/* Left Column: Cockpit Controls & Quick Corridor Navigator */}
        <aside className={`hud-column hud-left ${mobileTab === 'controls' ? 'mobile-visible' : ''}`}>
          <div className="glass cockpit-card">
            <div className="eyebrow cyber-tag">CITY OPS / 24 WARDS</div>
            <h3>Autonomous Dispatch</h3>
            <p>Real-time OSRM road graph balancing 288 smart bins across Bengaluru.</p>

            <div className="cockpit-actions">
              <button
                className={`primary-btn ${s.playing ? 'active-run-btn' : 'glow-btn'}`}
                onClick={() => s.togglePlaying()}
              >
                {s.playing ? <Pause size={15} /> : <Play size={15} />}
                {s.playing ? 'Pause Engine' : 'Run Simulation'}
              </button>
              <button className="secondary-btn glass" onClick={() => go('/scenarios')}>
                <Flame size={15} className="text-coral" /> Stress Lab
              </button>
            </div>

            {/* Quick Corridor Selector */}
            <div className="ward-quick-chips">
              <span className="chip-label">Quick Jump:</span>
              <button onClick={() => setFlyToTarget({ lat: 12.9755, lon: 77.6066, height: 1600 })}>MG Rd</button>
              <button onClick={() => setFlyToTarget({ lat: 12.9340, lon: 77.6250, height: 1600 })}>Koramangala</button>
              <button onClick={() => setFlyToTarget({ lat: 12.9784, lon: 77.6408, height: 1600 })}>Indiranagar</button>
              <button onClick={() => setFlyToTarget({ lat: 12.9860, lon: 77.7290, height: 1800 })}>Whitefield</button>
              <button onClick={() => setFlyToTarget({ lat: 12.9165, lon: 77.6515, height: 1600 })}>HSR</button>
            </div>
          </div>


          {/* Basemap Switcher Card */}
          <div className="glass map-switcher-card">
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
          </div>
        </aside>

        {/* Right Column: Live Telemetry Rail & AI Decision Log */}
        <aside className={`hud-column hud-right ${mobileTab === 'kpis' || mobileTab === 'logs' ? 'mobile-visible' : ''}`}>
          {/* Real-time KPI Cards */}
          <div className="metrics-grid">
            <Metric
              label="OPTIMIZED ROUTE"
              value={`${s.metrics.optimizedKm} km`}
              sub={`vs ${s.metrics.fixedKm} km static`}
              icon={<Zap size={14} className="text-emerald" />}
              trend="optimal"
            />
            <Metric
              label="ROUTE TIME"
              value={`${s.metrics.optimizedMinutes} min`}
              sub={`vs ${s.metrics.fixedMinutes} min static`}
              icon={<Clock3 size={14} className="text-cyan" />}
              trend="optimal"
            />
            <Metric
              label="DIESEL SAVED"
              value={`${s.metrics.fuelSavedLiters} L`}
              sub={`₹${s.metrics.costSavedInr.toLocaleString()} saved`}
              icon={<Fuel size={14} className="text-amber" />}
              trend="optimal"
            />
            <Metric
              label="CO₂ AVOIDED"
              value={`${s.metrics.co2AvoidedKg} kg`}
              sub="Direct ESG reduction"
              icon={<Leaf size={14} className="text-emerald" />}
              trend="optimal"
            />
          </div>

          {/* Live AI Decision Log & Operational Audit Trail */}
          <div className="glass audit-log-card">
            <div className="audit-head">
              <div className="audit-title">
                <Terminal size={14} className="text-emerald" />
                <b>AI DECISION STREAM</b>
                <span className="live-pill">LIVE</span>
              </div>
              <button
                className="toggle-log-btn"
                onClick={() => setShowLogs(!showLogs)}
                title="Collapse or expand decision log"
              >
                {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showLogs && (
              <div className="audit-stream">
                {s.auditLogs.map((log) => (
                  <div key={log.id} className={`log-item log-${log.type}`}>
                    <div className="log-meta">
                      <span className="log-time">{log.time}</span>
                      <span className="log-truck">{log.truckName}</span>
                      <span className="log-zone">{log.zoneName}</span>
                    </div>
                    <div className="log-action">{log.action}</div>
                    <div className="log-rationale">{log.rationale}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Tab Bar Switcher (< 768px) */}
      <div className="mobile-hud-bar glass">
        <button className={mobileTab === 'map' ? 'active' : ''} onClick={() => setMobileTab('map')}>
          <Map size={16} /> Map
        </button>
        <button className={mobileTab === 'kpis' ? 'active' : ''} onClick={() => setMobileTab('kpis')}>
          <Zap size={16} /> KPIs
        </button>
        <button className={mobileTab === 'logs' ? 'active' : ''} onClick={() => setMobileTab('logs')}>
          <Terminal size={16} /> Decision Log
        </button>
        <button className={mobileTab === 'controls' ? 'active' : ''} onClick={() => setMobileTab('controls')}>
          <SlidersHorizontal size={16} /> Controls
        </button>
      </div>

      {/* Bottom Floating Timeline Dock with Scrubbable Scrubber */}
      <div className="sim-bottom-dock">
        {/* Navigation Dock */}
        <nav className="sim-nav glass">
          <button onClick={() => go('/simulator')} className="active" title="Live Twin">
            <Activity size={14} className="text-emerald" /><span>Twin</span>
          </button>
          <button onClick={() => go('/fleet')} title="Fleet Operations">
            <Truck size={14} className="text-cyan" /><span>Fleet</span>
          </button>
          <button onClick={() => go('/scenarios')} title="Scenario Lab">
            <Flame size={14} className="text-coral" /><span>Scenarios</span>
          </button>
          <button onClick={() => go('/analytics')} title="Live Analytics">
            <SlidersHorizontal size={14} className="text-indigo" /><span>Analytics</span>
          </button>
        </nav>

        {/* Scrollable & Scrubbable Timeline Scrubber */}
        <div className="timeline-scrubber glass">
          <button className="time-step-btn" onClick={() => s.rewind(1)} title="Rewind 1 Hour">
            ↶ -1h
          </button>

          <div className="scrubber-main">
            <div className="scrubber-labels">
              <span className="scrubber-clock">
                <Clock3 size={13} className="text-cyan" />
                <b>{d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')} IST</b>
              </span>
              <span className="scrubber-hint hide-on-mobile">Drag slider or wheel-scroll to travel time</span>
            </div>

            <input
              type="range"
              min="360"
              max="1260"
              step="5"
              value={currentMinutesFromMidnight}
              onChange={handleTimelineScrub}
              className="time-slider"
              title="Drag to travel through time (06:00 to 21:00)"
            />
          </div>

          {/* Custom UI Speed Dropdown */}
          <SpeedSelect currentSpeed={s.speed} onSelectSpeed={s.setSpeed} />

          <button className="time-step-btn" onClick={() => s.step(1)} title="Fast-forward 1 Hour">
            +1h ↷
          </button>
        </div>
      </div>

      {/* Settings / Providers Drawer */}
      {panel === 'providers' && (
        <ProviderPanel onClose={() => setPanel('none')} />
      )}
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
    <div className={`metric-card glass trend-${trend || 'neutral'}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <b className="metric-value">{value}</b>
      <small className="metric-sub">{sub}</small>
    </div>
  )
}
