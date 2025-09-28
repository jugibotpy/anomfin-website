# AnomFIN sivupohja (demo → laajennettava)

Tämä on kevyt, responsiivinen sivupohja AnomFINille. Se on suunniteltu siirrettäväksi myöhemmin Astro/Next -projektiin.

## Rakenne
- `index.html` – staattinen demoversio (merkattu COPILOT-kommentein)
- `style.css` – tumma neon-tyyli, mobile-first
- `script.js` – mobiilivalikko + lomakkeen demo-kuittaus
- `content/site.json` – **sisältölähde**, jota voi käyttää generaattorin kanssa

## Kehitys
Avaa `index.html` suoraan selaimeen. Myöhemmin voit siirtää sisällöt `content/site.json` → Astro/Next.

## Copilot: CONTINUE
Seuraavat tehtävät GitHubin AI:lle (Copilot/GitHub Actions):

1. **Generoi** Astro- tai Next.js -projekti ja lue `content/site.json` sivujen pohjaksi.
2. Luo **reitit**: `/`, `/palvelut/[slug]`, `/hinnoittelu`, `/yhteys`, `/tietosuoja`.
3. Tee **komponentit** (Hero, Cards, Pricing, FAQ) ja täytä ne JSON-datasta.
4. Lisää **lokalisointi**-valmius (FI aluksi; rakenne i18n:lle).
5. Konfiguroi **CI/CD**: GitHub Actions → Vercel/Cloudflare Pages.
6. Toteuta **lomake** (sähköpostilla tai esim. Brevo/SMTP/Sheets) ja lisää validointi.
7. Lisää **schema.org** (Organization, Product, FAQ) + perus SEO-metat.

> Vihje: Aloita komennolla `# COPILOT_TODO: scaffold Astro with content/site.json as data source.`


## Julkaisu GitHub Pagesiin
1. Luo GitHub-repo (esim. `anomfin-site`) ja puske kaikki tiedostot.
2. Varmista, että olet `main`-branchissa.
3. Ota Pages käyttöön: **Settings → Pages → Source: GitHub Actions**.
4. Workflow `.github/workflows/deploy.yml` julkaisee sivun automaattisesti.

> Kun siirryt Astro/Next -projektiin, kommentoi workflowssa auki Node-askeleet ja muuta `upload-pages-artifact` polku `./dist`:iin.
