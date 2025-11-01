# AnomFIN Website · Security Diagnostics Release

Kyberturva ei ole lisäosa vaan ydin. Tämä päivitys tuo selaimessa toimivan riskiradarin, resilienssin ROI-laskelman ja automaattisen toimintabluuprintin – kaikki ilman ulkoisia riippuvuuksia.

## 🚀 Uutta

- **Riskiradari** – painotettu arvio altistuksesta, havaitsemisesta, palautumisesta ja compliance-tasosta.
- **Resilienssin ROI** – mallinna kustannukset ja takaisinmaksu reaaliaikaisesti.
- **Toimintabluuprintti** – yhdistää riskin ja ROI:n yhdeksi priorisoiduksi tehtävälistaksi.
- **Modulaarinen laskentaydin** (`js/modules/security-math.js`) testataan Vitestillä ja on käytettävissä myös muissa integraatioissa.
- **Snagen DRAGON Countdown** – `AnomCounter.html` tarjoaa säädettävän ajastimen, viimeisen 10 sekunnin erikoisanimaation ja strukturoituja lokitapahtumia.

## 🧩 Rakenne

```
js/
├── anom-counter.js        # Countdownin imperative shell + lokitus
├── modules/
│   ├── countdown-core.js  # Ajastimen puhtaat funktiot
│   └── security-math.js   # Puhdas laskentalogiikka
├── script.js              # Olemassa oleva UI-kerros
└── security-suite.js      # Imperatiivinen integraatio DOM:iin
css/style.css              # Uudet Diagnostics-tyylit lopussa
AnomCounter.html           # Countdown-sivu (dark mode, säädettävä)
README.md                  # Tämä tiedosto
```

### Why this design

- **Functional core**: riskin ja ROI:n laskenta eroteltu puhtaiksi funktioiksi → helppo testata ja auditoida.
- **Imperative shell**: `security-suite.js` hoitaa vain DOM-sidokset ja lokituksen.
- **Security-first**: tiukat syöte-rajat, paikallinen tallennus, ei ulkoisia API-kutsuja.
- **DX-first**: Vitest + ESLint (flat config) + Prettier skripteissä → nopea palaute.
- **Minimalismi**: kolmen kortin näkymä, yksi polku käyttäjälle, yksi polku kehittäjälle.
- **Countdown eroteltu**: `countdown-core.js` pitää logiikan puhtaana; UI-skripti hoitaa DOMin, animaatiot ja Web Audio -piippaukset.

## 🔧 Asennus

1. Asenna Node 18+.
2. Asenna riippuvuudet projektijuuresta:
   ```bash
   npm install
   ```

## 🛠 Komennot

- `npm run lint` – tarkistaa uuden koodin laadun.
- `npm run lint:fix` – korjaa automaattisesti lint-virheet.
- `npm run test` – ajaa Vitest-yksikkötestit kerran.
- `npm run test:watch` – kehitystilassa pyörittää testejä.
- `npm run format` – formatoi moduulit ja README:n.

## ✅ Verifiointi

1. Aja lint- ja testikomennot:
   ```bash
   npm run lint
   npm run test
   ```
2. Avaa `index.html` modernissa selaimessa.
3. Säädä **Riskiradaria** – riskipisteet ja insight-lista päivittyvät reaaliajassa.
4. Syötä ROI-laskimeen esimerkiksi:
   - Tapaukset: `12`
   - Kustannus/tapaus: `25000`
   - Automaation peitto: `60`
   - Parannusaste: `30`
   - Investointi: `50000`
5. Varmista, että **Toimintabluuprintti** päivittyy ja näyttää tilan `focus` tai `alert` syötteistä riippuen.
6. Avaa `AnomCounter.html` ja tarkista:
   - Säädä ajastinta ±1 minuutilla ja ±5 sekunnilla (napit).
   - Käynnistä countdown → numerot animoituvat ja viimeiset 10 s piippaa kiihtyvällä tempolla.
   - `Reset` palauttaa oletusasetuksiin ja poistaa savuefektin.

## 🔐 Turva

- Kaikki syötteet validoidaan selaimessa (`clamp`, `normalise`) → ei ylivuotoja.
- Ei ulkoisia skriptejä tai eval-kutsuja.
- Paikallinen tila tallennetaan `localStorage`:een ilman sensitiivisiä tietoja.
- Lokitus on strukturoitua (`console.info('anomfin-security-suite', JSON)` ja `anomfin.counter`), ei henkilötietoja.

## 🧪 Testit

Vitest kattaa laskentaytimen ja tärkeitä reunatapauksia. Lisää testejä kirjoitetaan `tests/`-hakemistoon.

## 🧭 Runbook

1. `npm install`
2. `npm run lint`
3. `npm run test`
4. Avaa `index.html`
5. Avaa `AnomCounter.html`
6. Tarkista selaimen konsolista `anomfin-security-suite` ja `anomfin.counter` -lokit.

## ⚠️ Tunnetut rajoitteet

- ROI-laskenta on deterministinen eikä sisällä epävarmuusmallia (ei Monte Carloa).
- Paikallinen tallennus ei ole salattu; selaimen yksityistila tyhjentää tilan.
- Countdownin Web Audio -piippaus odottaa käyttäjän vuorovaikutusta (selaimen autoplay-suojaus).
- Laajat design-muutokset `css/style.css` tiedostossa kannattaa pilkkoa pienempiin moduuleihin seuraavassa iteraatiossa.

## 🔄 Seuraavat askeleet

1. Lisää Monte Carlo -simulointi ROI-laskentaan (Web Worker + streaming tulos).
2. Integroi asetusten hallinta (`api/settings.php`) niin, että oletusarvot tulevat palvelimelta.
3. Rakenna yhteys CRM:ään ja tallenna analyysin tulokset asiakaskohtaisesti (OAuth + audit trail).
4. Countdowniin: toteuta progressiivinen web worker -synkronointi (offline tallennus ja varavaiheet).
