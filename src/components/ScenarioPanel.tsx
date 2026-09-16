import React, { useMemo, useState } from 'react'
import {
  Plus, Play, Trash2, Copy, ShieldAlert, Truck, Construction, CloudRain,
  TrendingUp, ArrowRight, CheckCircle2, RotateCcw, Flame, Sparkles
} from 'lucide-react'
import type { ScenarioEvent, ScenarioType } from '../data/types'
import { zoneNames } from '../data/model'
import { useTwin } from '../store/twin'

const options: Array<[ScenarioType, string, any, string]> = [
  ['waste-surge', 'Waste surge', TrendingUp, 'Rapid waste accumulation in commercial or festival hubs'],
  ['overflow-risk', 'Overflow escalation', ShieldAlert, 'Accelerates critical threshold fill across key bins'],
  ['truck-breakdown', 'Truck breakdown', Truck, 'Simulates mechanical failure in active fleet units'],
  ['traffic-slowdown', 'Traffic slowdown', Construction, 'Halves fleet transit velocity in congested corridors'],
  ['road-closure', 'Road closure', Construction, 'Forces vehicles to reroute around closed arterial roads'],
  ['sensor-failure', 'Sensor failure', ShieldAlert, 'Intermittent sensor telemetry dropouts'],
  ['truck-overload', 'Truck overload', Truck, 'Restricts vehicle weight capacity by 25%'],
  ['fleet-reduction', 'Fleet reduction', Truck, 'Grounds 25% of municipal trucks in the sector'],
  ['demand-shift', 'Demand shift', TrendingUp, 'Sudden displacement of collection priority'],
  ['heavy-rain', 'Heavy rain & monsoon', CloudRain, 'Slower transit speeds and increased leachate weight'],
  ['combined', 'Combined disruption', Flame, 'Compound stress: surge + breakdowns + rainfall']
]

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {}
  }
  return 'scen-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
}

export function ScenarioLab({ go }: { go?: (p: string) => void }) {
  const { events, addScenario, removeScenario, time, metrics, playing, setPlaying } = useTwin()
  const [type, setType] = useState<ScenarioType>('waste-surge')
  const [zone, setZone] = useState(1)
  const [intensity, setIntensity] = useState(0.35)
  const [duration, setDuration] = useState(3)
  const [feedback, setFeedback] = useState<string | null>(null)

  const add = () => {
    const title = options.find(o => o[0] === type)?.[1] || type
    addScenario({
      id: generateId(),
      type,
      title,
      startAt: time,
      durationHours: duration,
      intensity,
      targetZone: zone
    })
    setFeedback(`Armed ${title} for ${zoneNames[zone]} (${Math.round(intensity * 100)}% intensity)`)
    setTimeout(() => setFeedback(null), 3500)
  }

  const addCompound = () => {
    addScenario({
      id: generateId(),
      type: 'combined',
      title: 'Morning Monsoon & Gridlock Pack',
      startAt: time,
      durationHours: 4,
      intensity: 0.5,
      targetZone: zone
    })
    setFeedback(`Armed Compound Event for ${zoneNames[zone]}`)
    setTimeout(() => setFeedback(null), 3500)
  }

  const runAndObserve = () => {
    if (events.length === 0) {
      add()
    }
    setPlaying(true)
    if (go) {
      go('/simulator')
    }
  }

  const preview = useMemo(() => ({
    before: metrics.optimizedKm,
    after: Number((metrics.optimizedKm * (1 + intensity * 0.22)).toFixed(1)),
    riskBefore: metrics.overflowRiskPct,
    riskAfter: Math.min(100, Math.round(metrics.overflowRiskPct * (1 + intensity * 0.34)))
  }), [metrics, intensity])

  return (
    <div className="lab-page">
      <div className="page-title">
        <div>
          <div className="eyebrow cyber-tag">SCENARIO & DISRUPTION LAB</div>
          <h1>Stress the city.</h1>
          <p>
            Inject realistic municipal anomalies, monitor how dynamic dispatch algorithms reconfigure routes, and verify system resilience.
          </p>
        </div>

        <div className="scenario-preview glass">
          <div className="preview-label">
            <Sparkles size={13} className="text-emerald" /> SIMULATED IMPACT PREVIEW
          </div>
          <b>{preview.before} km → <span className="text-coral">{preview.after} km</span></b>
          <small>{preview.riskBefore}% avg fill → <span className="text-amber">{preview.riskAfter}% projected overflow</span></small>
        </div>
      </div>

      {feedback && (
        <div className="feedback-banner glass">
          <CheckCircle2 size={16} className="text-emerald" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="lab-grid">
        {/* Scenario Builder Section */}
        <section className="lab-builder glass">
          <div className="section-title">SELECT DISRUPTION MODEL</div>

          <label>
            Disruption Type
            <div className="option-grid">
              {options.map(([v, l, I]) => (
                <button
                  key={v}
                  type="button"
                  className={type === v ? 'selected' : ''}
                  onClick={() => setType(v)}
                >
                  <I size={15} className={type === v ? 'text-emerald' : 'text-cyan'} />
                  <span>{l}</span>
                </button>
              ))}
            </div>
          </label>

          <div className="two-col">
            <label>
              Target Municipal Ward
              <select value={zone} onChange={e => setZone(Number(e.target.value))}>
                {zoneNames.map((z, i) => (
                  <option key={i} value={i}>
                    {z} ({i + 1})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Duration (Hours)
              <input
                type="number"
                min="0.25"
                max="24"
                step="0.25"
                value={duration}
                onChange={e => setDuration(Math.max(0.25, Number(e.target.value)))}
              />
            </label>
          </div>

          <label>
            Intensity Multiplier
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
            />
            <span className="range-readout">{Math.round(intensity * 100)}% Severity</span>
          </label>

          <div className="builder-actions">
            <button className="primary-btn glow-btn" onClick={add}>
              <Plus size={15} /> Arm disruption event
            </button>
            <button className="secondary-btn glass" onClick={addCompound}>
              <Copy size={15} /> Compound pack
            </button>
            <button className="primary-btn run-now-btn" onClick={runAndObserve}>
              <Play size={15} /> Run & Observe Twin <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* Armed Events Timeline */}
        <section className="lab-events glass">
          <div className="section-header-flex">
            <div className="section-title">ACTIVE / ARMED TIMELINE</div>
            {events.length > 0 && (
              <span className="events-count-tag">{events.length} Armed</span>
            )}
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Play size={18} className="text-emerald" />
              </div>
              <b>No disruptions active</b>
              <span>Arm an event above or hit "Run & Observe" to test systemic resilience.</span>
            </div>
          ) : (
            <div className="event-list">
              {events.map(e => (
                <div className="event-row glass" key={e.id}>
                  <div>
                    <b>{e.title}</b>
                    <span>
                      {zoneNames[e.targetZone || 0]} · {Math.round(e.intensity * 100)}% severity · {e.durationHours}h
                    </span>
                  </div>
                  <button
                    type="button"
                    className="delete-event-btn"
                    onClick={() => removeScenario(e.id)}
                    title="Remove event"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              <div className="timeline-actions">
                <button className="primary-btn full" onClick={runAndObserve}>
                  <Play size={15} /> Simulate All Events In Twin
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
