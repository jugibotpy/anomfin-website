# AnomFIN × AnomTools – Kehitysideat ja jatkokehitys

## Sisältöstrategia
- **Dynaaminen sisällönhallinta:** Siirrä `index.html`-osion tekstit `site.json`-tiedostoon ja lue ne build-vaiheessa Astro/Next -generoinnilla. Tämä mahdollistaa kieliversioiden ja A/B-testien toteuttamisen ilman manuaalista HTML-päivitystä.
- **Referenssit ja caset:** Lisää hinnoittelun perään osio asiakastarinoille. Hyödynnä logoja sekä lyhyitä tulosmittareita ("+45 % liidit 3 kk:ssa"), jolloin uskottavuus paranee.
- **Sisältökalenteri:** Julkaise kuukausittainen "AnomFIN Threat Brief" -artikkeli ja jaa se blogissa / LinkedInissä. Voit automatisoida RSS-syötteen samaan `site.json`-rakenteeseen.

## Käyttökokemus ja UI
- **Live-demo CTA:** Lisää hero-osion nappeihin vaihtoehto "Katso 2 min demo" ja upota modal-videoplayer (esim. mp4 + poster). Auttaa herättämään "WOW"-reaktion ennen yhteydenottoa.
- **Progressiiviset animoinnit:** Laajenna nykyistä overlay-animaatiota käyttämään `IntersectionObserver`-pohjaisia micro-animaatioita korttien sisällä. Huomioi `prefers-reduced-motion` kuten nytkin.
- **PWA-perusta:** Luo `manifest.json` ja palvelutyöntekijä, jotta mobiilikäyttäjät voivat asentaa sivuston sovelluksena.

## Konversio ja analytiikka
- **Ajanvarausintegraatio:** Korvaa yhteydenottolomakkeen CTA Calendly/HubSpot Meetings -upotteella ja synkronoi CRM:ään.
- **Plausible-analytiikka:** Kevyt analytiikka ilman evästeitä, tavoitteena seurata CTA-painalluksia ja lomakekonversioita. Toteuta events API:n kautta.
- **Lead Magnet:** Lisää "Saa kyberturvakartoitus -checklist" -ladattava PDF, jonka voi lähettää automaattisella sähköpostilla (MailerLite/SendGrid).

## Tekninen tiekartta
- **Astro-siirtymä:** Scaffoldaa uusi Astro-projekti, joka lukee `site.json`-sisällön ja tuottaa staattisen sivun. Tuo nykyinen CSS modulaarisiin komponentteihin.
- **Automatisoidut testit:** Lisää Playwrightin visuaaliset testit intro-overlaylle ja contact-lomakkeen validoinnille.
- **CI-putki:** Ota käyttöön GitHub Actions -workflow, joka ajaa HTML/CSS/JS-lintersarjan ja deployaa GitHub Pagesiin tai Verceliin.

---

Terveisin,
**AnomFIN × AnomTools**
