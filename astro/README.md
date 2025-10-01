AnomFIN Astro (prototype)

Overview
- Static Astro site that renders from `src/data/site.json`.
- Pages: `/`, `/hinnoittelu`, `/yhteys`, `/tietosuoja`.

Dev
1) Install deps: `npm install` inside `astro/`.
2) Run dev server: `npm run dev` (opens on http://localhost:4321).
3) Build: `npm run build` → `dist/`.

Notes
- Styles are minimal (`src/styles/style.css`) and can ingest existing CSS later.
- Migrate assets into `public/` as needed (e.g., logos, images).
- For GitHub Pages, set `site` in `astro.config.mjs` accordingly or deploy to Vercel.
- Includes a subtle watermark `assets/mask.svg` (Guy Fawkes–inspired silhouette) layered via `body::before`. Adjust opacity/size in CSS.
- Intro overlay morphs the logo into the hero corner box and keeps a subtle float animation. Respects `prefers-reduced-motion` and includes a "skip intro" button.
