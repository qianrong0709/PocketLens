import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const storageKey = 'pocketlens-background-motion'
const motionQuery = '(prefers-reduced-motion: reduce)'

function savedPreference() {
  try { return localStorage.getItem(storageKey) !== 'paused' } catch { return true }
}

export function AmbientBackdrop() {
  const [enabled, setEnabled] = useState(savedPreference)
  const [reduced, setReduced] = useState(() => window.matchMedia(motionQuery).matches)
  const [visible, setVisible] = useState(() => !document.hidden)
  useEffect(() => {
    const query = window.matchMedia(motionQuery)
    const updatePreference = () => setReduced(query.matches)
    const updateVisibility = () => setVisible(!document.hidden)
    query.addEventListener('change', updatePreference)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      query.removeEventListener('change', updatePreference)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])
  const running = enabled && !reduced && visible
  function toggle() {
    const next = !enabled
    setEnabled(next)
    try { localStorage.setItem(storageKey, next ? 'running' : 'paused') } catch { /* Optional local preference. */ }
  }
  return createPortal(<>
    <div className="ambient-scene" data-motion={running ? 'running' : 'paused'} aria-hidden="true">
      <div className="ambient-light ambient-light-cool" />
      <div className="ambient-light ambient-light-warm" />
      <div className="ambient-shade" />
    </div>
    <button className="ambient-motion-toggle" type="button" onClick={toggle} disabled={reduced}
      aria-label={reduced ? 'Background motion disabled by reduced motion preference' : running ? 'Pause background animation' : 'Play background animation'}
      aria-pressed={running} title={reduced ? 'Following your reduced motion preference' : 'Control decorative background motion'}>
      <span className="motion-state" aria-hidden="true" />
      {reduced ? 'Motion off' : enabled ? 'Pause motion' : 'Play motion'}
    </button>
  </>, document.body)
}
