import React from 'react'
import { Truck, Navigation, AlertOctagon, Wrench, CheckCircle2, Clock, Package } from 'lucide-react'
import { useTwin } from '../store/twin'

const STATUS_COLOR: Record<string, string> = {
  active: '#10b981',
  idle: '#6ee7b7',
  returning: '#f59e0b',
  breakdown: '#ef4444'
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  returning: 'Returning',
  breakdown: 'Breakdown'
}

export function FleetPage() {
  const { trucks, markTruckBroken, repairTruck, selectTruck } = useTwin()

  const active = trucks.filter(t => t.status === 'active').length
  const idle = trucks.filter(t => t.status === 'idle').length
  const returning = trucks.filter(t => t.status === 'returning').length
  const breakdown = trucks.filter(t => t.status === 'breakdown').length

  return (
    <div className="fleet-page">
      <div className="page-title">
        <div>
          <div className="eyebrow darktext">FLEET COMMAND</div>
          <h1>Every vehicle, accounted for.</h1>
          <p>
            {active} truck{active !== 1 ? 's are' : ' is'} actively collecting waste across Bengaluru right now.
          </p>
        </div>
      </div>

      <div className="fleet-summary">
        <div className="glass fleet-stat fleet-stat--active">
          <div className="fleet-stat-icon">
            <Truck size={16} />
          </div>
          <span>ACTIVE</span>
          <b>{active}</b>
        </div>
        <div className="glass fleet-stat fleet-stat--idle">
          <div className="fleet-stat-icon">
            <Clock size={16} />
          </div>
          <span>IDLE</span>
          <b>{idle}</b>
        </div>
        <div className="glass fleet-stat fleet-stat--returning">
          <div className="fleet-stat-icon">
            <Package size={16} />
          </div>
          <span>RETURNING</span>
          <b>{returning}</b>
        </div>
        <div className="glass fleet-stat fleet-stat--breakdown">
          <div className="fleet-stat-icon">
            <AlertOctagon size={16} />
          </div>
          <span>BREAKDOWN</span>
          <b>{breakdown}</b>
        </div>
      </div>

      <div className="fleet-grid">
        {trucks.map(t => {
          const loadPct = Math.max(0, Math.min(100, Math.round((t.loadKg / t.capacityKg) * 100)))
          const barColor = loadPct >= 85 ? '#ef4444' : loadPct >= 60 ? '#f59e0b' : '#10b981'

          return (
            <article className="glass truck-card" key={t.id}>
              <div className="truck-top">
                <div className="truck-icon" style={{ background: `${STATUS_COLOR[t.status]}22`, color: STATUS_COLOR[t.status] }}>
                  <Truck size={17} />
                </div>
                <div className="truck-info">
                  <b>{t.name}</b>
                  <span className="truck-status-pill" style={{ background: `${STATUS_COLOR[t.status]}22`, color: STATUS_COLOR[t.status] }}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                </div>
                <div className="truck-actions">
                  <button onClick={() => selectTruck(t.id)} title="Track on map">
                    <Navigation size={14} />
                  </button>
                  {t.status === 'breakdown' ? (
                    <button onClick={() => repairTruck(t.id)} title="Repair truck" className="btn-repair">
                      <Wrench size={14} />
                    </button>
                  ) : (
                    <button onClick={() => markTruckBroken(t.id)} title="Mark breakdown" className="btn-break">
                      <AlertOctagon size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="truck-bar-wrapper">
                <div className="truck-bar">
                  <div
                    className="truck-bar-fill"
                    style={{ width: `${loadPct}%`, background: barColor }}
                  />
                </div>
              </div>

              <div className="truck-meta">
                <span>{Math.round(t.loadKg)} / {t.capacityKg} kg</span>
                <span>{t.route.length > 0 ? `${t.route.length - t.routeIndex} stops` : 'No route'}</span>
              </div>

              {t.currentStreet && (
                <div className="truck-street">
                  <CheckCircle2 size={10} />
                  <span>{t.currentStreet}</span>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
