import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Search, MapPin, Truck as TruckIcon, Trash2, X } from 'lucide-react'
import { zoneNames, zoneCenters, binPosition, BIN_COUNT } from '../data/model'
import type { Truck } from '../data/types'

interface SearchBarProps {
  trucks: Truck[]
  fill: Float32Array
  onNavigate: (target: { lat: number; lon: number; height?: number }) => void
  onSelectBin: (id: number) => void
  onSelectTruck: (id: number) => void
}

export function SearchBar({ trucks, fill, onNavigate, onSelectBin, onSelectTruck }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      const defaultZones = zoneNames.slice(0, 4).map((name, i) => ({
        type: 'zone' as const,
        id: i,
        title: name,
        subtitle: 'Bengaluru Municipal Ward',
        coords: zoneCenters[i]
      }))
      const defaultTrucks = trucks.filter(t => t.status === 'active').slice(0, 3).map(t => ({
        type: 'truck' as const,
        id: t.id,
        title: t.name,
        subtitle: `${t.status.toUpperCase()} · ${Math.round(t.loadKg)}/${t.capacityKg} kg`,
        truck: t
      }))
      return { zones: defaultZones, trucks: defaultTrucks, bins: [] }
    }

    const matchingZones = zoneNames
      .map((name, i) => ({ name, index: i }))
      .filter(z => z.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(z => ({
        type: 'zone' as const,
        id: z.index,
        title: z.name,
        subtitle: 'Bengaluru Municipal Zone',
        coords: zoneCenters[z.index]
      }))

    const matchingTrucks = trucks
      .filter(t => t.name.toLowerCase().includes(q) || t.status.toLowerCase().includes(q) || `#${t.id + 1}`.includes(q))
      .slice(0, 5)
      .map(t => ({
        type: 'truck' as const,
        id: t.id,
        title: t.name,
        subtitle: `${t.status.toUpperCase()} · ${Math.round(t.loadKg)}/${t.capacityKg} kg · ${t.route.length} stops`,
        truck: t
      }))

    const matchingBins: Array<{ type: 'bin'; id: number; title: string; subtitle: string; fillPct: number }> = []
    const binNumMatch = q.match(/\d+/)
    if (binNumMatch) {
      const parsedNum = parseInt(binNumMatch[0], 10)
      const targetId = parsedNum > 0 && parsedNum <= BIN_COUNT ? parsedNum - 1 : null
      if (targetId !== null) {
        matchingBins.push({
          type: 'bin',
          id: targetId,
          title: `BIN-${String(targetId + 1).padStart(6, '0')}`,
          subtitle: `Fill Level: ${Math.round(fill[targetId] || 0)}%`,
          fillPct: Math.round(fill[targetId] || 0)
        })
      }
    } else if (q.includes('crit') || q.includes('full') || q.includes('over')) {
      for (let i = 0; i < fill.length && matchingBins.length < 4; i += 237) {
        if (fill[i] >= 88) {
          matchingBins.push({
            type: 'bin',
            id: i,
            title: `BIN-${String(i + 1).padStart(6, '0')}`,
            subtitle: `Critical ${Math.round(fill[i])}% full`,
            fillPct: Math.round(fill[i])
          })
        }
      }
    }

    return { zones: matchingZones, trucks: matchingTrucks, bins: matchingBins }
  }, [query, trucks, fill])

  const handleSelectZone = (coords: { lat: number; lon: number }) => {
    onNavigate({ lat: coords.lat, lon: coords.lon, height: 4200 })
    setIsOpen(false)
  }

  const handleSelectTruck = (t: Truck) => {
    onSelectTruck(t.id)
    onNavigate({ lat: t.lat, lon: t.lon, height: 1800 })
    setIsOpen(false)
  }

  const handleSelectBin = (binId: number) => {
    onSelectBin(binId)
    const pos = binPosition(binId)
    onNavigate({ lat: pos.lat, lon: pos.lon, height: 1200 })
    setIsOpen(false)
  }

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-input-box glass">
        <Search size={15} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search zones, trucks (SWC-001), or bins..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query ? (
          <button className="search-clear-btn" onClick={() => { setQuery(''); inputRef.current?.focus() }}>
            <X size={13} />
          </button>
        ) : (
          <span className="search-kbd-hint">/</span>
        )}
      </div>

      {isOpen && (
        <div className="search-dropdown glass">
          {results.zones.length > 0 && (
            <div className="search-group">
              <div className="search-group-title">
                <MapPin size={12} /> ZONES & WARDS
              </div>
              {results.zones.map(z => (
                <div
                  key={z.id}
                  className="search-item"
                  onClick={() => handleSelectZone(z.coords)}
                >
                  <div className="item-icon-badge zone"><MapPin size={13} /></div>
                  <div className="item-info">
                    <b>{z.title}</b>
                    <span>{z.subtitle}</span>
                  </div>
                  <span className="item-action-tag">Fly to</span>
                </div>
              ))}
            </div>
          )}

          {results.trucks.length > 0 && (
            <div className="search-group">
              <div className="search-group-title">
                <TruckIcon size={12} /> FLEET VEHICLES
              </div>
              {results.trucks.map(t => (
                <div
                  key={t.id}
                  className="search-item"
                  onClick={() => handleSelectTruck(t.truck)}
                >
                  <div className={`item-icon-badge truck ${t.truck.status}`}><TruckIcon size={13} /></div>
                  <div className="item-info">
                    <b>{t.title}</b>
                    <span>{t.subtitle}</span>
                  </div>
                  <span className="item-action-tag">Locate</span>
                </div>
              ))}
            </div>
          )}

          {results.bins.length > 0 && (
            <div className="search-group">
              <div className="search-group-title">
                <Trash2 size={12} /> SMART BINS
              </div>
              {results.bins.map(b => (
                <div
                  key={b.id}
                  className="search-item"
                  onClick={() => handleSelectBin(b.id)}
                >
                  <div className={`item-icon-badge bin ${b.fillPct >= 90 ? 'critical' : b.fillPct >= 70 ? 'warning' : 'ok'}`}>
                    <Trash2 size={13} />
                  </div>
                  <div className="item-info">
                    <b>{b.title}</b>
                    <span>{b.subtitle}</span>
                  </div>
                  <span className="item-action-tag">Inspect</span>
                </div>
              ))}
            </div>
          )}

          {results.zones.length === 0 && results.trucks.length === 0 && results.bins.length === 0 && (
            <div className="search-empty">
              <span>No matching locations or vehicles found.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
