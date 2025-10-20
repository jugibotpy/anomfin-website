<?php
// install.php
// Suorita tämä tiedosto kerran palvelimella (esim. http://localhost/anomfin-website/install.php)
// Se luo tarvittavan tietokantataulun, .htaccessin uudelleenohjaukseen ja lisää lyhentäjä-lomakkeen indexiin jos mahdollista.

set_time_limit(0);
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<pre>Install script: link shortener setup\n\n";

// 1) Yritä ladata projektin config.php - käyttäjän mukaan asetukset ovat siellä
$configPaths = [
    __DIR__ . '/config.php',
    __DIR__ . '/config/config.php',
    __DIR__ . '/config/admin.config.php',
];

foreach ($configPaths as $p) {
    if (file_exists($p)) {
        echo "Löytyi config: $p\n";
        include_once $p;
        break;
    }
}

// Automaattinen tunnistus eri config-muuttujista / vakioista
function detectDbConfig() {
    $c = [];

    if (defined('DB_HOST')) $c['host'] = DB_HOST;
    if (defined('DB_NAME')) $c['dbname'] = DB_NAME;
    if (defined('DB_USER')) $c['user'] = DB_USER;
    if (defined('DB_PASS')) $c['pass'] = DB_PASS;

    // mahdollinen $config array
    if (isset($config) && is_array($config)) {
        if (isset($config['db_host'])) $c['host'] = $config['db_host'];
        if (isset($config['db_name'])) $c['dbname'] = $config['db_name'];
        if (isset($config['db_user'])) $c['user'] = $config['db_user'];
        if (isset($config['db_pass'])) $c['pass'] = $config['db_pass'];
    }

    // yleisimmät muuttujat
    if (isset($db_host)) $c['host'] = $db_host;
    if (isset($db_name)) $c['dbname'] = $db_name;
    if (isset($db_user)) $c['user'] = $db_user;
    if (isset($db_pass)) $c['pass'] = $db_pass;

    return $c;
}

dbConfig = detectDbConfig();

if (empty($dbConfig['host'])) $dbConfig['host'] = 'localhost';
if (empty($dbConfig['user'])) {
    echo "VAROITUS: DB-käyttäjää ei löytynyt configista. Muokkaa config.php tai anna tiedot käsin.\n";
}
if (empty($dbConfig['dbname'])) {
    echo "VAROITUS: DB-nimeä ei löytynyt configista. Muokkaa config.php.\n";
}

try {
    $dsn = sprintf('mysql:host=%s;charset=utf8mb4', $dbConfig['host']);
    if (!empty($dbConfig['dbname'])) $dsn .= ';dbname=' . $dbConfig['dbname'];
    $user = $dbConfig['user'] ?? '';
    $pass = $dbConfig['pass'] ?? '';

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "Yhdistetty tietokantaan.\n";
} catch (Exception $e) {
    echo "Tietokantayhteyden muodostus epäonnistui: " . $e->getMessage() . "\n";
    exit(1);
}

// 2) Luo taulu link_shortener, jos ei ole
try {
    $sql = "
    CREATE TABLE IF NOT EXISTS `link_shortener` (
        `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        `code` VARCHAR(64) NOT NULL UNIQUE,
        `url` TEXT NOT NULL,
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `hits` INT UNSIGNED NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`),
        INDEX (`code`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ";
    $pdo->exec($sql);
    echo "Taulu link_shortener luotu/varmistettu.\n";
} catch (Exception $e) {
    echo "Taulun luonti epäonnistui: " . $e->getMessage() . "\n";
    exit(1);
}

// 3) Luo .htaccess uudelleenohjaukseen (Apache)
$htaccessPath = __DIR__ . '/.htaccess';
$htaccessContent = <<<HT
# Link shortener rewrite
RewriteEngine On
# Route /s/<code> to redirect.php
RewriteRule ^s/([A-Za-z0-9_-]+)$ /redirect.php?c=\\$1 [L,QSA]

# Ensure existing files are served normally
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule .* - [L]
HT;

if (file_put_contents($htaccessPath, $htaccessContent) !== false) {
    echo ".htaccess kirjoitettu: $htaccessPath\n";
} else {
    echo "Varoitus: .htaccess-tiedoston kirjoittaminen epäonnistui (tarkista oikeudet): $htaccessPath\n";
}

// 4) Yritetään lisätä front-end lomake indexiin (etsitään paikkamerkkiä <!-- LINK_SHORTENER -->)
$snippet = <<<HTML
<!-- LINK_SHORTENER -->
<section id="link-shortener" aria-label="Linkin lyhentäjä" class="card glass">
    <h2>Lyhennä linkki</h2>
    <form id="shortener-form" aria-label="Lyhennä linkki">
        <label for="shortener-url">Linkki</label>
        <input id="shortener-url" name="url" type="url" placeholder="https://esimerkki.fi/pitka-linkki" required>
        <label for="shortener-custom">Mukautettu koodi (valinnainen)</label>
        <input id="shortener-custom" name="custom" type="text" placeholder="esim: anom123">
        <button type="submit">Lyhennä</button>
    </form>
    <div id="shortener-result" aria-live="polite"></div>
</section>
<script src="/js/shortener.js"></script>
HTML;

$indexFiles = ['index.php', 'index.html'];
$injected = false;
foreach ($indexFiles as $f) {
    $path = __DIR__ . '/' . $f;
    if (file_exists($path) && is_writable($path)) {
        $content = file_get_contents($path);
        if (strpos($content, '<!-- LINK_SHORTENER -->') !== false) {
            $content = str_replace('<!-- LINK_SHORTENER -->', $snippet, $content);
            file_put_contents($path, $content);
            echo "Link shortener -lomake lisätty paikkaan $f korvaamalla <!-- LINK_SHORTENER -->\n";
            $injected = true;
            break;
        }
    }
}

if (!$injected) {
    // Jos ei löytynyt paikkamerkkiä, lisää snippet body:n loppuun ennen </body>
    foreach ($indexFiles as $f) {
        $path = __DIR__ . '/' . $f;
        if (file_exists($path) && is_writable($path)) {
            $content = file_get_contents($path);
            if (stripos($content, '</body>') !== false) {
                $content = preg_replace('/<\/body>/i', $snippet . "\n</body>", $content, 1);
                file_put_contents($path, $content);
                echo "Link shortener -lomake lisätty tiedoston $f loppuun.\n";
                $injected = true;
                break;
            }
        }
    }
}

if (!$injected) {
    echo "Huom: En löytänyt muokattavaa index.html/index.php (tai tiedostoja ei voi kirjoittaa). Voit lisätä lyhentäjä-lomakkeen manuaalisesti:\n";
    echo $snippet . "\n";
}

echo "\nAsennus valmis. Backend endpoints:\n";
echo "- /api/shorten.php  (POST) - luo lyhennys\n";
echo "- /s/{koodi}        - uudelleenohjaa alkuperäiseen linkkiin\n";
echo "- redirect.php      - sisäinen uudelleenohjaus\n\n";
echo "Varmista, että config.php sisältää oikeat DB-asetukset (DB_HOST, DB_NAME, DB_USER, DB_PASS tai vastaavat muuttujat).\n";
echo "Poista install.php turvallisuussyistä sen jälkeen, kun asennus on valmis.\n";
?>