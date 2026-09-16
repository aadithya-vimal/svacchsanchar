import React from 'react'
import { ArrowRight, Box, Clock3, Globe2, Layers3, ShieldCheck, Sparkles, Activity, Zap, Cpu } from 'lucide-react'

export function LandingPage({ go }: { go: (p: string) => void }) {
  return (
    <div className="landing">
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
            Simulate waste dynamics in real time across 120,000 municipal bins, orchestrate 512 autonomous fleet units,
            stress the city with disruptions, and unlock up to 34% routing efficiency over static schedules.
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
            <span><ShieldCheck size={14} className="text-emerald" /> 100% Client-side</span>
            <span><Clock3 size={14} className="text-cyan" /> Time-Travel Engine</span>
            <span><Globe2 size={14} className="text-indigo" /> Bengaluru Municipal Twin</span>
          </div>
        </div>

        <div className="earth-stage">
          <div className="earth-atmosphere-glow" />
          <div className="earth-sphere-wrapper">
            <img src="/assets/earth.jpg" alt="Planet Earth focused on Bengaluru and India" className="earth-image" />
            <div className="earth-atmosphere-overlay" />
            
            {/* Bengaluru Telemetry Pin */}
            <div className="bengaluru-hotspot" title="Bengaluru 12.9716° N, 77.5946° E">
              <span className="hotspot-pulse" />
              <span className="hotspot-core" />
              <div className="hotspot-tooltip glass">
                <b>BENGALURU</b>
                <span>120K Bins · Live</span>
              </div>
            </div>

            {/* Orbiting Telemetry Rings */}
            <div className="earth-orbit ring-1" />
            <div className="earth-orbit ring-2" />
          </div>

          <div className="earth-caption glass">
            <div>
              <Sparkles size={15} className="text-emerald" />
              <b>GLOBAL PERSPECTIVE / LOCAL PRECISION</b>
            </div>
            <span>From subcontinental orbital view to individual municipal sensor telemetry in milliseconds.</span>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <Feature
          icon={<Box className="text-cyan" />}
          badge="SPATIAL ENGINE"
          title="2D + 3D Hybrid"
          text="Switch between overhead GIS 2D analytics and photorealistic 3D city terrain with one click."
        />
        <Feature
          icon={<Layers3 className="text-emerald" />}
          badge="SCALE"
          title="120,000 Smart Bins"
          text="Dense municipal-scale synthetic twin with real-time level decay and weather sensitivity."
        />
        <Feature
          icon={<Cpu className="text-indigo" />}
          badge="ROUTING AI"
          title="Dynamic Dispatch"
          text="Heuristic TSP routing engine that prioritizes critical clusters and adapts to fleet breakdowns."
        />
        <Feature
          icon={<Zap className="text-amber" />}
          badge="SCENARIO LAB"
          title="Stress Testing"
          text="Inject monsoon surges, traffic gridlocks, and truck breakdowns to verify systemic resilience."
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
