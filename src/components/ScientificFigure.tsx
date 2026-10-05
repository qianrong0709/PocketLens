type View = 'overview' | 'geometry' | 'fields' | 'dynamics'

const figures: Record<View, { file: string; title: string; alt: string; caption: string; ids: string[] }> = {
  overview: {
    file: 'cdk2-atp-overview-blue.png', title: 'A real pocket, in its protein context',
    alt: 'PyMOL rendering of the experimental human CDK2–ATP complex, with the protein backbone and ATP binding-site residues.',
    caption: 'Human CDK2–ATP crystal structure. The protein is shown as a cartoon; ATP and nearby side chains are shown as sticks. This reference structure illustrates the molecular setting of pocket-based generation.',
    ids: ['1HCK'],
  },
  geometry: {
    file: 'cdk2-pocket-geometry-blue.png', title: 'Atoms and the binding pocket',
    alt: 'Experimental ATP coordinates and surrounding CDK2 residues within 5 angstrom, rendered as atom and bond representations in PyMOL.',
    caption: 'ATP and CDK2 residues within 5 Å of ATP, rendered from experimental coordinates. Protein carbons are cool blue and ATP carbons are gold; oxygen, nitrogen and phosphorus retain element colours.',
    ids: ['1HCK'],
  },
  fields: {
    file: 'cdk2-pocket-surface-blue.png', title: 'The molecular surface around ATP',
    alt: 'Solvent-excluded molecular surface of experimental CDK2 around ATP, coloured by atom type, with ATP shown as sticks.',
    caption: 'A solvent-excluded protein surface, coloured by element, provides a concrete starting point for discussing spatial conditioning. These colours encode atom types. No electrostatic potential or electron-density map is calculated in this illustration.',
    ids: ['1HCK'],
  },
  dynamics: {
    file: 'cdk2-apo-atp-overlay-blue.png', title: 'Apo and ATP-bound structural snapshots',
    alt: 'Superposition of two experimental CDK2 crystal structures: apo in copper and ATP-bound in blue, with ATP in gold.',
    caption: 'Apo CDK2 (copper, 1HCL) and ATP-bound CDK2 (blue, 1HCK), aligned on shared Cα atoms. These are two static crystal structures; their overlay does not establish a motion pathway or a molecular-dynamics trajectory.',
    ids: ['1HCL', '1HCK'],
  },
}

export function ScientificFigure({ variant = 'overview', compact = false }: { variant?: View; compact?: boolean }) {
  const figure = figures[variant]
  return <figure className={`scientific-figure ${compact ? 'scientific-figure-compact' : ''}`} data-structure-view={variant}>
    <a className="structure-image-link" href={`figures/${figure.file}`} target="_blank" rel="noreferrer" aria-label={`Open full-size structure: ${figure.title}`}>
      <img src={`figures/${figure.file}`} width="1600" height="1100" alt={figure.alt} loading={variant === 'overview' ? 'eager' : 'lazy'} />
    </a>
    <figcaption>
      <div className="structure-caption-title">{figure.title}</div>
      {!compact && <p>{figure.caption}</p>}
      <div className="structure-provenance">PyMOL · Experimental X-ray coordinates · {figure.ids.map((id, i) => <span key={id}>{i > 0 && ' / '}<a href={`https://www.rcsb.org/structure/${id}`} target="_blank" rel="noreferrer">PDB {id}</a></span>)}</div>
      {!compact && <div className="structure-credit"><a href="https://doi.org/10.1021/jm960402a" target="_blank" rel="noreferrer">Schulze-Gahmen et al., 1996</a> · <a href="figures/provenance-blue.json" download>Rendering provenance</a></div>}
    </figcaption>
  </figure>
}

export function StructuralGallery() {
  return <section className="structural-gallery" aria-label="Experimental structures behind the three review lenses">
    <ScientificFigure variant="overview" />
    <div className="structure-lenses">
      {(['geometry','fields','dynamics'] as const).map((variant, index) => <article key={variant}>
        <ScientificFigure variant={variant} compact />
        <a className="structure-theme-link" href={`#/review-map?theme=${variant}`}><span>0{index + 1}</span>{variant === 'geometry' ? 'Geometry' : variant === 'fields' ? 'Fields & spatial conditioning' : 'Flexibility & dynamics'}</a>
      </article>)}
    </div>
    <p className="structure-scope-note">Locally rendered reference structures illustrate the review themes. Method-specific capabilities and evidence are documented in each configuration record.</p>
  </section>
}
