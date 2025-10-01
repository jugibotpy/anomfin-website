# AnomFIN Asennusohjeet (Suomeksi)

## 📦 Vaihe 1: Lataa ja Pura Tiedostot

1. **Lataa `final.zip`** tietokoneellesi
2. **Pura zip-tiedosto** haluamaasi kansioon

## 🌐 Vaihe 2: Lataa Tiedostot Palvelimelle

### Vaatimukset
- **PHP 7.4 tai uudempi**
- **MySQL tai MariaDB** tietokanta
- **cURL**-tuki (ChatGPT/OpenAI yhteyttä varten)

### Latausohjeet

**Vaihtoehto A: FTP/SFTP-ohjelma** (esim. FileZilla)
1. Avaa FTP-ohjelma
2. Yhdistä palvelimellesi (isäntä, käyttäjätunnus, salasana)
3. Siirry `public_html` tai `www` -kansioon
4. Lataa kaikki puretut tiedostot palvelimelle

**Vaihtoehto B: Webhotellin Tiedostonhallinta**
1. Kirjaudu webhotellisi hallintapaneeliin (cPanel, Plesk, tms.)
2. Avaa Tiedostonhallinta
3. Siirry `public_html` kansioon
4. Lataa tiedostot tai lähetä zip suoraan ja pura siellä

## ⚙️ Vaihe 3: Luo Tietokanta

1. **Kirjaudu hallintapaneeliin** (cPanel, Plesk, tms.)
2. **Avaa phpMyAdmin** tai MySQL Databases
3. **Luo uusi tietokanta:**
   - Tietokannan nimi: `anomfin_db` (tai muu nimi)
   - Merkistö: `utf8mb4_unicode_ci`
4. **Luo käyttäjä:**
   - Käyttäjätunnus: `anomfin_user` (tai muu)
   - Salasana: (luo vahva salasana)
5. **Liitä käyttäjä tietokantaan** kaikilla oikeuksilla

