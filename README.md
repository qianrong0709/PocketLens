# PocketLens

A source-linked atlas of pocket-based 3D molecular generation, accompanying *From Geometry towards Field and Dynamics: A Review of Pocket-Based 3D Molecular Generation*.

## Explore

- Methods Explorer with filters for tasks, representations, inference inputs, pocket states, generation frameworks, and code availability.
- Separate method identities and task configurations, with comparison of selected configurations.
- Evaluation guidance and traceable reference records.
- Interactive experimental CDK2 structures with local molecular surfaces and static apo/bound overlays.

Unknown or unreported scientific details remain explicitly marked. A code link does not imply that the method has been reproduced. Camera rotation and comparison of crystal structures are not molecular dynamics simulations.

## Development

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## GitHub Pages

The deployment workflow builds for the `/PocketLens/` repository path and publishes the resulting static files. In the repository settings, select **Pages → Source → GitHub Actions**. Pushes to `main` then redeploy the site.

The intended public address is https://qianrong0709.github.io/PocketLens/ once deployment succeeds.

## Data and structures

Method data are maintained in `src/data/atlas.json` and distributed in `public/data`. Preserve the evidence links, uncertainty labels, and distinction between methods and configurations when editing. Vina score, minimization, and docking protocols must remain distinguishable.

Experimental structure coordinates and provenance are under `public/structures`. The examples use RCSB entries [1HCK](https://www.rcsb.org/structure/1HCK) and [1HCL](https://www.rcsb.org/structure/1HCL). PDB coordinate usage follows the [wwPDB policy](https://www.wwpdb.org/about/usage-policies). The bundled 3Dmol.js library retains its license and provenance in `public/vendor`.

All website runtime assets are served by this site. The website does not need a remote molecular viewer or runtime downloads from a third-party CDN. Reference links open their respective publishers or repositories when followed.

This repository contains the public website. Manuscript source documents, reference PDFs, local backups, credentials, and workstation logs are not included.
