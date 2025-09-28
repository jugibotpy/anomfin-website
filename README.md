AnomFIN · Kyberturva- ja sovelluskehityssivusto

Ammattimainen, responsiivinen sivupohja AnomFINille (AnomTools-tiimi). Staattinen versio on juurihakemistossa; lisäksi mukana on kevyt Astro-yksisivuinen versio.

## Ominaisuudet

- Responsiivinen ulkoasu ja moderni tummateema
- Selkeä navigaatio, sankariosio ja palvelukortit
- Hinnoittelu ja UKK-osiot
- Yhteyslomake (valmis backend‑integraatiolle)
- Sisältö JSONista (Astro-projektissa)

## Pika-aloitus (staattinen sivu)

1. Avaa `index.html` suoraan selaimessa
2. Muokkaa sisältöä `index.html`, tyylejä `css/style.css`, skriptejä `js/script.js`
3. Paketoi julkaisuun komennolla `./package.sh`

Hakemistorakenne (staattinen):

```
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   └── logo.svg
└── docs/
```

## Astro-yksisivuinen (kokeilu)

Kevyt Astro-projekti löytyy `astro/`-hakemistosta. Se käyttää JSON-sisältöä ja komponentteja.

- Sivut/komponentit: `astro/src/pages/index.astro`, `astro/src/components/*`
- Layout/tyylit: `astro/src/layouts/Base.astro`, `astro/public/css/style.css`
- Sisältö: `astro/src/content/site.json`
- Julkiset tiedostot: `astro/public/assets/logo.svg`, `astro/public/css/style.css`

Aja paikallisesti (Node 18+):

```bash
cd astro
npm install   # vaatii verkkoyhteyden
npm run dev   # http://localhost:4321
```

Huom: Jos tätä ajetaan ympäristössä ilman verkkoa, asenna ja aja paikallisesti omalla koneellasi.

## Julkaisu

- Staattinen: kopioi juuren tiedostot palvelimelle tai käytä `./package.sh`
- Astro: `npm run build` tuottaa `dist/`-hakemiston (voit julkaista esim. Vercel/Cloudflare Pages)

## Kehitysvinkit

- Pidä tekstit yhdessä lähteessä (`site.json` tai Astro: `src/content/site.json`)
- Lisää schema.org (Organization, Product, FAQ) ja meta‑tagit tuotannossa
- Lomakkeelle taustapalvelu (esim. SMTP/Brevo) ja validointi

© 2025 AnomFIN · Kaikki oikeudet pidätetään.
