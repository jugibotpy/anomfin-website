# AnomFIN Website - Clean Release Package

Tämä on puhdas julkaisupaketti AnomFIN-verkkosivustolle. Paketti sisältää vain tuotantoon tarvittavat tiedostot.

## ⚡ Päivitys – HyperLaunch Secure Ops
- **Tilannehuone 360°**: Reaaliaikainen kyberturvan dashboard, jonka data tulee `data/security-insights.json` -lähteestä.
- **Selain-HyperCheck**: Paikallinen diagnostiikka HTTPS-tilasta, yhteydestä ja tallennusoikeuksista, tulokset myös lokitetaan strukturoituina.
- **Lyhytlinkin live-valvonta**: Reaaliaikainen HTTPS- ja alias-validointi ennen lomakkeen lähetystä.

## 🧰 Kehitysympäristö & komennot
```bash
npm install          # Asenna kehitystyökalut
npm run lint:fix     # Korjaa ESLint + Prettier säännöt
npm test             # Suorita Vitest-yksikkötestit
```

## ✅ Verifiointiajot
1. Avaa `index.html` selaimessa → varmista, että **Tilannehuone 360°** näyttää päivittyvän datan ja selaincheckin tulokset.
2. Syötä `https://anomfin.fi` ja alias `FIN1` → lomake näyttää vihreän vihjeen ennen lähetystä.
3. Muuta `data/security-insights.json` arvoja ja lataa sivu → dashboard päivittyy uusiin arvoihin.

## 🧠 Why this design
- **Functional core, imperative shell**: puhtaat laskentafunktiot `src/core/`-hakemistossa, IO rajattu `src/services/`-tasoille.
- **Security-first oletukset**: kaikki linkkisyötteet validoidaan HTTPS-vaatimuksella, ja dashboard-fetchaus käyttää aikakatkaisua.
- **DX etusijalla**: Node 18+ ESM, Vitest + ESLint tekevät tarkistukset yhdellä komennolla.
- **Lokaali data ensin**: dashboard käyttää paikallista JSON-lähdettä, joten demo toimii ilman taustapalvelimia.

## 📌 TODO – seuraavat iteraatiot
- Lisätään `api/security-insights.php` joka välittää tuotantodatan palvelimelta ja autentikoi API-avaimella.
- Tuodaan PWA-service worker offline-tilan parantamiseksi ja hallittujen päivitysten julkaisuun.
- Rakennetaan käyttöliittymästä saavutettava raportin vienti (PDF/CSV) suoraan dashboardista.

## 📦 Paketin sisältö

```
anomfin-website/
├── index.html              # Pääsivu
├── asetukset.php           # Admin-asetussivu (kirjautuminen)
├── api/
│   └── settings.php        # Julkinen rajapinta asetuksille
├── config/
│   ├── admin.config.php    # Hallintapaneelin määritykset
│   └── settings-defaults.php # Oletusarvot animaatioille
├── data/
│   └── settings.json       # Palvelimelle tallennetut asetukset
├── install.php             # Asennusohjelma (kertaluontoinen)
├── css/
│   └── style.css          # Tyylit
├── js/
│   └── script.js          # JavaScript-toiminnallisuus
└── assets/
    ├── logo.png           # Logo (PNG)
    ├── logo.svg           # Logo (SVG)
    └── logotp.png         # Päälogon PNG-versio
```

## �� Asennus (3 vaihetta)

### Vaihe 1: Lataa tiedostot palvelimelle

**FileZilla-ohjeet:**

1. Lataa ja asenna [FileZilla](https://filezilla-project.org/)
2. Yhdistä webhotelliisi:
   - Host: `ftp.palveluntarjoajasi.fi`
   - Username: `käyttäjätunnuksesi`
   - Password: `salasanasi`
   - Port: `21` (tai `22` SFTP:lle)
3. Pura `v_final.zip` paikallisesti
4. Siirrä kaikki tiedostot ja kansiot webhotellin juureen (esim. `/public_html/`)

**Vaihtoehtoisesti komentorivillä:**

```bash
# Pura paketti
unzip v_final.zip

# Siirrä tiedostot palvelimelle
scp -r * käyttäjä@palvelin.fi:/polku/webroot/
```

### Vaihe 2: Aseta oikeudet

Varmista, että tiedostoilla on oikeat käyttöoikeudet:

```bash
chmod 755 index.html asetukset.php
chmod 644 install.php api/settings.php
chmod -R 755 css/ js/ assets/
chmod -R 750 config/ data/
```

### Vaihe 3: Suorita asennus

1. Avaa selaimessa: `http://verkkotunnuksesi.fi/install.php`
2. Täytä tietokantaan liittyvät tiedot:
   - Tietokannan nimi
   - Käyttäjätunnus
   - Salasana
   - Palvelin (yleensä `localhost`)
3. Klikkaa **"Asenna nyt"**
4. Asennus luo tarvittavat tietokantataulut ja määritykset
5. **Poista `install.php` asennuksen jälkeen turvallisuussyistä**

## 🎨 Käyttö

### Staattinen sivu

Jos et tarvitse tietokantaa, voit käyttää sivustoa suoraan:
- Avaa `index.html` selaimessa
- Sivusto toimii ilman PHP:ta tai tietokantaa

### Dynaaminen sivu (PHP + tietokanta)

Jos olet suorittanut asennuksen `install.php`:lla:
- Sivusto toimii täysillä ominaisuuksilla
- Yhteyslomake tallentaa viestit tietokantaan
- Admin-paneeli käytettävissä

## ⚙️ Asetukset

Voit säätää sivuston asetuksia kirjautumalla osoitteeseen `asetukset.php`:
- Intro-animaatiot ja ajastukset
- Neon-teemat ja värit
- Käyttäytymislogiikka (hover- ja kontaktireaktiot)

Asetukset tallennetaan palvelimelle tiedostoon `data/settings.json`, jolloin muutokset näkyvät kaikille kävijöille. Asetusten tallentaminen vaatii salasanan (vaihda oletus arvo `config/admin.config.php` -tiedostossa).

## 🔧 Muokkaus

- **Sisältö**: Muokkaa `index.html` ja hallintaa `asetukset.php`
- **Tyylit**: Muokkaa `css/style.css`
- **Toiminnallisuus**: Muokkaa `js/script.js`
- **Kuvat**: Korvaa tiedostot `assets/`-kansiossa

## 📋 Vaatimukset

**Staattiselle sivustolle:**
- Webpalvelin (Apache, Nginx, jne.)
- Moderni selain

**PHP-ominaisuuksille:**
- PHP 7.4 tai uudempi
- MySQL 5.7 tai uudempi / MariaDB 10.2 tai uudempi
- PDO PHP Data Objects -tuki
- Apache mod_rewrite (suositeltu)

## 🆘 Tuki

Jos tarvitset apua asennuksessa tai käytössä:
- **Sähköposti**: info@anomfin.fi
- **Verkkosivusto**: https://anomfin.fi

## 📄 Lisenssi

© 2025 AnomFIN · Kaikki oikeudet pidätetään.

---

**Huom:** Tämä on puhdas julkaisupaketti. Kehitystiedostot, dokumentaatio ja testit on poistettu.
Jos haluat jatkaa kehitystä, kloonaa täydellinen repository GitHubista.
