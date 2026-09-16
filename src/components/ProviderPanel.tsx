import React, { useState } from 'react'
import { KeyRound, ExternalLink, Trash2, CheckCircle2, MapPinned, Box, Route, ShieldAlert, Sparkles } from 'lucide-react'
import { useProviders } from '../store/providers'

const rows = [
  { key: 'googleMapsKey', name: 'Google Maps Platform', cap: 'Photorealistic 3D Tiles', url: 'https://developers.google.com/maps/documentation/tile/get-api-key', icon: Box, note: 'Requires billing; browser key can be restricted to your deployment origin.' },
  { key: 'cesiumIonToken', name: 'Cesium ion', cap: 'World terrain / hosted assets', url: 'https://ion.cesium.com/tokens', icon: Box, note: 'Use a least-privilege token; limits and eligibility depend on your ion account.' },
  { key: 'mapTilerKey', name: 'MapTiler', cap: 'Streets + satellite base maps', url: 'https://cloud.maptiler.com/account/keys/', icon: MapPinned, note: 'Frontend keys should be protected with provider-side restrictions.' },
  { key: 'mapboxToken', name: 'Mapbox', cap: 'Streets + satellite base maps', url: 'https://account.mapbox.com/access-tokens/', icon: MapPinned, note: 'Use a public token with minimal scopes for client-side maps.' },
  { key: 'stadiaKey', name: 'Stadia Maps', cap: 'Smooth / dark / satellite base maps', url: 'https://client.stadiamaps.com/', icon: MapPinned, note: 'Domain-based authentication is available for production websites.' },
  { key: 'hereApiKey', name: 'HERE', cap: 'Optional route validation / traffic', url: 'https://platform.here.com/', icon: Route, note: 'Optional validation connector; core optimizer stays local.' },
  { key: 'tomtomApiKey', name: 'TomTom', cap: 'Optional live traffic layer', url: 'https://developer.tomtom.com/', icon: Route, note: 'Optional traffic connector; simulation remains fully local.' },
  { key: 'openRouteServiceKey', name: 'openrouteservice', cap: 'Optional external route validation', url: 'https://openrouteservice.org/dev/#/signup', icon: Route, note: 'Optional only; never required for the digital twin.' },
]

export function ProviderPanel({ onClose }: { onClose: () => void }) {
  const p = useProviders()
  const [show, setShow] = useState<Record<string, boolean>>({})

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer provider-drawer">
        <div className="drawer-head">
          <div>
            <div className="drawer-kicker cyber-tag">PROVIDER & MAP SETTINGS</div>
            <h2>Credentials</h2>
          </div>
          <button className="close-btn" onClick={onClose} title="Close settings">×</button>
        </div>

        <p className="drawer-copy">
          SvacchSanchar is 100% functional without external credentials. All API tokens are stored strictly in your browser's local storage and never sent to any backend.
        </p>

        <div className="provider-list">
          {rows.map(r => {
            const Icon = r.icon as any
            const val = (p as any)[r.key] as string
            return (
              <div className="provider-row glass" key={r.key}>
                <div className="provider-icon"><Icon size={16} /></div>
                <div className="provider-main">
                  <div className="provider-header">
                    <span className="provider-name">{r.name}</span>
                    <span className="provider-cap">{r.cap}</span>
                  </div>
                  <div className="provider-note">{r.note}</div>
                  <div className="provider-input">
                    <input
                      type={show[r.key] ? 'text' : 'password'}
                      placeholder="Paste your key or token..."
                      value={val || ''}
                      onChange={e => p.set(r.key as any, e.target.value)}
                    />
                    <button
                      type="button"
                      className="show-toggle-btn"
                      onClick={() => setShow(s => ({ ...s, [r.key]: !s[r.key] }))}
                    >
                      {show[r.key] ? 'Hide' : 'Show'}
                    </button>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="provider-link-btn"
                      title="Get token from provider"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  {val && (
                    <div className="configured">
                      <CheckCircle2 size={12} className="text-emerald" /> Configured & stored in local storage
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="drawer-footer">
          <button className="secondary-btn full danger" onClick={p.clear}>
            <Trash2 size={15} /> Clear all stored credentials
          </button>
        </div>
      </aside>
    </>
  )
}