**Esimerkki SQL-komennot:**
```sql
CREATE DATABASE anomfin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'anomfin_user'@'localhost' IDENTIFIED BY 'vahva_salasana_tähän';
GRANT ALL PRIVILEGES ON anomfin_db.* TO 'anomfin_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🚀 Vaihe 4: Suorita Asennus Selaimessa

1. **Avaa selain** ja mene osoitteeseen:
   ```
   http://sinun-domain.fi/install.php
   ```
   tai
   ```
   https://sinun-domain.fi/install.php
   ```

2. **Täytä lomake:**
   - **Palvelin**: `localhost` (useimmiten)
   - **Tietokannan nimi**: Vaiheessa 3 luotu nimi (esim. `anomfin_db`)
   - **Käyttäjätunnus**: Vaiheessa 3 luotu käyttäjä (esim. `anomfin_user`)
   - **Salasana**: Tietokannan salasana
   - **Portti**: `3306` (oletus)
   - **OpenAI API-avain** (valinnainen): Voit lisätä myöhemmin

3. **Klikkaa "Asenna nyt"**

4. **Valmis!** Järjestelmä:
   - ✅ Testaa tietokantayhteyden
   - ✅ Luo `.env` konfiguraatiotiedoston
   - ✅ Luo `admin.php` hallintapaneelin automaattisesti
   - ✅ Lukitsee asennuksen (ei voi ajaa uudelleen)

## 🎛️ Vaihe 5: Käytä Hallintapaneelia

### Kirjaudu Admin-paneeliin

```
http://sinun-domain.fi/admin.php
```

**Oletussalasana:** `admin123`

⚠️ **TÄRKEÄÄ:** Vaihda salasana heti ensimmäisen kirjautumisen jälkeen!

### Admin-paneelin Ominaisuudet

- 🤖 **AI-hallinta**: Hallitse ChatGPT/OpenAI yhteyttä
- 📧 **Viestien hallinta**: Vastaa yhteydenottolomakkeesta tulleisiin viesteihin
- ⚙️ **Etusivun asetukset**: Muokkaa sivuston asetuksia
- 📊 **Järjestelmäasetukset**: Konfiguroi järjestelmää
- 📱 **Telegram-integraatio** (tulossa): Viestit suoraan puhelimeesi

## 🔐 ChatGPT/OpenAI Yhteyden Asetukset

### Hanki API-avain

1. Mene osoitteeseen: https://platform.openai.com/
2. Kirjaudu tai luo tili
3. Siirry kohtaan **API Keys**
4. Klikkaa **Create new secret key**
5. Kopioi avain (alkaa `sk-...`)

### Lisää API-avain

**Tapa 1: Asennuksen aikana**
- Syötä API-avain lomakkeeseen kohtaan "OpenAI API-avain"

**Tapa 2: Asennuksen jälkeen**
1. Muokkaa `.env` tiedostoa palvelimella
2. Lisää rivi: `AI_API_KEY=sk-your-key-here`
3. Tallenna tiedosto

**Tapa 3: Admin-paneelin kautta** (tulossa)
- Hallitse API-avainta suoraan admin-paneelista

## 📱 Telegram-integraatio (Tuleva Ominaisuus)

### Mitä se tekee?

- ✅ Kaikki yhteydenottolomakkeesta tulevat viestit välittyvät Telegram-bottiin
- ✅ Saat välittömän ilmoituksen puhelimeesi
- ✅ Voit vastata viesteihin suoraan Telegramista
- ✅ Kaikki viestit näkyvät myös admin-paneelissa

### Tulevat Ominaisuudet

1. **Telegram Bot Setup**
   - Yksinkertainen botti-asetusprosessi
   - QR-koodi nopeaa linkitystä varten

2. **Ilmoitusasetukset**
   - Valitse mitkä ilmoitukset haluat
   - Työaika-asetukset
   - Hiljaiset tunnit

3. **Vastaus-integraatio**
   - Vastaa viesteihin Telegramista
   - Vastaukset näkyvät admin-paneelissa
   - Automaattinen vahvistus lähettäjälle

## 🔧 Ylläpito ja Huolto

### Varmuuskopioi Tietokanta

**phpMyAdminissa:**
1. Valitse tietokantasi
2. Klikkaa "Vie" (Export)
3. Valitse "Nopea" ja "SQL"
4. Klikkaa "Suorita"
5. Tallenna tiedosto turvalliseen paikkaan

**Komentorivillä:**
```bash
mysqldump -u anomfin_user -p anomfin_db > varmuuskopio.sql
```

### Päivitä Järjestelmä

1. Varmuuskopioi tietokanta
2. Varmuuskopioi `.env` tiedosto
3. Lataa uudet tiedostot palvelimelle
4. Tarkista että `.env` on edelleen oikein
5. Testaa toimivuus

### Poista install.php Turvallisuussyistä

**Asennuksen jälkeen suositellaan:**
```bash
rm install.php
```
tai poista tiedosto FTP:n kautta.

## ❓ Yleisiä Ongelmia

### "Tietokantayhteys epäonnistui"
- ✅ Tarkista tietokannan nimi, käyttäjä ja salasana
- ✅ Varmista että tietokanta on luotu
- ✅ Tarkista että palvelin on `localhost`

### "Ei voida kirjoittaa .env tiedostoa"
- ✅ Tarkista kansion kirjoitusoikeudet (755)
- ✅ Ota yhteyttä webhotellin tukeen

### "ChatGPT ei vastaa"
- ✅ Tarkista API-avain `.env` tiedostosta
- ✅ Varmista että sinulla on OpenAI-krediittejä
- ✅ Testaa yhteys admin-paneelista

### "admin.php ei löydy"
- ✅ Tiedosto luodaan automaattisesti asennuksen yhteydessä
- ✅ Jos puuttuu, aja install.php uudelleen (poista ensin `.env`)

## 📞 Tuki ja Apu

### Yhteystiedot
- **Sähköposti:** info@anomfin.fi
- **Verkkosivusto:** https://anomfin.fi

### Dokumentaatio
- `SIMPLE_INSTALL_GUIDE.md` - Yksinkertainen englanninkielinen ohje
- `PHP_BACKEND_README.md` - Tekninen dokumentaatio
- `QUICK_START.md` - Pika-aloitusohje

## ✅ Tarkistuslista Asennukselle

Käy läpi nämä kohdat:

- [ ] PHP 7.4+ asennettu palvelimelle
- [ ] MySQL/MariaDB tietokanta luotu
- [ ] Tiedostot ladattu palvelimelle
- [ ] install.php ajettu selaimessa
- [ ] Asennus onnistui (näkyy vihreä vahvistus)
- [ ] admin.php löytyy ja toimii
- [ ] Salasana vaihdettu oletuksesta
- [ ] ChatGPT API-avain lisätty (jos käytössä)
- [ ] Etusivu toimii: http://sinun-domain.fi/
- [ ] install.php poistettu turvallisuussyistä

## 🎉 Valmista!

Järjestelmäsi on nyt valmis käytettäväksi!

**Seuraavat askeleet:**
1. Kirjaudu admin-paneeliin
2. Vaihda salasana
3. Testaa ChatGPT-yhteyttä
4. Muokkaa etusivun asetuksia
5. Odota Telegram-integraation julkaisua

---

**Huom:** Pidä `.env` tiedosto turvassa äläkä jaa sitä kenellekään!

© 2025 AnomFIN - Yksinkertainen asennus, tehokas käyttö
