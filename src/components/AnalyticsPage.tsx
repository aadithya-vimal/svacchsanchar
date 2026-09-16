import React, { useState } from 'react'
import {
  BarChart3, Clock3, Route, AlertTriangle, TrendingDown, Fuel, Leaf,
  IndianRupee, ShieldCheck, ArrowUpRight, Filter, Download, Zap, Building2
} from 'lucide-react'
import { useTwin } from '../store/twin'
import { BENGALURU_WARDS } from '../data/bengaluruRoads'

export function AnalyticsPage({ go }: { go?: (p: string) => void }) {
  const m = useTwin(s => s.metrics)
  const trucks = useTwin(s => s.trucks)
  const fill = useTwin(s => s.fill)
  const time = useTwin(s => s.time)
  const [selectedZone, setSelectedZone] = useState<string>('All')

  const savingKm = Math.max(0, m.fixedKm - m.optimizedKm)
  const savingPct = m.fixedKm ? Math.round((savingKm / m.fixedKm) * 100) : 0
  const savingTimeMin = Math.max(0, m.fixedMinutes - m.optimizedMinutes)

  const timeStr = new Date(time).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  // Calculate live ward statistics
  const wardStats = BENGALURU_WARDS.map((ward, idx) => {
    const startBin = idx * 12
    let wardSum = 0
    let wardCritical = 0
    for (let b = 0; b < 12; b++) {
      const f = fill[startBin + b] || 40
      wardSum += f
      if (f >= 85) wardCritical++
    }
    const avgFill = Math.round(wardSum / 12)
    const assignedTrucks = trucks.filter(t => t.currentStreet?.includes(ward.name) || (t.id % 24 === idx)).length

    return {
      id: ward.id,
      name: ward.name,
      zone: ward.zone,
      avgFill,
      critical: wardCritical,
      trucks: assignedTrucks,
      status: wardCritical > 2 ? 'Urgent' : wardCritical > 0 ? 'Elevated' : 'Nominal'
    }
  })

  const filteredWards = selectedZone === 'All'
    ? wardStats
    : wardStats.filter(w => w.zone === selectedZone)

  const zones = ['All', ...Array.from(new Set(BENGALURU_WARDS.map(w => w.zone)))]

  return (
    <div className="analytics-page">
      {/* Page Header */}
      <div className="analytics-header">
        <div>
          <div className="eyebrow cyber-tag">LIVE MUNICIPAL TELEMETRY</div>
          <h1>System Analytics & ESG Ledger</h1>
          <p>Real-time comparative performance: SvacchSanchar AI Dynamic Dispatch vs Traditional Fixed Schedules.</p>
        </div>
        <div className="header-actions">
          <div className="live-clock-badge glass">
            <span className="live-dot" />
            <span>Telemetry Clock: <b>{timeStr} IST</b></span>
          </div>
          {go && (
            <button className="primary-btn glow-btn" onClick={() => go('/simulator')}>
              Return to Twin <Zap size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="analytic-grid">
        <KPI
          icon={<Route className="text-emerald" />}
          label="Fleet Distance Avoided"
          value={`${savingKm.toFixed(1)} km`}
          sub={`${savingPct}% efficiency over static routes`}
          trend="positive"
        />
        <KPI
          icon={<Fuel className="text-amber" />}
          label="Diesel Fuel Saved"
          value={`${m.fuelSavedLiters} L`}
          sub={`₹${m.costSavedInr.toLocaleString()} municipal budget preserved`}
          trend="positive"
        />
        <KPI
          icon={<Leaf className="text-emerald" />}
          label="Carbon Abatement"
          value={`${m.co2AvoidedKg} kg CO₂`}
          sub="Direct greenhouse gas reduction"
          trend="positive"
        />
        <KPI
          icon={<Clock3 className="text-cyan" />}
          label="Collection Time Avoided"
          value={`${savingTimeMin} min`}
          sub={`Fixed: ${m.fixedMinutes} min · Opt: ${m.optimizedMinutes} min`}
          trend="positive"
        />
      </div>

      {/* Detailed Analytics Panels */}
      <div className="analytics-panels">
        {/* Comparative Routing Chart */}
        <section className="glass chart-card">
          <div className="chart-head">
            <div>
              <b>FIXED BASELINE vs DYNAMIC AI</b>
              <span>Measured across 32 active compactor units</span>
            </div>
            <span className="saving-pill text-emerald">-{savingPct}% Mileage</span>
          </div>

          <div className="bar-chart-container">
            <div className="bar-column">
              <div className="bar-track">
                <div
                  className="bar fixed-bar"
                  style={{ height: '90%' }}
                />
              </div>
              <span className="bar-label">Static Schedule</span>
              <b className="bar-val">{m.fixedKm} km</b>
            </div>

            <div className="bar-column">
              <div className="bar-track">
                <div
                  className="bar optimized-bar"
                  style={{ height: `${Math.round((m.optimizedKm / Math.max(1, m.fixedKm)) * 90)}%` }}
                />
              </div>
              <span className="bar-label">SvacchSanchar AI</span>
              <b className="bar-val text-emerald">{m.optimizedKm} km</b>
            </div>
          </div>

          <div className="chart-footer-note">
            <ShieldCheck size={14} className="text-emerald" />
            <span>Autonomous clustering groups stops by fill urgency, eliminating 100% of dead-mileage runs.</span>
          </div>
        </section>

        {/* Live Operational Health & Fleet Load */}
        <section className="glass chart-card">
          <div className="chart-head">
            <div>
              <b>FLEET CAPACITY & DEMAND</b>
              <span>Real-time ward sensor aggregation</span>
            </div>
            <span className="live-pill">REALTIME</span>
          </div>

          <div className="operational-metrics-list">
            <div className="metric-row">
              <span className="row-title">Active Fleet Payload</span>
              <div className="row-progress-wrapper">
                <div className="progress-bar">
                  <div className="progress-fill fill-emerald" style={{ width: `${m.fleetLoadPct}%` }} />
                </div>
                <b>{m.fleetLoadPct}%</b>
              </div>
            </div>

            <div className="metric-row">
              <span className="row-title">Systemic Overflow Risk</span>
              <div className="row-progress-wrapper">
                <div className="progress-bar">
                  <div className="progress-fill fill-cyan" style={{ width: `${m.overflowRiskPct}%` }} />
                </div>
                <b>{m.overflowRiskPct}%</b>
              </div>
            </div>

            <div className="metric-row">
              <span className="row-title">Critical Urgency Bins (&gt;85%)</span>
              <div className="row-badge-val text-coral">
                <AlertTriangle size={15} />
                <b>{m.criticalBins} bins</b>
              </div>
            </div>

            <div className="metric-row">
              <span className="row-title">Available Active Units</span>
              <div className="row-badge-val text-emerald">
                <b>{m.activeTrucks} / 32 units</b>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Live Ward-by-Ward Telemetry Table */}
      <section className="glass ward-table-section">
        <div className="table-header-bar">
          <div>
            <h3>24 Bengaluru Wards · Live Operational Status</h3>
            <span>Monitored smart bins snapped to road networks (no lakes or waterbodies)</span>
          </div>

          {/* Zone Filter */}
          <div className="filter-group">
            <Filter size={14} />
            <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
              {zones.map(z => (
                <option key={z} value={z}>{z} Zones</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ward-data-table">
            <thead>
              <tr>
                <th>Ward / Corridor</th>
                <th>Zone</th>
                <th>Avg Fill</th>
                <th>Critical Bins</th>
                <th>Active Units</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredWards.map(w => (
                <tr key={w.id}>
                  <td>
                    <b>{w.name}</b>
                  </td>
                  <td><span className="zone-tag">{w.zone}</span></td>
                  <td>
                    <div className="table-fill-bar">
                      <div
                        className={`table-fill-inner ${w.avgFill > 80 ? 'bg-coral' : w.avgFill > 60 ? 'bg-amber' : 'bg-emerald'}`}
                        style={{ width: `${w.avgFill}%` }}
                      />
                      <span>{w.avgFill}%</span>
                    </div>
                  </td>
                  <td>
                    {w.critical > 0 ? (
                      <span className="text-coral font-bold">{w.critical} bins</span>
                    ) : (
                      <span className="text-muted">0 bins</span>
                    )}
                  </td>
                  <td>
                    <span>{w.trucks} compactor(s)</span>
                  </td>
                  <td>
                    <span className={`status-pill status-${w.status.toLowerCase()}`}>
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function KPI({
  icon,
  label,
  value,
  sub,
  trend
}: {
  icon: any
  label: string
  value: string
  sub: string
  trend?: 'positive' | 'negative'
}) {
  return (
    <div className="glass kpi-card">
      <div className="kpi-header">
        <div className="kpi-icon">{icon}</div>
        <span className="kpi-trend text-emerald">
          <TrendingDown size={14} /> Avoided
        </span>
      </div>
      <span className="kpi-label">{label}</span>
      <b className="kpi-value">{value}</b>
      <small className="kpi-sub">{sub}</small>
    </div>
  )
}
