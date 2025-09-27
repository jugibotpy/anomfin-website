# AnomFIN · AnomTools – Sivuston nykytila

Tämä dokumentti kuvaa nykyisen staattisen etusivun rakenteen ja keskeiset visuaaliset elementit.

## Rakenne ja ulkoasu
- **Intro-overlay**: Heti latauksen alussa näytetään koko näytön peittävä tumma overlay, jossa on AnomFIN · AnomTools -logo. Overlay häivytetään `introFade`-animaatiolla.
- **Navigaatio**: Kiinteä ylävalikko, jossa on logo sekä ankkurit etusivun osioihin (Palvelut, Alustat, Kyberturva, Hinnoittelu, Yhteys).
- **Hero-osio**: Vasemmalla puolella pääviesti, CTA-painikkeet ja kolme mittaria. Oikealla puolella on visuaaliset elementit (`hero-orb`, `hero-grid`).
- **Palvelut**: Neljä korttia (Räätälöidyt sovellukset, Kyberturvaratkaisut, Auditoinnit & testaus, 24/7 valvonta & ylläpito).
- **Alustat**: Lista siru-tyylisistä elementeistä (iOS, Android, macOS, Windows, Linux, Web).
- **Kyberturva**: Tekstisisältö ja sivupalkin CTA "Pyydä demo".
- **Hinnoittelu**: Kolme hinnoittelukorttia (Start, Growth, Enterprise) erottuvilla tyyleillä.
- **Referenssit & luottamus**: Logo-rivi luottamusta rakentaville kumppaneille.
- **Case Study**: Esimerkkiprojekti (PhishHunterAI).
- **Prosessi**: Kolme vaihetta (Kartoitus, Prototyyppi, Tuotanto).
- **UKK**: Neljä kysymystä & vastausta.
- **CTA**: Lopun korostettu yhteydenottolohko.
- **Yhteydenotto**: Yhteystiedot, lomake ja some-linkit.
- **Footer**: Copyright-teksti ja pikalinkit.

## Missä animaatiota hallitaan?
Alussa näkyvän logon "zoom in / zoom out" -efekti tulee `introPulse`-avaimen animaatiosta tiedostossa [`css/style.css`](../css/style.css). Animaatio on määritelty `@keyframes introPulse`, jossa logolle määritellään skaalauksen vaihtelu `transform: scale(1)` ↔ `transform: scale(1.04)`. Logon elementti (`.intro-logo`) käyttää tätä animaatiota ja sitä voi muokata samassa tiedostossa.

## Kehitysehdotuksia
- Rakennetaan overlaylle vaihtoehtoinen animaatio, joka reagoi vieritykseen tai käyttäjän interaktioihin.
- Hajautetaan sisältö komponentteihin (esim. Astro/Next) ja tuotetaan data JSON-lähteestä `site.json` – ohjeistus löytyy HTML-kommentista.
- Lisätään kieliversio englanniksi hyödyntämällä i18n-kirjastoa ja dynaamisia reittejä.

\- AnomFIN · AnomTools tiimi
