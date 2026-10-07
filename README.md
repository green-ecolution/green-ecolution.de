# Green Ecolution – Landing Page

This is the landing page for [Green Ecolution](https://green-ecolution.de), a research project focused on data-driven irrigation of urban trees.

## About the Project

Green Ecolution is a collaboration between the University of Applied Sciences Flensburg and the Technisches Betriebszentrum Flensburg (TBZ). The project uses sensor technology, data analysis, and digital route planning to optimize tree irrigation – saving water and resources in urban environments.

The system is currently being developed towards production readiness for real-world deployment.

## Tech Stack

- [Astro](https://astro.build/) with [React](https://react.dev/) islands and [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- Release notes and blog as MDX content collections
- Deployed via GitHub Actions as a static nginx image to Kubernetes

## Development

```bash
pnpm install
pnpm dev
```

The site runs on http://localhost:4321

## Build

```bash
pnpm build
```

## Press downloads

The press page links its files straight from the S3 bucket, so a new logo or a
new pitch deck is a bucket upload, not a deploy.

`ASSET_BASE_URL` in `astro.config.mjs` points at the bucket and is the only
place to change when the files move.

The slide preview of the pitch deck is loaded from the bucket at runtime via
`press/pitch-deck/slides.json`. `just publish-pitch-deck` in the presentations
repo builds the deck, renders the slides and uploads PDF, slides and manifest.

The SVG sources carry 8% clear space around the artwork, and the icon sits on a
square canvas. Replacing a source means keeping that framing, otherwise the
downloads and the preview on the press page stop matching.

## Contact

[info@green-ecolution.de](mailto:info@green-ecolution.de) · [GitHub Organization](https://github.com/green-ecolution)
