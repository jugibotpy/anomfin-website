#<<<<<<< copilot/fix-1
# AnomFIN - Cybersecurity Website

A professional website for AnomFIN, a cutting-edge cybersecurity company providing comprehensive digital security solutions.

## Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with cybersecurity theme
- **Interactive Elements**: Smooth scrolling navigation, animated components
- **Contact Form**: Functional contact form with validation and notifications
- **Professional Sections**: Hero, Services, About, and Contact sections
- **Easy Deployment**: Simple static files ready for any web server

## Quick Start

1. **View the website**: Open `index.html` in your web browser
2. **Deploy**: Upload all files to your web server
3. **Package**: Run `./package.sh` to create a deployment zip file

## File Structure

```
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Main stylesheet
├── js/
│   └── script.js      # Interactive functionality
├── assets/            # Images and other assets (empty initially)
├── package.sh         # Packaging script for deployment
└── README.md          # This file
```

## Deployment

### Option 1: Simple Upload
1. Upload all files to your web server's public directory
2. Ensure your server can serve static HTML files
3. Access via your domain

### Option 2: Using Package Script
1. Run `./package.sh` to create a deployment package
2. Extract the generated zip file to your web server
3. Follow the included deployment instructions

## Customization

- **Content**: Edit `index.html` to update text, contact information, and services
- **Styling**: Modify `css/style.css` to change colors, fonts, and layout
- **Images**: Add company logos and images to the `assets/` directory
- **Functionality**: Extend `js/script.js` for additional interactive features

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Contact Form

The contact form includes client-side validation and provides user feedback. For production use, you'll need to integrate with a backend service to handle form submissions.

## License

© 2024 AnomFIN. All rights reserved.
=======
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
#>>>>>>> main
