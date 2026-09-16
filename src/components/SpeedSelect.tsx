import React, { useState, useRef, useEffect } from 'react'
import { Zap, ChevronDown, Check } from 'lucide-react'

interface SpeedSelectProps {
  currentSpeed?: number
  speed?: number
  onSelectSpeed?: (speed: number) => void
  onChange?: (speed: number) => void
}

const speedOptions = [
  { value: 0.5, label: '0.5×', desc: 'Slow motion' },
  { value: 1, label: '1×', desc: 'Realtime' },
  { value: 2, label: '2×', desc: 'Accelerated' },
  { value: 5, label: '5×', desc: 'Fast' },
  { value: 10, label: '10×', desc: 'Ops Speed' },
  { value: 20, label: '20×', desc: 'Rapid' },
  { value: 50, label: '50×', desc: 'Stress Test' },
]

export function SpeedSelect({ currentSpeed, speed, onSelectSpeed, onChange }: SpeedSelectProps) {
  const currentVal = currentSpeed ?? speed ?? 10
  const handleChange = onSelectSpeed ?? onChange ?? (() => {})

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="speed-dropdown-wrapper" ref={ref}>
      <button
        type="button"
        className={`speed-trigger-btn glass ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        title="Simulation Speed Multiplier"
      >
        <Zap size={13} className="speed-icon" />
        <span className="speed-val">{currentVal}×</span>
        <ChevronDown size={13} className={`speed-chevron ${open ? 'rotated' : ''}`} />
      </button>

      {open && (
        <div className="speed-menu glass">
          <div className="speed-menu-header">SIMULATION VELOCITY</div>
          {speedOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`speed-option ${currentVal === opt.value ? 'selected' : ''}`}
              onClick={() => {
                handleChange(opt.value)
                setOpen(false)
              }}
            >
              <span className="speed-opt-label">{opt.label}</span>
              <span className="speed-opt-desc">{opt.desc}</span>
              {currentVal === opt.value && <Check size={14} className="speed-opt-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
