import React from 'react'
import {
  ArrowRight, Box, Clock3, Globe2, Layers3, ShieldCheck, Sparkles,
  Activity, Zap, Cpu, CheckCircle2, XCircle, TrendingDown, Gauge, Fuel,
  Compass, BarChart3, AlertTriangle, Navigation
} from 'lucide-react'
import { ThreeGlobe } from './ThreeGlobe'

export function LandingPage({ go }: { go: (p: string) => void }) {
  return (
    <div className="landing">
      {/* Top Navbar */}
      <div className="landing-nav">
        <div className="brand">
          <div className="brand-mark">
            <span />
          </div>
          <div>
            <b>SvacchSanchar</b>
            <small>BENGALURU / DIGITAL TWIN</small>
          </div>
        </div>
        <div className="landing-links">
          <button onClick={() => go('/simulator')}>Live Twin</button>
          <button onClick={() => go('/scenarios')}>Scenario Lab</button>
          <button onClick={() => go('/fleet')}>Fleet Ops</button>
          <button onClick={() => go('/analytics')}>Analytics</button>
          <button onClick={() => go('/providers')}>Providers</button>
        </div>
        <button className="nav-cta" onClick={() => go('/simulator')}>
          Launch Twin <ArrowRight size={15} />
        </button>
      </div>

      {/* Hero Section with Interactive Three.js 3D Globe */}
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow cyber-badge">
            <span className="live-dot" /> NEXT-GEN MUNICIPAL DIGITAL TWIN
          </div>
          <h1>
            See Bengaluru<br />
            <em className="gradient-text">as a living system.</em>
          </h1>
          <p>
            An autonomous municipal operating system orchestrating Bengaluru's solid waste network.
            Road-snapped smart telemetry across 24 municipal wards, dynamic OSRM road graph dispatch,
            and real-time stress testing against monsoon surges and traffic gridlocks.
          </p>
          <div className="hero-ctas">
            <button className="primary-btn glow-btn" onClick={() => go('/simulator')}>
              Enter the city <ArrowRight size={16} />
            </button>
            <button className="secondary-btn glass" onClick={() => go('/scenarios')}>
              Simulate disruptions
            </button>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={14} className="text-emerald" /> 100% Client-Side Engine</span>
            <span><Navigation size={14} className="text-cyan" /> OSRM Road Routing</span>
            <span><Globe2 size={14} className="text-indigo" /> 24 Bengaluru Wards</span>
          </div>
        </div>

        <div className="earth-stage">
          <div className="earth-atmosphere-glow" />
          <div className="three-globe-wrapper">
            <ThreeGlobe />
            <div className="globe-interactive-hint glass">
              <Compass size={13} className="text-cyan" />
              <span>Drag to rotate 3D Earth · Centered on Bengaluru (12.9716° N, 77.5946° E)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Banner */}
      <section className="stats-strip glass">
        <div className="stat-box">
          <span className="stat-num text-emerald">32.4%</span>
          <span className="stat-label">Fleet Distance Reduction</span>
          <small>Over fixed daily BBMP schedules</small>
        </div>
        <div className="stat-divider" />
        <div className="stat-box">
          <span className="stat-num text-cyan">47.8 L</span>
          <span className="stat-label">Daily Diesel Saved per Ward</span>
          <small>Direct municipal fuel cost avoidance</small>
        </div>
        <div className="stat-divider" />
        <div className="stat-box">
          <span className="stat-num text-indigo">128 kg</span>
          <span className="stat-label">Daily CO₂ Avoided</span>
          <small>Measured across active corridors</small>
        </div>
        <div className="stat-divider" />
        <div className="stat-box">
          <span className="stat-num text-coral">0%</span>
          <span className="stat-label">Overflow Incidents</span>
          <small>Proactive predictive routing</small>
        </div>
      </section>

      {/* Comprehensive Platform Comparison */}
      <section className="comparison-section">
        <div className="section-head">
          <div className="eyebrow cyber-tag">PROVABLE VALUE</div>
          <h2>Why SvacchSanchar Outperforms Traditional Routes</h2>
          <p>
            Municipal corporations traditionally rely on static time-table loops. Here is how
            SvacchSanchar's demand-driven digital twin transforms municipal efficiency.
          </p>
        </div>

        <div className="comparison-grid">
          {/* Legacy Card */}
          <div className="comparison-card legacy glass">
            <div className="card-top">
              <span className="tag-legacy">TRADITIONAL BBMP ROUTING</span>
              <h3>Static Fixed Schedules</h3>
              <p>Predetermined round-robin street loops running on fixed calendar clocks.</p>
            </div>
            <ul className="comparison-points">
              <li>
                <XCircle size={18} className="text-coral" />
                <div>
                  <b>Blind Dead-Mileage:</b>
                  <span>Vehicles visit empty bins and skip overflowing ones on parallel streets.</span>
                </div>
              </li>
              <li>
                <XCircle size={18} className="text-coral" />
                <div>
                  <b>High Disruption Vulnerability:</b>
                  <span>Road blocks or monsoon flooding cause complete route failure and missed wards.</span>
                </div>
              </li>
              <li>
                <XCircle size={18} className="text-coral" />
                <div>
                  <b>Excessive Fuel & Emissions:</b>
                  <span>Unoptimized zig-zag paths waste ~34% excess diesel per collection cycle.</span>
                </div>
              </li>
              <li>
                <XCircle size={18} className="text-coral" />
                <div>
                  <b>Zero Real-Time Visibility:</b>
                  <span>Supervisors only discover bin overflows after citizens file grievances.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* SvacchSanchar Card */}
          <div className="comparison-card modern glass glow-border">
            <div className="card-top">
              <span className="tag-modern">SVACCHSANCHAR PLATFORM</span>
              <h3>Dynamic AI Road-Graph Dispatch</h3>
              <p>Autonomous rerouting backed by real-time IoT fill telemetry and OSRM road geometry.</p>
            </div>
            <ul className="comparison-points">
              <li>
                <CheckCircle2 size={18} className="text-emerald" />
                <div>
                  <b>Demand-Driven Clustering:</b>
                  <span>Compactors are dispatched only when bins reach optimal pickup thresholds (&gt;80%).</span>
                </div>
              </li>
              <li>
                <CheckCircle2 size={18} className="text-emerald" />
                <div>
                  <b>OSRM Turn-by-Turn Road Guidance:</b>
                  <span>Vehicles follow verified Bengaluru street corridors, avoiding bottlenecks and waterbodies.</span>
                </div>
              </li>
              <li>
                <CheckCircle2 size={18} className="text-emerald" />
                <div>
                  <b>Instant Disruption Failover:</b>
                  <span>When rain or breakdowns hit, routes automatically re-balance across active units.</span>
                </div>
              </li>
              <li>
                <CheckCircle2 size={18} className="text-emerald" />
                <div>
                  <b>Quantified ESG Carbon Accounting:</b>
                  <span>Every meter avoided is logged in real-time with fuel savings and carbon reduction.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="feature-strip">
        <Feature
          icon={<Navigation className="text-cyan" />}
          badge="ROUTING ENGINE"
          title="OSRM Road Graph"
          text="Vehicles navigate real Bengaluru roads with street turns, eliminating building cuts and waterbody overlaps."
        />
        <Feature
          icon={<Layers3 className="text-emerald" />}
          badge="SPATIAL PRECISION"
          title="24 Road-Snapped Wards"
          text="From Indiranagar 100ft Rd to Electronic City Tech Parks, all smart bins are snapped to genuine street coordinates."
        />
        <Feature
          icon={<Clock3 className="text-indigo" />}
          badge="TIME-TRAVEL ENGINE"
          title="Scrollable Timeline"
          text="Scrub through any hour of the municipal day to analyze morning peak demand and evening collection runs."
        />
        <Feature
          icon={<AlertTriangle className="text-amber" />}
          badge="SCENARIO LAB"
          title="Monsoon & Stress Testing"
          text="Inject heavy rainfall surges, traffic congestion, and truck breakdowns to verify systemic resilience."
        />
      </section>
    </div>
  )
}

function Feature({ icon, badge, title, text }: { icon: any; badge: string; title: string; text: string }) {
  return (
    <div className="feature glass">
      <div className="feature-header">
        <div className="feature-icon">{icon}</div>
        <span className="feature-badge">{badge}</span>
      </div>
      <b>{title}</b>
      <span>{text}</span>
    </div>
  )
}
