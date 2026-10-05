import { useEffect, useRef, useState } from 'react'
import brand from '../brand-palette.json'

export type StructureView = 'overview' | 'pocket' | 'surface' | 'overlay'
type Selection = Record<string, unknown>
type Atom = { resn?: string; resi?: number; atom?: string; chain?: string; x: number; y: number; z: number }
interface Viewer {
  addModel(data: string, format: string): unknown
  setStyle(selection: Selection, style: Selection): void
  addStyle(selection: Selection, style: Selection): void
  addSurface(type: number, style: Selection, visible: Selection, context: Selection): Promise<unknown>
  removeAllSurfaces(): void
  removeAllLabels(): void
  addLabel(label: string, style: Selection): unknown
  setClickable(selection: Selection, clickable: boolean, callback: (atom: Atom) => void): void
  zoomTo(selection?: Selection): void
  zoom(factor: number): void
  rotate(degrees: number, axis: string): void
  spin(axis: string | boolean, speed?: number): void
  render(): void
  resize(): void
  clear(): void
}
interface Library { createViewer(element: HTMLElement, settings: Selection): Viewer; setSyncSurface(sync: boolean): void; SurfaceType: { MS: number } }
const palette = brand as unknown as Record<string, string>
const primary = palette.primary || '#2563A6'
let libraryPromise: Promise<Library> | undefined
function loadLibrary() {
  if (!libraryPromise) libraryPromise = new Promise<Library>((resolve, reject) => {
    const getLibrary = () => (window as unknown as { $3Dmol?: Library }).$3Dmol
    const existing = getLibrary()
    if (existing) { resolve(existing); return }
    const script = document.createElement('script')
    script.src = 'vendor/3Dmol-min.js'
    script.onload = () => { const library = getLibrary(); if (library) resolve(library); else reject(new Error('3D viewer unavailable')) }
    script.onerror = () => reject(new Error('Local 3D viewer could not be loaded'))
    document.head.appendChild(script)
  })
  return libraryPromise
}
const labels: Record<StructureView, string> = { overview: 'Protein', pocket: 'ATP pocket', surface: 'Surface', overlay: 'Apo / ATP-bound' }
const descriptions: Record<StructureView, string> = {
  overview: 'Human CDK2 with bound ATP. Protein ribbon and ligand coordinates from the experimental crystal structure 1HCK.',
  pocket: 'Residues with an atom within 5 Å of ATP. The pocket is selected from the experimental coordinates of 1HCK.',
  surface: 'Molecular surface around ATP in 1HCK. This shows local geometry; it is not an electrostatic field map.',
  overlay: 'Static crystal structures: ATP-bound 1HCK in blue and apo 1HCL in copper, aligned by Cα atoms. This comparison is not a molecular dynamics trajectory.',
}
function poster(view: StructureView) {
  return view === 'overview' ? 'figures/cdk2-atp-overview-blue.png' : view === 'overlay' ? 'figures/cdk2-apo-atp-overlay-blue.png' : `figures/cdk2-pocket-${view === 'pocket' ? 'geometry' : 'surface'}-blue.png`
}
export function MolecularViewer({ initialView = 'overview', hero = false, ...props }: { initialView?: StructureView; hero?: boolean; [key: string]: unknown }) {
  const host = useRef<HTMLDivElement>(null)
  const viewer = useRef<Viewer | null>(null)
  const library = useRef<Library | null>(null)
  const [available, setAvailable] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const [view, setView] = useState<StructureView>(initialView)
  const [reset, setReset] = useState(0)
  const [picked, setPicked] = useState('')
  const [rotating, setRotating] = useState(() => { try { return localStorage.getItem('pocketlens-structure-rotation') !== 'paused' } catch { return true } })
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(!document.hidden)
  const spinning = status === 'ready' && rotating && !reduced && visible
  const isHero = hero || props.variant === 'hero' || props.compact === true
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const motion = () => setReduced(media.matches)
    const visibility = () => setVisible(!document.hidden)
    media.addEventListener('change', motion); document.addEventListener('visibilitychange', visibility)
    return () => { media.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    let active = true
    let observer: ResizeObserver | undefined
    let instance: Viewer | undefined
    const controller = new AbortController()
    const element = host.current
    if (!element) return
    async function initialize() {
      try {
        const probe = document.createElement('canvas')
        const gl = probe.getContext('webgl2') || probe.getContext('webgl')
        if (!gl) throw new Error('WebGL unavailable')
        gl.getExtension('WEBGL_lose_context')?.loseContext()
        const [lib, holo, apo] = await Promise.all([loadLibrary(), fetch('structures/cdk2-atp.pdb', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Structure missing'); return r.text() }), fetch('structures/cdk2-apo-aligned.pdb', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Structure missing'); return r.text() })])
        if (!active || !element) return
        lib.setSyncSurface(true)
        instance = lib.createViewer(element, { backgroundColor: '#ffffff', antialias: true })
        instance.addModel(holo, 'pdb'); instance.addModel(apo, 'pdb')
        viewer.current = instance; library.current = lib
        observer = new ResizeObserver(() => { if (active) { instance?.resize(); instance?.render() } })
        observer.observe(element)
        setAvailable(true)
      } catch { if (active) setStatus('fallback') }
    }
    void initialize()
    return () => {
      active = false; controller.abort(); observer?.disconnect(); instance?.spin(false); instance?.clear()
      for (const canvas of element.querySelectorAll('canvas')) { const gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); gl?.getExtension('WEBGL_lose_context')?.loseContext() }
      element.replaceChildren(); viewer.current = null; library.current = null
    }
  }, [])
  useEffect(() => {
    if (!available || !viewer.current || !library.current) return
    let active = true
    const v = viewer.current; const lib = library.current
    const protein = { model: 0, chain: 'A', hetflag: false }
    const ligand = { model: 0, chain: 'A', resn: 'ATP' }
    const pocket = { ...protein, within: { distance: 5, sel: ligand }, byres: true }
    async function scene() {
      try {
        setStatus('loading'); setPicked(''); v.spin(false); v.removeAllSurfaces(); v.removeAllLabels(); v.setStyle({}, {})
        v.setStyle(protein, { cartoon: { color: primary, opacity: view === 'pocket' || view === 'surface' ? 0.35 : 1 } })
        v.setStyle(ligand, { stick: { radius: 0.2, colorscheme: 'orangeCarbon' }, sphere: { scale: 0.23, colorscheme: 'orangeCarbon' } })
        v.setStyle({ model: 0, resn: 'MG' }, { sphere: { radius: 0.5, color: '#669B6B' } })
        if (view === 'pocket') v.addStyle(pocket, { stick: { radius: 0.12, colorscheme: 'cyanCarbon' } })
        if (view === 'surface') await v.addSurface(lib.SurfaceType.MS, { color: primary, opacity: 0.62 }, pocket, protein)
        if (view === 'overlay') v.setStyle({ model: 1, chain: 'A', hetflag: false }, { cartoon: { color: '#BA836B', opacity: 0.7 } })
        if (!active) return
        v.setClickable({ model: view === 'overlay' ? [0, 1] : 0 }, true, atom => {
          const label = `${atom.resn ?? ''} ${atom.resi ?? ''} · ${atom.atom ?? ''} · chain ${atom.chain ?? ''}`
          v.removeAllLabels(); v.addLabel(label, { position: atom, fontColor: primary, backgroundColor: '#ffffff', backgroundOpacity: 0.92, fontSize: 12 }); v.render(); setPicked(label)
        })
        v.zoomTo(view === 'pocket' || view === 'surface' ? pocket : protein); v.zoom(0.92); v.resize(); v.render(); setStatus('ready')
        v.spin(rotating && !reduced && !document.hidden ? 'y' : false, 0.22)
      } catch { if (active) setStatus('fallback') }
    }
    void scene()
    return () => { active = false; v.spin(false) }
  }, [available, view, reset])
  useEffect(() => { viewer.current?.spin(spinning ? 'y' : false, 0.22) }, [spinning])
  useEffect(() => { try { localStorage.setItem('pocketlens-structure-rotation', rotating ? 'rotating' : 'paused') } catch { /* Preference storage is optional. */ } }, [rotating])
  const move = (factor: number) => { viewer.current?.zoom(factor); viewer.current?.render() }
  return <section className={`molecular-viewer ${isHero ? 'molecular-viewer-hero' : ''}`} data-status={status} data-view={view} data-spinning={spinning} aria-label="Interactive experimental CDK2 structure">
    <div className="molecular-heading"><span>EXPLORE A REAL STRUCTURE</span><span>Human CDK2 · ATP</span></div>
    <div className="molecular-stage">
      <div ref={host} className="molecular-canvas" role="img" tabIndex={0} aria-label="Interactive CDK2 structure. Drag to rotate, scroll to zoom, or use arrow keys." onPointerDown={() => setRotating(false)} onKeyDown={event => {
        const directions: Record<string, [number, string]> = { ArrowLeft: [-6, 'vy'], ArrowRight: [6, 'vy'], ArrowUp: [-6, 'vx'], ArrowDown: [6, 'vx'] }
        const direction = directions[event.key]; if (direction && status === 'ready') { event.preventDefault(); setRotating(false); viewer.current?.rotate(direction[0], direction[1]); viewer.current?.render() }
      }} />
      {status !== 'ready' && <img className="molecular-poster" src={poster(view)} alt="PyMOL rendering of the experimental CDK2 structure" />}
      {status !== 'ready' && <span className="molecular-state-label">{status === 'loading' ? 'Preparing 3D view' : 'Static structure · 3D unavailable on this device'}</span>}
    </div>
    <div className="molecular-view-controls" aria-label="Structure view">{(Object.keys(labels) as StructureView[]).map(item => <button key={item} type="button" disabled={status !== 'ready'} aria-pressed={view === item} onClick={() => setView(item)}>{labels[item]}</button>)}</div>
    <div className="molecular-tools">
      <button type="button" disabled={status !== 'ready'} aria-label="Zoom in" onClick={() => move(1.2)}>＋</button>
      <button type="button" disabled={status !== 'ready'} aria-label="Zoom out" onClick={() => move(1 / 1.2)}>−</button>
      <button type="button" disabled={status !== 'ready'} onClick={() => setReset(value => value + 1)}>Reset view</button>
      <button type="button" disabled={status !== 'ready' || reduced} aria-pressed={rotating && !reduced} onClick={() => setRotating(value => !value)}>{spinning ? 'Pause rotation' : 'Auto-rotate'}</button>
      <span>{reduced ? 'Reduced motion enabled' : 'Drag to rotate · scroll to zoom'}</span>
    </div>
    <div className="molecular-caption"><p>{descriptions[view]}</p>{picked && <p aria-live="polite">{picked}</p>}<p className="molecular-motion-note">Rotation changes the viewpoint; atoms retain their experimental coordinates.</p><p><a href="https://www.rcsb.org/structure/1HCK" target="_blank" rel="noreferrer">PDB 1HCK</a> · <a href="https://www.rcsb.org/structure/1HCL" target="_blank" rel="noreferrer">PDB 1HCL</a> · <a href="structures/provenance.json">Coordinate provenance</a> · <a href="vendor/3Dmol-LICENSE.txt">3Dmol.js</a></p></div>
  </section>
}
