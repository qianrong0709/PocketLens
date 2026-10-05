import atlas from '../data/atlas.json'
import { MolecularViewer } from './MolecularViewer'

const perspectives = [
  { id: 'geometry', number: '01', title: 'Geometry', image: 'cdk2-pocket-geometry-blue.png', text: 'Read the atoms, shapes and local environment that define a binding pocket.', link: 'Explore pocket representations' },
  { id: 'fields', number: '02', title: 'Fields & conditioning', image: 'cdk2-pocket-surface-blue.png', text: 'Examine how spatial information and additional conditions enter the generation process.', link: 'Explore spatial conditions' },
  { id: 'dynamics', number: '03', title: 'States & flexibility', image: 'cdk2-apo-atp-overlay-blue.png', text: 'Separate input structure state, ligand flexibility and changes to the protein pocket.', link: 'Explore structure states' },
]

export function EditorialHome() {
  return <div className="editorial-home">
    <section className="editorial-hero">
      <div className="editorial-hero-copy">
        <p className="editorial-eyebrow">A COMPANION TO THE REVIEW</p>
        <h1>Understand the pocket.<br /><em>Explore the methods.</em></h1>
        <p className="editorial-intro">A research atlas connecting 3D molecular generation methods with their input conditions, pocket representations and supporting evidence.</p>
        <div className="editorial-actions"><a className="editorial-primary" href="#/methods">Explore methods</a><a className="editorial-text-link" href="#/review-map">Read the review map <span aria-hidden="true">↗</span></a></div>
        <div className="editorial-counts" aria-label="Atlas coverage"><div><strong>{atlas.methods.length}</strong><span>methods</span></div><div><strong>{atlas.configurations.length}</strong><span>configurations</span></div><div><strong>{atlas.sources.length}</strong><span>sources</span></div></div>
        <p className="editorial-small-note">Compare specific configurations. Trace key claims to their sources.</p>
      </div>
      <MolecularViewer hero />
    </section>

    <div className="editorial-review-reference"><span>THE REVIEW</span><a href="#/about">From Geometry towards Field and Dynamics: A Review of Pocket-Based 3D Molecular Generation</a></div>

    <section className="editorial-perspectives">
      <div className="editorial-section-heading"><div><p className="editorial-eyebrow">READING THE LANDSCAPE</p><h2>Three perspectives on the pocket.</h2></div><p>Follow a concept into the review, then examine the conditions and evidence of individual methods.</p></div>
      <div className="editorial-perspective-grid">{perspectives.map(item => <article key={item.id}>
        <a className="editorial-perspective-image" href={`#/review-map?theme=${item.id}`} aria-label={`Read ${item.title}`}><img src={`figures/${item.image}`} width="1600" height="1100" loading="lazy" alt={item.id === 'dynamics' ? 'Experimental apo and ATP-bound CDK2 crystal structures superposed in PyMOL' : item.id === 'fields' ? 'Molecular surface of the experimental CDK2 ATP pocket' : 'Experimental ATP and nearby CDK2 protein atoms'} /></a>
        <div className="editorial-perspective-label"><span>{item.number}</span><h3>{item.title}</h3></div><p>{item.text}</p><a className="editorial-text-link" href={`#/review-map?theme=${item.id}`}>{item.link} <span aria-hidden="true">↗</span></a>
      </article>)}</div>
      <p className="editorial-image-credit">Reference illustrations: experimental CDK2 coordinates, <a href="https://www.rcsb.org/structure/1HCK" target="_blank" rel="noreferrer">PDB 1HCK</a> and <a href="https://www.rcsb.org/structure/1HCL" target="_blank" rel="noreferrer">1HCL</a>. Surface geometry and static structure comparisons illustrate the themes.</p>
    </section>

    <section className="editorial-start">
      <div><p className="editorial-eyebrow">START WITH YOUR INPUT</p><h2>What are you working with?</h2><p>Use the information available in your project to narrow the method configurations.</p></div>
      <div className="editorial-question-links">
        <a href="#/methods?inputs=Prepared+protein+pocket"><span>A prepared protein pocket</span><span aria-hidden="true">↗</span></a>
        <a href="#/methods?inputState=Apo"><span>An apo structure</span><span aria-hidden="true">↗</span></a>
        <a href="#/methods?inputs=Reference+ligand&inputs=Fragment+vocabulary"><span>A reference ligand or fragments</span><span aria-hidden="true">↗</span></a>
        <a href="#/methods?pocketTreatment=Joint+pocket+adjustment"><span>A question about pocket adjustment</span><span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section className="editorial-evaluation"><div><p className="editorial-eyebrow">INTERPRETING THE EVIDENCE</p><h2>Compare protocols before scores.</h2><p>Explore chemical and physical validity, pocket-conditioning evidence and the distinctions between Vina score, minimize and dock.</p></div><a className="editorial-text-link" href="#/evaluation">Open the Evaluation Guide <span aria-hidden="true">↗</span></a></section>
  </div>
}
