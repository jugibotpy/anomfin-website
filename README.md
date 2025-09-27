# AnomFIN · AnomTools Cybersecurity Website

A professional, bilingual website foundation for AnomFIN, a cutting-edge cybersecurity company powered by the AnomTools suite.

## Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices.
- **Modern UI**: Clean, professional look themed for cybersecurity.
- **Interactive Elements**: Smooth scrolling navigation and animated components.
- **Contact Form**: Client-side validation with clear user feedback (ready for backend integration).
- **Content Source**: `site.json` contains structured data that can feed future Astro/Next builds.

## Quick Start

1. **Preview**: Open `index.html` directly in your browser.
2. **Customize**: Update text in `index.html`, styles in `css/style.css`, and scripts in `js/script.js`.
3. **Package**: Run `./package.sh` to create a deployment ZIP for static hosting.

## File Structure

```
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Main stylesheet
├── js/
│   └── script.js      # Interactive functionality
├── assets/            # Images and other assets
├── docs/              # Project documentation (including git sync status)
├── site.json          # Content source for generators
├── package.sh         # Packaging script for deployment
└── README.md          # This file
```

## Deployment Options

### Option 1: Simple Upload
1. Upload all files to your web server's public directory.
2. Ensure your server serves static HTML files.
3. Visit your domain to verify the site.

### Option 2: Using the Packaging Script
1. Run `./package.sh` to create `anomfin_site.zip`.
2. Extract the archive on your web server.
3. Follow the included deployment notes.

---

## Kehitys (FI)

Tämä repo sisältää kevyen, responsiivisen demopohjan AnomFINille (AnomTools-tekniikalla). Suunnitelma on siirtää sisältö myöhemmin Astro- tai Next.js -projektiin.

- `index.html` – staattinen demoversio (merkattu COPILOT-kommentein)
- `css/style.css` – tumma neon-tyyli, mobile-first
- `js/script.js` – mobiilivalikko ja lomakkeen demo-kuittaus
- `site.json` – **sisältölähde**, jota voidaan käyttää generaattorin kanssa

### Kehitysvinkit

1. Avaa `index.html` suoraan selaimessa nopeaa esikatselua varten.
2. Hyödynnä `site.json` -tiedostoa, jos rakennat dynaamisen sivuston (Astro/Next.js).
3. Lisää omaa sisältöä `assets/`-hakemistoon (logot, kuvat, videot).

### Copilot TODO (FI)

Seuraavat askelmerkit GitHubin AI-työkaluille:

1. **Generoi** Astro- tai Next.js -projekti, joka lukee `site.json` -datan sivujen pohjaksi.
2. Luo **reitit**: `/`, `/palvelut/[slug]`, `/hinnoittelu`, `/yhteys`, `/tietosuoja`.
3. Rakenna **komponentit** (Hero, Cards, Pricing, FAQ) ja täytä ne JSON-datasta.
4. Lisää **lokalisointi**-valmius (FI aluksi; rakenne i18n:lle).
5. Konfiguroi **CI/CD**: GitHub Actions → Vercel tai Cloudflare Pages.
6. Toteuta **lomake** taustapalvelulla (esim. Brevo/SMTP/Google Sheets) ja lisää validointi.
7. Lisää **schema.org** (Organization, Product, FAQ) sekä perus SEO-metat.

> Vihje: Aloita komennolla `# COPILOT_TODO: scaffold Astro with content/site.json as data source.`

## Publishing to GitHub Pages

1. Luo GitHub-repo (esim. `anomfin-site`) ja puske kaikki tiedostot.
2. Varmista, että työskentelet `main`-branchissa.
3. Ota Pages käyttöön: **Settings → Pages → Source: GitHub Actions**.
4. Workflow `.github/workflows/deploy.yml` julkaisee sivun automaattisesti. Kun siirryt Astro/Next-projektiin, päivitä Node-askeleet ja muuta `upload-pages-artifact` polku `./dist`-hakemistoon.

## License

© 2024 AnomFIN · AnomTools. All rights reserved.
