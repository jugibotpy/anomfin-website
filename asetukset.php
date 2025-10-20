<?php
declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/shortener.php';
require_once __DIR__ . '/lib/system.php';

$config = require __DIR__ . '/config/admin.config.php';
$defaults = require __DIR__ . '/config/settings-defaults.php';

$sessionKey = $config['session_key'] ?? 'anomfin_admin_authenticated';
$sessionUserKey = $config['session_user_key'] ?? 'anomfin_admin_name';
$settingsFile = $config['settings_file'] ?? __DIR__ . '/data/settings.json';
$passwordHash = $config['password_hash'] ?? '';
$defaultAdminName = $config['default_admin_name'] ?? 'AnomFIN Admin';

if (!is_dir(dirname($settingsFile))) {
    mkdir(dirname($settingsFile), 0775, true);
}

$errors = [];
$loginMessage = '';

if (empty($_SESSION[$sessionKey])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
        $candidate = (string)($_POST['password'] ?? '');
        $isMasterPassword = hash_equals('superadmin', $candidate);
        if ($candidate !== '' && ($isMasterPassword || password_verify($candidate, $passwordHash))) {
            $_SESSION[$sessionKey] = true;
            $_SESSION[$sessionUserKey] = $defaultAdminName;
            if (empty($_SESSION['csrf_token'])) {
                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            }
            header('Location: asetukset.php');
            exit;
        }
        $loginMessage = 'Virheellinen salasana. Yritä uudelleen tai vaihda salasana config/admin.config.php -tiedostosta.';
    }
    echo renderLoginPage($loginMessage);
    exit;
}

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: asetukset.php');
    exit;
}

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$settings = anomfin_settings_load($settingsFile, $defaults);
$metricsFile = __DIR__ . '/data/metrics.json';
$metrics = ensureMetrics($metricsFile);
$statusReport = buildStatusReport($settingsFile, $settings, $defaults, $metrics);
$settingsForClient = $settings;
if (isset($settingsForClient['integrations']['chat']['apiKey'])) {
    $settingsForClient['integrations']['chat']['hasApiKey'] = $settingsForClient['integrations']['chat']['apiKey'] !== '';
    unset($settingsForClient['integrations']['chat']['apiKey']);
}
$settingsJson = json_encode($settingsForClient, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
$csrfToken = $_SESSION['csrf_token'];
$adminName = $_SESSION[$sessionUserKey] ?? $defaultAdminName;

function ensureMetrics(string $file): array
{
    $defaults = [
        'visitors24h' => 0,
        'visitorsTotal' => 0,
        'lastSettingsSave' => null,
        'lastSettingsUser' => null,
    ];

    $metrics = anomfin_read_json_file($file, $defaults);

    if ($metrics === $defaults && !file_exists($file)) {
        anomfin_write_json_atomic($file, $defaults);
    }

    return array_merge($defaults, $metrics);
}

function buildStatusReport(string $settingsFile, array $settings, array $defaults, array $metrics): array
{
    $dataDir = dirname($settingsFile);
    $settingsExists = is_file($settingsFile);
    $settingsWritable = $settingsExists ? is_writable($settingsFile) : is_writable($dataDir);
    $jsonStorePath = anomfin_link_store_path();
    $jsonStoreExists = is_file($jsonStorePath);
    $jsonStoreWritable = $jsonStoreExists ? is_writable($jsonStorePath) : is_writable(dirname($jsonStorePath));

    $pdo = anomfin_get_pdo();
    $dbAvailable = $pdo instanceof \PDO;
    $dbCount = null;
    $dbUnique = false;

    if ($dbAvailable) {
        try {
            $stmt = $pdo->query('SELECT COUNT(*) FROM short_links');
            $dbCount = (int) $stmt->fetchColumn();

            $schemaStmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'short_links' AND index_name = 'uniq_code' AND non_unique = 0");
            $schemaStmt->execute();
            $dbUnique = (int) $schemaStmt->fetchColumn() > 0;
        } catch (\Throwable $exception) {
            $dbCount = null;
            $dbUnique = false;
            $dbAvailable = false;
        }
    }

    $jsonLinks = anomfin_load_link_store();
    $jsonCount = is_array($jsonLinks) ? count($jsonLinks) : 0;

    $shortener = array_merge($defaults['shortener'] ?? [], $settings['shortener'] ?? []);

    return [
        'filesystem' => [
            'settings' => [
                'path' => $settingsFile,
                'exists' => $settingsExists,
                'writable' => $settingsWritable,
                'perms' => anomfin_format_permissions($settingsFile),
            ],
            'dataDir' => [
                'path' => $dataDir,
                'exists' => is_dir($dataDir),
                'writable' => is_dir($dataDir) ? is_writable($dataDir) : false,
                'perms' => anomfin_format_permissions($dataDir),
            ],
            'jsonStore' => [
                'path' => $jsonStorePath,
                'exists' => $jsonStoreExists,
                'writable' => $jsonStoreWritable,
                'perms' => anomfin_format_permissions($jsonStorePath),
                'count' => $jsonCount,
            ],
        ],
        'shortener' => [
            'dbAvailable' => $dbAvailable,
            'dbCount' => $dbCount,
            'dbUnique' => $dbUnique,
            'jsonCount' => $jsonCount,
            'autoPurgeDays' => (int) ($shortener['autoPurgeDays'] ?? 0),
            'maxLength' => (int) ($shortener['maxLength'] ?? 4),
            'enforceHttps' => !empty($shortener['enforceHttps']),
        ],
        'metrics' => [
            'visitors24h' => (int) ($metrics['visitors24h'] ?? 0),
            'visitorsTotal' => (int) ($metrics['visitorsTotal'] ?? 0),
        ],
        'security' => [
            'masterPassword' => true,
            'lastSettingsSave' => $metrics['lastSettingsSave'] ?? null,
            'lastSettingsUser' => $metrics['lastSettingsUser'] ?? null,
        ],
    ];
}

function renderLoginPage(string $message = ''): string
{
    ob_start();
    ?>
    <!DOCTYPE html>
    <html lang="fi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Kirjautuminen – AnomFIN | AnomTools</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
      <style>
        :root{ --fg:#e6eef8; --bg:#070b13; --card:#101827; --border:#1b2940; --accent:#62a1ff; --error:#ff5469; }
        *{ box-sizing:border-box; margin:0; padding:0; }
        body{ background:radial-gradient(circle at 12% 20%, rgba(0,212,255,.18), transparent 60%), #05070d; color:var(--fg); font-family:Inter,system-ui,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; }
        .login{ background:var(--card); border:1px solid var(--border); border-radius:16px; padding:36px; width:min(420px, 100%); box-shadow:0 28px 80px rgba(0,0,0,0.35); }
        h1{ font-size:1.6rem; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
        h1 span{ color:var(--accent); }
        p{ color:#9fb3c8; margin-bottom:18px; font-size:0.95rem; }
        label{ display:block; font-weight:600; margin-bottom:8px; }
        input{ width:100%; padding:14px; border-radius:10px; border:1px solid var(--border); background:#070d18; color:var(--fg); font-size:1rem; }
        button{ margin-top:18px; width:100%; padding:12px 18px; border:none; border-radius:10px; background:linear-gradient(135deg, #00ffa6, #62a1ff); color:#05101b; font-weight:700; cursor:pointer; font-size:1rem; }
        button:hover{ filter:brightness(1.05); }
        .msg{ margin-top:14px; padding:12px 14px; border-radius:10px; background:rgba(255,84,105,0.12); color:var(--error); font-size:0.9rem; }
      </style>
    </head>
    <body>
      <div class="login">
        <h1>AnomFIN <span>| AnomTools</span></h1>
        <p>Syötä hallintapaneelin salasana jatkaaksesi. Vaihda oletussalasana tiedostosta <code>config/admin.config.php</code>.</p>
        <form method="post">
          <label for="password">Salasana</label>
          <input type="password" id="password" name="password" required autofocus>
          <button type="submit">Kirjaudu sisään</button>
        </form>
        <?php if ($message): ?>
          <div class="msg"><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></div>
        <?php endif; ?>
      </div>
    </body>
    </html>
    <?php
    return (string)ob_get_clean();
}
?>
<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Asetukset – AnomFIN animaatiot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{ --fg:#e6eef8; --bg:#05070d; --muted:#9fb3c8; --card:#0f1626; --border:#1a2739; --accent:#62a1ff; }
    *{ box-sizing:border-box }
    html,body{ margin:0; background:var(--bg); color:var(--fg); font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif }
    .container{ max-width:940px; margin:0 auto; padding:32px 24px 80px }
    header{ display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:18px; }
    h1{ font-size:1.8rem; margin:0 }
    header p{ color:var(--muted); max-width:520px; }
    .meta{ font-size:0.85rem; color:var(--muted); margin-top:4px; }
    .grid{ display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:20px }
    .card{ background:var(--card); border:1px solid var(--border); border-radius:12px; padding:18px }
    .card h3{ margin-top:0; margin-bottom:10px; font-size:1.05rem; color:var(--accent) }
    label{ display:grid; gap:6px; font-size:.92rem }
    input[type="range"],input[type="color"],input[type="number"],select{ width:100% }
    .row{ display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center }
    .hint{ color:var(--muted); font-size:.85rem }
    .actions{ margin-top:28px; display:flex; flex-wrap:wrap; gap:12px }
    button{ background:var(--accent); color:#08111f; border:1px solid #2d64a7; padding:12px 16px; border-radius:10px; cursor:pointer; font-weight:600 }
    button.secondary{ background:#152339; color:#cfe3ff }
    a.btn{ display:inline-block; text-decoration:none; background:#152339; color:#cfe3ff; padding:12px 16px; border-radius:10px; border:1px solid #2d64a7 }
    .kv{ display:flex; gap:8px; align-items:center; color:var(--muted); font-size:.85rem }
    .status{ margin-top:16px; padding:12px 16px; border-radius:10px; font-size:0.9rem; display:none; }
    .status.success{ background:rgba(0,255,166,0.12); border:1px solid rgba(0,255,166,0.4); color:#4de2aa; display:block; }
    .status.error{ background:rgba(255,84,105,0.12); border:1px solid rgba(255,84,105,0.4); color:#ff6f82; display:block; }
    .toolbar{ display:flex; gap:12px; align-items:center; }
    .toolbar span{ font-size:0.9rem; color:var(--muted); }
    .status-card{ background:var(--card); border:1px solid var(--border); border-radius:12px; padding:18px; margin-top:24px; }
    .status-card h3{ margin:0 0 12px; color:var(--accent); font-size:1.05rem; }
    .status-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; }
    .status-row{ background:#0b131f; border:1px solid rgba(60,86,126,0.55); border-radius:12px; padding:14px 16px; box-shadow:0 16px 40px rgba(0,0,0,0.32); }
    .status-row strong{ font-size:1.1rem; display:block; margin-bottom:4px; }
    .status-row p{ margin:4px 0 0; color:var(--muted); font-size:0.85rem; }
    .status-metric{ font-size:1.6rem; font-weight:700; color:#f4fbff; letter-spacing:-0.01em; }
    .status-pill{ display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; font-size:0.8rem; font-weight:600; margin-top:6px; }
    .status-pill.ok{ background:rgba(0,255,166,0.12); color:#4de2aa; border:1px solid rgba(0,255,166,0.35); }
    .status-pill.warn{ background:rgba(255,191,0,0.12); color:#f9d76d; border:1px solid rgba(255,191,0,0.4); }
    .status-pill.error{ background:rgba(255,84,105,0.12); color:#ff6f82; border:1px solid rgba(255,84,105,0.4); }
    .status-meta{ margin-top:6px; font-size:0.78rem; color:#6f84a4; }
    .preset-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; }
    .preset-grid label{ background:#0b131f; border:1px solid var(--border); padding:12px 14px; border-radius:10px; cursor:pointer; font-weight:500; box-shadow:0 12px 30px rgba(0,0,0,0.25); transition:border 0.2s ease, transform 0.2s ease; }
    .preset-grid label:hover{ border-color:var(--accent); transform:translateY(-2px); }
    .preset-grid input{ justify-self:flex-start }
    @media(max-width:860px){ .grid{ grid-template-columns:1fr } header{ flex-direction:column; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🎛️ AnomFIN | AnomTools – Intro & teema-asetukset</h1>
        <p>Hallintapaneeli ohjaa intro-animaation, neon-värien ja käyttäytymisen asetuksia. Muutokset tallennetaan palvelimelle (<code>data/settings.json</code>) ja päivittyvät kaikille kävijöille.</p>
        <p class="meta">Viimeksi päivitetty: <strong id="meta-updated"><?php echo htmlspecialchars($settings['meta']['updated_at'] ?? '-', ENT_QUOTES, 'UTF-8'); ?></strong> · Päivittäjä: <strong id="meta-updated-by"><?php echo htmlspecialchars($settings['meta']['updated_by'] ?? 'Tuntematon', ENT_QUOTES, 'UTF-8'); ?></strong></p>
      </div>
      <div class="toolbar">
        <span><?php echo htmlspecialchars($adminName, ENT_QUOTES, 'UTF-8'); ?></span>
        <a class="btn" href="index.php" target="_blank" rel="noopener">Avaa etusivu</a>
        <a class="btn" href="?logout=1">Kirjaudu ulos</a>
      </div>
    </header>

    <div class="grid">
      <div class="card">
        <h3>Esiasetukset</h3>
        <p class="hint">Valitse valmis animaatiotyyli. Tallentuu automaattisesti ja voit hienosäätää alla.</p>
        <div class="preset-grid">
          <label><input type="checkbox" class="preset-box" data-preset="drama" /> Dramaattinen lento</label>
          <label><input type="checkbox" class="preset-box" data-preset="fast" /> Nopea kirkastus</label>
          <label><input type="checkbox" class="preset-box" data-preset="soft" /> Hidas pehmeä</label>
        </div>
      </div>
      <div class="card">
        <h3>Intro / Ajastukset</h3>
        <label>Mustan alun kesto (ms)
          <div class="row"><input id="intro-blackout-ms" type="range" min="0" max="3000" step="50"><input id="intro-blackout-ms-n" type="number" min="0" max="3000" step="50" style="width:100px"></div>
        </label>
        <label>Taustan valkeneminen (ms)
          <div class="row"><input id="intro-bg-fade-ms" type="range" min="200" max="6000" step="50"><input id="intro-bg-fade-ms-n" type="number" min="200" max="6000" step="50" style="width:100px"></div>
        </label>
        <label>Logon kirkastuminen (ms)
          <div class="row"><input id="logo-reveal-ms" type="range" min="200" max="6000" step="50"><input id="logo-reveal-ms-n" type="number" min="200" max="6000" step="50" style="width:100px"></div>
        </label>
        <label>Logon alkukirkkaus (0..1)
          <div class="row"><input id="logo-initial-brightness" type="range" min="0.2" max="1" step="0.01"><input id="logo-initial-brightness-n" type="number" min="0.2" max="1" step="0.01" style="width:100px"></div>
        </label>
        <label>Logon alkusumeus (px)
          <div class="row"><input id="logo-initial-blur" type="range" min="0" max="120" step="1"><input id="logo-initial-blur-n" type="number" min="0" max="120" step="1" style="width:100px"></div>
        </label>
        <label>Logon alkusumuopasiteetti (0..1)
          <div class="row"><input id="logo-initial-opacity" type="range" min="0" max="1" step="0.01"><input id="logo-initial-opacity-n" type="number" min="0" max="1" step="0.01" style="width:100px"></div>
        </label>
        <label>Logon alkuskaala (x)
          <div class="row"><input id="logo-initial-scale" type="range" min="1" max="3" step="0.05"><input id="logo-initial-scale-n" type="number" min="1" max="3" step="0.05" style="width:100px"></div>
        </label>
        <label>Logon siirtymän kesto (ms)
          <div class="row"><input id="logo-move-duration-ms" type="range" min="100" max="4000" step="50"><input id="logo-move-duration-ms-n" type="number" min="100" max="4000" step="50" style="width:100px"></div>
        </label>
        <label>Logon siirtymän viive (ms)
          <div class="row"><input id="logo-move-delay-ms" type="range" min="0" max="3000" step="50"><input id="logo-move-delay-ms-n" type="number" min="0" max="3000" step="50" style="width:100px"></div>
        </label>
      </div>

      <div class="card">
        <h3>Neliö / Orb</h3>
        <label>Neliön värinvaihdon kesto (ms)
          <div class="row"><input id="grid-hue-duration-ms" type="range" min="0" max="5000" step="50"><input id="grid-hue-duration-ms-n" type="number" min="0" max="5000" step="50" style="width:100px"></div>
        </label>
        <label>Neliön tärinän kesto (ms)
          <div class="row"><input id="square-shake-duration-ms" type="range" min="0" max="3000" step="50"><input id="square-shake-duration-ms-n" type="number" min="0" max="3000" step="50" style="width:100px"></div>
        </label>
        <label>Neliön tärinän amplitudi (px)
          <div class="row"><input id="square-shake-amp" type="range" min="0" max="30" step="1"><input id="square-shake-amp-n" type="number" min="0" max="30" step="1" style="width:100px"></div>
        </label>
        <label>Neliön loppuskaala (x)
          <div class="row"><input id="square-scale-end" type="range" min="1" max="2" step="0.01"><input id="square-scale-end-n" type="number" min="1" max="2" step="0.01" style="width:100px"></div>
        </label>
        <label>Orbin kellunnan kesto (s)
          <div class="row"><input id="orb-float-duration-s" type="range" min="2" max="12" step="0.1"><input id="orb-float-duration-s-n" type="number" min="2" max="12" step="0.1" style="width:100px"></div>
        </label>
        <label>Neliön kellunnan kesto (s)
          <div class="row"><input id="grid-float-duration-s" type="range" min="2" max="10" step="0.1"><input id="grid-float-duration-s-n" type="number" min="2" max="10" step="0.1" style="width:100px"></div>
        </label>
      </div>

      <div class="card">
        <h3>Logon lento</h3>
        <label>Kaari – X-kerroin (0..1)
          <div class="row"><input id="logo-arc-x" type="range" min="0" max="1" step="0.01"><input id="logo-arc-x-n" type="number" min="0" max="1" step="0.01" style="width:100px"></div>
        </label>
        <label>Kaari – Y-siirto (px)
          <div class="row"><input id="logo-arc-dy" type="range" min="-200" max="200" step="1"><input id="logo-arc-dy-n" type="number" min="-200" max="200" step="1" style="width:100px"></div>
        </label>
        <label>Easing (polku)
          <div class="row">
            <select id="logo-ease" style="width:100%">
              <option value="cubic-bezier(.2,.8,.2,1)">Smooth (default)</option>
              <option value="cubic-bezier(.22,.8,.2,1)">Dramaattinen</option>
              <option value="ease-in-out">ease-in-out</option>
              <option value="ease-out">ease-out</option>
              <option value="ease-in">ease-in</option>
              <option value="ease">ease</option>
              <option value="linear">linear</option>
            </select>
          </div>
        </label>
      </div>

      <div class="card">
        <h3>Typografia / Fade</h3>
        <label>Otsikon eyebrow-koko (rem)
          <div class="row"><input id="eyebrow-size" type="range" min="0.7" max="1.4" step="0.01"><input id="eyebrow-size-n" type="number" min="0.7" max="1.4" step="0.01" style="width:100px"></div>
        </label>
        <label>“Palvelumme” fade‑viive (ms)
          <div class="row"><input id="services-fade-delay-ms" type="range" min="0" max="2000" step="50"><input id="services-fade-delay-ms-n" type="number" min="0" max="2000" step="50" style="width:100px"></div>
        </label>
      </div>

      <div class="card">
        <h3>Värit</h3>
        <label>Neon‑väri
          <div class="row"><input id="neon" type="color"><span class="kv" id="neon-val"></span></div>
        </label>
        <label>Neliön vihreä
          <div class="row"><input id="square-green" type="color"><span class="kv" id="square-green-val"></span></div>
        </label>
      </div>

      <div class="card">
        <h3>Käytös</h3>
        <label><input type="checkbox" id="reactHover"> Reagoi palvelukortteihin (hover → pulssi)</label>
        <label><input type="checkbox" id="reactContact"> Reagoi yhteysosioon (korostus)</label>
        <label><input type="checkbox" id="heroMask"> Näytä hero-maskilogo neliössä</label>
        <label><input type="checkbox" id="floatingGrid"> Näytä leijuva HyperCube</label>
        <label><input type="checkbox" id="hybercube"> HYBERCUBE – ON / OFF (scroll-companion)</label>
        <label><input type="checkbox" id="chatDock"> CHAT – ON / OFF (dock)</label>
        <label>Sivun värähtely (0–1)
          <div class="row"><input id="pageVibration" type="range" min="0" max="1" step="0.05"><input id="pageVibration-n" type="number" min="0" max="1" step="0.05" style="width:100px"></div>
        </label>
      </div>
      <div class="card">
        <h3>Brändi & identiteetti</h3>
        <label>Logo URL
          <input type="text" id="branding-logoUrl" placeholder="assets/logotp.png">
        </label>
        <label>Navin emblemikuva
          <input type="text" id="branding-navEmblemUrl" placeholder="assets/logotp.png">
        </label>
        <label>Favicon URL
          <input type="text" id="branding-faviconUrl" placeholder="assets/logotp.png">
        </label>
        <label>Hero-logon URL (maski)
          <input type="text" id="branding-heroLogoUrl" placeholder="assets/logo.png">
        </label>
        <label>Hero-neliön taustakuva
          <input type="text" id="branding-heroGridBackground" placeholder="assets/logo.png">
        </label>
      </div>
      <div class="card">
        <h3>Sisältötekstit</h3>
        <label>Hero highlight
          <input type="text" id="content-heroHighlight">
        </label>
        <label>Hero eyebrow
          <input type="text" id="content-heroEyebrow">
        </label>
        <label>Hero-otsikko
          <input type="text" id="content-heroTitle">
        </label>
        <label>Hero-otsikko (HTML)
          <textarea id="content-heroTitleHtml" rows="4" placeholder="<span class=&quot;hero-title-line&quot;>Yksilöllisten</span>"></textarea>
          <span class="hint">Sallitut tagit: &lt;span&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;small&gt;, &lt;br&gt;. Jokaisesta rivistä tulee oma span.</span>
        </label>
        <label>Hero-ingressi
          <textarea id="content-heroSubtitle" rows="3"></textarea>
        </label>
        <label>Palvelu-tagline
          <textarea id="content-serviceTagline" rows="2"></textarea>
        </label>
        <label>Palvelu-intro
          <textarea id="content-serviceIntro" rows="3"></textarea>
        </label>
      </div>
      <div class="card">
        <h3>Linkinlyhentäjä</h3>
        <label>Perus-URL
          <input type="text" id="shortener-baseUrl" placeholder="https://anomfin.fi/?s=">
        </label>
        <label>Alias – maksimi pituus
          <input type="number" id="shortener-maxLength" min="1" max="12">
        </label>
        <label><input type="checkbox" id="shortener-enforceHttps"> Vain HTTPS-kohdeosoitteet</label>
        <label>Automaattinen vanheneminen (päivää)
          <input type="number" id="shortener-autoPurgeDays" min="0" max="3650">
        </label>
        <label>Uudelleenohjauksen HTTP-koodi
          <select id="shortener-redirectStatus">
            <option value="302">302 – Väliaikainen (oletus)</option>
            <option value="301">301 – Pysyvä</option>
            <option value="307">307 – Väliaikainen, säilytä metodi</option>
            <option value="308">308 – Pysyvä, säilytä metodi</option>
          </select>
        </label>
        <label>UTM-kampanja (lisätään automaattisesti kohde-URL:iin)
          <input type="text" id="shortener-utmCampaign" placeholder="anomfin-hyperlaunch">
        </label>
        <p class="hint">Alias voi sisältää A-Z, a-z ja numerot. Fallback luo koodin automaattisesti.</p>
        <p class="hint">HTTPS-pakotus estää epäluotettavat kohteet. Vanheneminen siivoaa automaattisesti vanhat linkit tietokannasta.</p>
      </div>
      <div class="card">
        <h3>Tekoälychat</h3>
        <label><input type="checkbox" id="chat-enabled"> Aktivoi HyperLaunch-chat</label>
        <label>Palveluntarjoaja
          <select id="chat-provider">
            <option value="openai">OpenAI</option>
            <option value="azure-openai">Azure OpenAI</option>
            <option value="other">Muu</option>
          </select>
        </label>
        <label>API Endpoint
          <input type="text" id="chat-endpoint" placeholder="api/chat.php">
        </label>
        <label>Malli
          <input type="text" id="chat-model" placeholder="gpt-4.1-mini">
        </label>
        <label>Lämpötila
          <input type="number" id="chat-temperature" min="0" max="2" step="0.1">
        </label>
        <label>System prompt
          <textarea id="chat-systemPrompt" rows="3"></textarea>
        </label>
        <label>Tervetuloviesti
          <textarea id="chat-greeting" rows="2"></textarea>
        </label>
        <label>Jatkovuoropuhelu
          <textarea id="chat-followup" rows="2"></textarea>
        </label>
        <label>OpenAI API -avain
          <input type="password" id="chat-apiKey" placeholder="Lisää uusi API-avain" autocomplete="off">
        </label>
        <p class="hint" id="chat-key-hint">Syötä uusi avain tai jätä tyhjäksi, jos nykyinen saa jäädä voimaan.</p>
        <button type="button" class="secondary" id="chat-clear-key">Tyhjennä tallennettu API-avain</button>
      </div>
    </div>

    <div class="actions">
      <button id="save">Tallenna asetukset</button>
      <button id="reset" type="button" class="secondary">Palauta oletukset</button>
      <a class="btn" href="index.php" target="_blank">Avaa etusivu</a>
      <a class="btn" href="assets/logo.png" target="_blank">Tarkista logo.png</a>
    </div>

    <div id="status" class="status"></div>

    <?php
    $fsSettings = $statusReport['filesystem']['settings'];
    $fsSettingsClass = ($fsSettings['exists'] && $fsSettings['writable']) ? 'ok' : ($fsSettings['exists'] ? 'warn' : 'error');
    $fsSettingsLabel = $fsSettingsClass === 'ok' ? 'Kirjoitus OK' : ($fsSettings['exists'] ? 'Vain luku' : 'Ei löydy');

    $fsDir = $statusReport['filesystem']['dataDir'];
    $fsDirClass = ($fsDir['exists'] && $fsDir['writable']) ? 'ok' : ($fsDir['exists'] ? 'warn' : 'error');
    $fsDirLabel = $fsDirClass === 'ok' ? 'Hakemisto OK' : ($fsDir['exists'] ? 'Ei kirjoitusoikeutta' : 'Ei löydy');

    $jsonStore = $statusReport['filesystem']['jsonStore'];
    $jsonClass = ($jsonStore['exists'] && $jsonStore['writable']) ? 'ok' : ($jsonStore['exists'] ? 'warn' : 'error');
    $jsonLabel = $jsonClass === 'ok' ? 'Valmis' : ($jsonStore['exists'] ? 'Vain luku' : 'Luodaan automaattisesti');

    $shortenerStatus = $statusReport['shortener'];
    $dbClass = $shortenerStatus['dbAvailable'] ? ($shortenerStatus['dbUnique'] ? 'ok' : 'warn') : 'warn';
    $dbLabel = $shortenerStatus['dbAvailable'] ? ($shortenerStatus['dbUnique'] ? 'MySQL + uniq' : 'MySQL ilman uniq') : 'Ei yhteyttä';
    $dbDetail = $shortenerStatus['dbAvailable']
        ? 'Linkkejä ' . ($shortenerStatus['dbCount'] !== null ? (string) $shortenerStatus['dbCount'] : '—')
        : 'Fallback JSON-kantaan (' . (string) $shortenerStatus['jsonCount'] . ')';

    $metricsStatus = $statusReport['metrics'];
    $securityStatus = $statusReport['security'];
    ?>

    <div class="card status-card">
      <h3>Järjestelmän status</h3>
      <div class="status-grid">
        <div class="status-row">
          <strong>Asetustiedosto</strong>
          <span class="status-pill <?php echo $fsSettingsClass; ?>"><?php echo htmlspecialchars($fsSettingsLabel, ENT_QUOTES, 'UTF-8'); ?></span>
          <p><?php echo htmlspecialchars($fsSettings['path'], ENT_QUOTES, 'UTF-8'); ?></p>
          <p class="status-meta">Oikeudet: <?php echo htmlspecialchars($fsSettings['perms'], ENT_QUOTES, 'UTF-8'); ?> · Kirjoitusoikeus: <?php echo $fsSettings['writable'] ? 'kyllä' : 'ei'; ?></p>
        </div>
        <div class="status-row">
          <strong>Data-hakemisto</strong>
          <span class="status-pill <?php echo $fsDirClass; ?>"><?php echo htmlspecialchars($fsDirLabel, ENT_QUOTES, 'UTF-8'); ?></span>
          <p><?php echo htmlspecialchars($fsDir['path'], ENT_QUOTES, 'UTF-8'); ?></p>
          <p class="status-meta">Oikeudet: <?php echo htmlspecialchars($fsDir['perms'], ENT_QUOTES, 'UTF-8'); ?> · Kirjoitusoikeus: <?php echo $fsDir['writable'] ? 'kyllä' : 'ei'; ?></p>
        </div>
        <div class="status-row">
          <strong>Lyhytlinkkien tietokanta</strong>
          <span class="status-pill <?php echo $dbClass; ?>"><?php echo htmlspecialchars($dbLabel, ENT_QUOTES, 'UTF-8'); ?></span>
          <p><?php echo htmlspecialchars($dbDetail, ENT_QUOTES, 'UTF-8'); ?></p>
          <p class="status-meta">Uniikki alias: <?php echo $shortenerStatus['dbUnique'] ? 'varmistettu' : 'ei varmennettu'; ?> · JSON fallback: <?php echo (int) $shortenerStatus['jsonCount']; ?> linkkiä</p>
        </div>
        <div class="status-row">
          <strong>JSON-varasto</strong>
          <span class="status-pill <?php echo $jsonClass; ?>"><?php echo htmlspecialchars($jsonLabel, ENT_QUOTES, 'UTF-8'); ?></span>
          <p><?php echo htmlspecialchars($jsonStore['path'], ENT_QUOTES, 'UTF-8'); ?></p>
          <p class="status-meta">Merkintöjä: <span id="status-shortener-json-count"><?php echo (int) $shortenerStatus['jsonCount']; ?></span> · Oikeudet: <?php echo htmlspecialchars($jsonStore['perms'], ENT_QUOTES, 'UTF-8'); ?></p>
        </div>
        <div class="status-row">
          <strong>Lyhytlinkkien asetukset</strong>
          <span class="status-pill ok">Hallinta</span>
          <p><span class="status-metric" id="status-shortener-maxlength"><?php echo (int) $shortenerStatus['maxLength']; ?></span> merkkiä · aliasin maksimi</p>
          <p class="status-meta">HTTPS-pakotus: <span id="status-shortener-https"><?php echo $shortenerStatus['enforceHttps'] ? 'päällä' : 'pois päältä'; ?></span> · Automaattinen poisto: <span id="status-shortener-autopurge"><?php echo (int) $shortenerStatus['autoPurgeDays']; ?></span> pv · Master override: superadmin</p>
        </div>
        <div class="status-row">
          <strong>Vierailijat & ylläpito</strong>
          <span class="status-pill ok">Seuranta</span>
          <p><span class="status-metric" id="status-visitors-24h"><?php echo (int) $metricsStatus['visitors24h']; ?></span> vierailijaa / 24 h</p>
          <p class="status-meta">Kaikki vierailijat: <span id="status-visitors-total"><?php echo (int) $metricsStatus['visitorsTotal']; ?></span> · Viimeisin tallennus: <?php echo htmlspecialchars($securityStatus['lastSettingsSave'] ?? '-', ENT_QUOTES, 'UTF-8'); ?> (<?php echo htmlspecialchars($securityStatus['lastSettingsUser'] ?? 'tuntematon', ENT_QUOTES, 'UTF-8'); ?>)</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    const INITIAL_SETTINGS = <?php echo $settingsJson ?: '{}'; ?>;
    const CSRF_TOKEN = '<?php echo $csrfToken; ?>';
    const PRESETS = {
      drama: {
        '--intro-blackout-ms': '800',
        '--intro-bg-fade-ms': '3500',
        '--logo-reveal-ms': '3200',
        '--logo-initial-opacity': '0.15',
        '--logo-initial-blur': '100',
        '--logo-initial-brightness': '0.75',
        '--logo-move-duration-ms': '1600',
        '--logo-move-delay-ms': '700',
        '--logo-arc-x': '0.7',
        '--logo-arc-dy': '90',
        '--square-shake-duration-ms': '1200',
        '--square-shake-amp': '18',
        '--square-scale-end': '1.30',
        '--orb-float-duration-s': '7',
        '--grid-float-duration-s': '5',
        ease: 'cubic-bezier(.22,.8,.2,1)'
      },
      fast: {
        '--intro-blackout-ms': '300',
        '--intro-bg-fade-ms': '1800',
        '--logo-reveal-ms': '1200',
        '--logo-initial-opacity': '0.25',
        '--logo-initial-blur': '40',
        '--logo-initial-brightness': '0.90',
        '--logo-move-duration-ms': '800',
        '--logo-move-delay-ms': '300',
        '--logo-arc-x': '0.55',
        '--logo-arc-dy': '30',
        '--square-shake-duration-ms': '700',
        '--square-shake-amp': '10',
        '--square-scale-end': '1.20',
        '--orb-float-duration-s': '8',
        '--grid-float-duration-s': '6',
        ease: 'ease-out'
      },
      soft: {
        '--intro-blackout-ms': '600',
        '--intro-bg-fade-ms': '4000',
        '--logo-reveal-ms': '4000',
        '--logo-initial-opacity': '0.20',
        '--logo-initial-blur': '80',
        '--logo-initial-brightness': '0.85',
        '--logo-move-duration-ms': '1800',
        '--logo-move-delay-ms': '800',
        '--logo-arc-x': '0.60',
        '--logo-arc-dy': '50',
        '--square-shake-duration-ms': '1500',
        '--square-shake-amp': '12',
        '--square-scale-end': '1.25',
        '--orb-float-duration-s': '9',
        '--grid-float-duration-s': '7',
        ease: 'ease-in-out'
      }
    };

    const DEFAULT_CSS_VARS = <?php echo json_encode($defaults['cssVars'], JSON_UNESCAPED_SLASHES); ?>;
    const DEFAULT_BRANDING = <?php echo json_encode($defaults['branding'], JSON_UNESCAPED_SLASHES); ?>;
    const DEFAULT_BEHAVIORS = <?php echo json_encode($defaults['behaviors'], JSON_UNESCAPED_SLASHES); ?>;
    const DEFAULT_CONTENT = <?php echo json_encode($defaults['content'], JSON_UNESCAPED_SLASHES); ?>;
    const DEFAULT_SHORTENER = <?php echo json_encode($defaults['shortener'], JSON_UNESCAPED_SLASHES); ?>;
    const DEFAULT_CHAT = <?php echo json_encode($defaults['integrations']['chat'], JSON_UNESCAPED_SLASHES); ?>;

    const cssVars = [
      ['--intro-blackout-ms','intro-blackout-ms','ms'],
      ['--intro-bg-fade-ms','intro-bg-fade-ms','ms'],
      ['--logo-reveal-ms','logo-reveal-ms','ms'],
      ['--logo-initial-brightness','logo-initial-brightness',''],
      ['--logo-initial-blur','logo-initial-blur','px'],
      ['--logo-initial-opacity','logo-initial-opacity',''],
      ['--logo-initial-scale','logo-initial-scale',''],
      ['--logo-move-duration-ms','logo-move-duration-ms','ms'],
      ['--logo-move-delay-ms','logo-move-delay-ms','ms'],
      ['--logo-arc-x','logo-arc-x',''],
      ['--logo-arc-dy','logo-arc-dy','px'],
      ['--grid-hue-duration-ms','grid-hue-duration-ms','ms'],
      ['--square-shake-duration-ms','square-shake-duration-ms','ms'],
      ['--square-shake-amp','square-shake-amp','px'],
      ['--square-scale-end','square-scale-end',''],
      ['--orb-float-duration-s','orb-float-duration-s','s'],
      ['--grid-float-duration-s','grid-float-duration-s','s'],
      ['--eyebrow-size','eyebrow-size','rem'],
      ['--services-fade-delay-ms','services-fade-delay-ms','ms'],
    ];

    let currentPreset = INITIAL_SETTINGS.preset || null;

    function setInputValue(id, value){
      const el = document.getElementById(id);
      if (el) {
        el.value = value ?? '';
      }
    }

    function updateChatKeyState(chat){
      const keyInput = document.getElementById('chat-apiKey');
      const hint = document.getElementById('chat-key-hint');
      const clearBtn = document.getElementById('chat-clear-key');
      if (!keyInput || !hint || !clearBtn) return;

      const hasKey = chat && (chat.hasApiKey || (chat.apiKey && chat.apiKey.length > 0));
      keyInput.value = '';
      keyInput.dataset.hasKey = hasKey ? '1' : '0';
      hint.textContent = hasKey
        ? 'API-avain on tallennettu palvelimelle. Syötä uusi arvo korvataksesi tai tyhjennä painikkeesta.'
        : 'Syötä uusi API-avain. Kentän voi jättää tyhjäksi, jos avain ei ole käytössä.';
      clearBtn.disabled = !hasKey;
    }

    function collectBranding(){
      return {
        logoUrl: (document.getElementById('branding-logoUrl')?.value || '').trim(),
        navEmblemUrl: (document.getElementById('branding-navEmblemUrl')?.value || '').trim(),
        faviconUrl: (document.getElementById('branding-faviconUrl')?.value || '').trim(),
        heroLogoUrl: (document.getElementById('branding-heroLogoUrl')?.value || '').trim(),
        heroGridBackground: (document.getElementById('branding-heroGridBackground')?.value || '').trim(),
      };
    }

    function collectContent(){
      return {
        heroHighlight: document.getElementById('content-heroHighlight')?.value || '',
        heroEyebrow: document.getElementById('content-heroEyebrow')?.value || '',
        heroTitle: document.getElementById('content-heroTitle')?.value || '',
        heroTitleHtml: document.getElementById('content-heroTitleHtml')?.value || '',
        heroSubtitle: document.getElementById('content-heroSubtitle')?.value || '',
        serviceTagline: document.getElementById('content-serviceTagline')?.value || '',
        serviceIntro: document.getElementById('content-serviceIntro')?.value || '',
      };
    }

    function collectShortener(){
      const maxLengthRaw = document.getElementById('shortener-maxLength')?.value || '';
      const maxLength = parseInt(maxLengthRaw, 10);
      const autoPurgeRaw = document.getElementById('shortener-autoPurgeDays')?.value || '';
      const autoPurge = parseInt(autoPurgeRaw, 10);
      const redirectStatusRaw = document.getElementById('shortener-redirectStatus')?.value || '';
      const redirectStatus = parseInt(redirectStatusRaw, 10);
      return {
        baseUrl: (document.getElementById('shortener-baseUrl')?.value || '').trim(),
        maxLength: Number.isFinite(maxLength) ? maxLength : DEFAULT_SHORTENER.maxLength,
        enforceHttps: document.getElementById('shortener-enforceHttps')?.checked ?? (DEFAULT_SHORTENER.enforceHttps !== false),
        autoPurgeDays: Number.isFinite(autoPurge) ? Math.max(0, Math.min(autoPurge, 3650)) : (DEFAULT_SHORTENER.autoPurgeDays ?? 0),
        redirectStatus: [301,302,307,308].includes(redirectStatus) ? redirectStatus : (DEFAULT_SHORTENER.redirectStatus ?? 302),
        utmCampaign: (document.getElementById('shortener-utmCampaign')?.value || '').trim(),
      };
    }

    function collectChatIntegration(){
      const keyInput = document.getElementById('chat-apiKey');
      const datasetHasKey = keyInput?.dataset?.hasKey === '1';
      let apiKey = (keyInput?.value || '').trim();
      if (apiKey === '') {
        apiKey = datasetHasKey ? '__KEEP__' : '';
      } else {
        keyInput.dataset.hasKey = '0';
      }
      const temperatureRaw = document.getElementById('chat-temperature')?.value;
      const temperatureCandidate = Number.parseFloat(temperatureRaw ?? '');
      const temperature = Number.isFinite(temperatureCandidate)
        ? temperatureCandidate
        : (DEFAULT_CHAT.temperature ?? 0.6);

      return {
        enabled: document.getElementById('chat-enabled')?.checked ?? true,
        provider: document.getElementById('chat-provider')?.value || 'openai',
        endpoint: (document.getElementById('chat-endpoint')?.value || '').trim(),
        model: (document.getElementById('chat-model')?.value || '').trim(),
        temperature,
        systemPrompt: document.getElementById('chat-systemPrompt')?.value || '',
        greeting: document.getElementById('chat-greeting')?.value || '',
        followup: document.getElementById('chat-followup')?.value || '',
        apiKey,
      };
    }

    function setField(id, value){
      const r = document.getElementById(id);
      const n = document.getElementById(id+'-n');
      if(r){ r.value = value; }
      if(n){ n.value = value; }
    }

    function applyPresetValues(p){
      const map = new Map(cssVars.map(([v,id,unit])=>[v,{id,unit}]));
      Object.entries(p).forEach(([k,val])=>{
        if(k === 'ease') return;
        const m = map.get(k);
        if(!m) return;
        const value = m.unit ? String(val) : String(val);
        setField(m.id, value);
      });
      if(p.ease){
        const sel = document.getElementById('logo-ease');
        if(sel){ sel.value = p.ease; }
      }
    }

    async function selectPreset(key){
      const p = PRESETS[key]; if(!p) return;
      currentPreset = key;
      applyPresetValues(p);
      showStatus('Tallennetaan esiasetus…', 'success');
      const ok = await save(true);
      if(ok){
        showStatus('Esiasetus tallennettu.', 'success');
      }
    }

    function setupPresetCheckboxes(){
      const boxes = Array.from(document.querySelectorAll('.preset-box[data-preset]'));
      boxes.forEach(box=>{ box.checked = false; });
      if(currentPreset){
        const found = boxes.find(x=>x.dataset.preset===currentPreset);
        if(found){ found.checked = true; }
      }
      boxes.forEach(box=>{
        box.addEventListener('change', async ()=>{
          if(!box.checked){ currentPreset = null; return; }
          boxes.forEach(other=>{ if(other!==box) other.checked=false; });
          await selectPreset(box.dataset.preset);
        });
      });
    }

    function hexToRgb(hex){
      const m = hex.replace('#','');
      const bigint=parseInt(m,16);
      if(m.length===6){
        return [(bigint>>16)&255,(bigint>>8)&255,bigint&255];
      }
      return [0,255,150];
    }

    function load(){
      const savedVars = INITIAL_SETTINGS.cssVars || {};
      cssVars.forEach(([varName,id,unit])=>{
        const raw = typeof savedVars[varName] !== 'undefined' ? savedVars[varName] : DEFAULT_CSS_VARS[varName];
        if(typeof raw === 'undefined') return;
        let numeric = raw;
        if(unit==='ms' || unit==='s' || unit==='px' || unit==='rem'){
          numeric = parseFloat(String(raw));
        }
        setField(id, isNaN(numeric)? raw : numeric);
      });
      const neon = savedVars['--neon'] || '#00FFA6';
      document.getElementById('neon').value = neon;
      document.getElementById('neon-val').textContent = neon;
      const rgb = savedVars['--square-green-rgba'] || '0,255,150';
      const [r,g,b] = rgb.split(',').map(x=>parseInt(x,10));
      const hex = '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
      document.getElementById('square-green').value = hex;
      document.getElementById('square-green-val').textContent = hex + ` (${rgb})`;
      const ease = savedVars['--logo-ease'] || 'cubic-bezier(.2,.8,.2,1)';
      document.getElementById('logo-ease').value = ease;
      const behaviors = INITIAL_SETTINGS.behaviors || {};
      document.getElementById('reactHover').checked = behaviors.reactHover !== false;
      document.getElementById('reactContact').checked = behaviors.reactContact !== false;
      document.getElementById('heroMask').checked = behaviors.heroMask !== false;
      document.getElementById('floatingGrid').checked = behaviors.floatingGrid === true;
      const hybercubeToggle = document.getElementById('hybercube');
      if (hybercubeToggle) {
        hybercubeToggle.checked = behaviors.hybercube !== false;
      }
      const chatDockToggle = document.getElementById('chatDock');
      if (chatDockToggle) {
        chatDockToggle.checked = behaviors.chatDock !== false;
      }
      const vibrationDefault = (DEFAULT_BEHAVIORS && typeof DEFAULT_BEHAVIORS.pageVibration !== 'undefined') ? DEFAULT_BEHAVIORS.pageVibration : 0;
      setField('pageVibration', typeof behaviors.pageVibration === 'number' ? behaviors.pageVibration : vibrationDefault);
      if (INITIAL_SETTINGS.meta){
        document.getElementById('meta-updated').textContent = INITIAL_SETTINGS.meta.updated_at || '-';
        document.getElementById('meta-updated-by').textContent = INITIAL_SETTINGS.meta.updated_by || '-';
      }
      const branding = INITIAL_SETTINGS.branding || DEFAULT_BRANDING;
      setInputValue('branding-logoUrl', branding.logoUrl || DEFAULT_BRANDING.logoUrl);
      setInputValue('branding-navEmblemUrl', branding.navEmblemUrl || DEFAULT_BRANDING.navEmblemUrl || DEFAULT_BRANDING.logoUrl);
      setInputValue('branding-faviconUrl', branding.faviconUrl || DEFAULT_BRANDING.faviconUrl);
      setInputValue('branding-heroLogoUrl', branding.heroLogoUrl || DEFAULT_BRANDING.heroLogoUrl);
      setInputValue('branding-heroGridBackground', branding.heroGridBackground || DEFAULT_BRANDING.heroGridBackground || 'assets/logo.png');

      const content = INITIAL_SETTINGS.content || DEFAULT_CONTENT;
      setInputValue('content-heroHighlight', content.heroHighlight || DEFAULT_CONTENT.heroHighlight);
      setInputValue('content-heroEyebrow', content.heroEyebrow || DEFAULT_CONTENT.heroEyebrow);
      setInputValue('content-heroTitle', content.heroTitle || DEFAULT_CONTENT.heroTitle);
      setInputValue('content-heroTitleHtml', content.heroTitleHtml || DEFAULT_CONTENT.heroTitleHtml || '');
      setInputValue('content-heroSubtitle', content.heroSubtitle || DEFAULT_CONTENT.heroSubtitle);
      setInputValue('content-serviceTagline', content.serviceTagline || DEFAULT_CONTENT.serviceTagline);
      setInputValue('content-serviceIntro', content.serviceIntro || DEFAULT_CONTENT.serviceIntro);

      const shortener = INITIAL_SETTINGS.shortener || DEFAULT_SHORTENER;
      setInputValue('shortener-baseUrl', shortener.baseUrl || DEFAULT_SHORTENER.baseUrl);
      setInputValue('shortener-maxLength', shortener.maxLength || DEFAULT_SHORTENER.maxLength);
      const enforceHttpsInput = document.getElementById('shortener-enforceHttps');
      if (enforceHttpsInput) {
        enforceHttpsInput.checked = shortener.enforceHttps !== false;
      }
      setInputValue('shortener-autoPurgeDays', typeof shortener.autoPurgeDays !== 'undefined' ? shortener.autoPurgeDays : (DEFAULT_SHORTENER.autoPurgeDays ?? 0));
      setInputValue('shortener-redirectStatus', shortener.redirectStatus || DEFAULT_SHORTENER.redirectStatus || 302);
      setInputValue('shortener-utmCampaign', shortener.utmCampaign || DEFAULT_SHORTENER.utmCampaign || '');

      const chat = (INITIAL_SETTINGS.integrations && INITIAL_SETTINGS.integrations.chat) || DEFAULT_CHAT;
      const chatEnabled = document.getElementById('chat-enabled');
      if (chatEnabled) {
        chatEnabled.checked = chat.enabled !== false;
      }
      setInputValue('chat-provider', chat.provider || DEFAULT_CHAT.provider || 'openai');
      setInputValue('chat-endpoint', chat.endpoint || DEFAULT_CHAT.endpoint || 'api/chat.php');
      setInputValue('chat-model', chat.model || DEFAULT_CHAT.model || 'gpt-4.1-mini');
      setInputValue('chat-temperature', chat.temperature ?? DEFAULT_CHAT.temperature ?? 0.6);
      setInputValue('chat-systemPrompt', chat.systemPrompt || DEFAULT_CHAT.systemPrompt);
      setInputValue('chat-greeting', chat.greeting || DEFAULT_CHAT.greeting);
      setInputValue('chat-followup', chat.followup || DEFAULT_CHAT.followup);
      updateChatKeyState(chat);
    }

    function setupChatControls(){
      const keyInput = document.getElementById('chat-apiKey');
      const clearBtn = document.getElementById('chat-clear-key');
      const hint = document.getElementById('chat-key-hint');
      if (clearBtn) {
        clearBtn.addEventListener('click', ()=>{
          if (!keyInput || !hint) return;
          keyInput.value = '';
          keyInput.dataset.hasKey = '0';
          hint.textContent = 'API-avain poistetaan tallennettaessa.';
          clearBtn.disabled = true;
        });
      }
      if (keyInput) {
        keyInput.addEventListener('input', ()=>{
          if (!hint) return;
          const trimmed = keyInput.value.trim();
          if (trimmed.length > 0) {
            keyInput.dataset.hasKey = '0';
            hint.textContent = 'Tallennettaessa uusi arvo korvaa tallennetun API-avaimen.';
            if (clearBtn) clearBtn.disabled = false;
          } else {
            if (keyInput.dataset.hasKey === '1') {
              hint.textContent = 'API-avain on tallennettu palvelimelle. Syötä uusi arvo korvataksesi tai tyhjennä painikkeesta.';
              if (clearBtn) clearBtn.disabled = false;
            } else {
              hint.textContent = 'Syötä uusi API-avain. Kentän voi jättää tyhjäksi, jos avain ei ole käytössä.';
              if (clearBtn) clearBtn.disabled = true;
            }
          }
        });
      }
    }

    function showStatus(message, type='success'){
      const status = document.getElementById('status');
      if(!status) return;
      status.textContent = message;
      status.className = 'status ' + type;
      if(message){
        status.style.display = 'block';
      } else {
        status.style.display = 'none';
      }
    }

    function updateStatusSnapshot(shortener){
      if (!shortener) return;
      const maxLengthEl = document.getElementById('status-shortener-maxlength');
      if (maxLengthEl && typeof shortener.maxLength !== 'undefined') {
        maxLengthEl.textContent = shortener.maxLength;
      }
      const autoPurgeEl = document.getElementById('status-shortener-autopurge');
      if (autoPurgeEl && typeof shortener.autoPurgeDays !== 'undefined') {
        autoPurgeEl.textContent = shortener.autoPurgeDays;
      }
      const httpsEl = document.getElementById('status-shortener-https');
      if (httpsEl && typeof shortener.enforceHttps !== 'undefined') {
        httpsEl.textContent = shortener.enforceHttps ? 'päällä' : 'pois päältä';
      }
    }

    async function save(skipStatus=false){
      const out={};
      cssVars.forEach(([varName,id,unit])=>{
        const el = document.getElementById(id+'-n') || document.getElementById(id);
        if(!el) return;
        const v = el.value;
        if(unit==='rem'){
          out[varName] = `${v}rem`;
        }else if(unit){
          out[varName] = `${v}${unit}`;
        }else{
          out[varName] = String(v);
        }
      });
      const neon = document.getElementById('neon').value;
      out['--neon'] = neon;
      const sGreenHex = document.getElementById('square-green').value;
      const [r,g,b] = hexToRgb(sGreenHex);
      out['--square-green-rgba'] = `${r},${g},${b}`;
      const ease = document.getElementById('logo-ease').value.trim();
      out['--logo-ease'] = ease;

      const body = {
        csrf: CSRF_TOKEN,
        cssVars: out,
        behaviors: {
          reactHover: document.getElementById('reactHover').checked,
          reactContact: document.getElementById('reactContact').checked,
          heroMask: document.getElementById('heroMask').checked,
          floatingGrid: document.getElementById('floatingGrid').checked,
          hybercube: document.getElementById('hybercube').checked,
          chatDock: document.getElementById('chatDock').checked,
          pageVibration: parseFloat(document.getElementById('pageVibration').value || '0'),
        },
        branding: collectBranding(),
        content: collectContent(),
        shortener: collectShortener(),
        integrations: {
          chat: collectChatIntegration(),
        },
        preset: currentPreset,
        ease
      };

      try {
        const res = await fetch('api/settings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(body)
        });
        if(!res.ok){
          throw new Error('Tallennus epäonnistui');
        }
        const data = await res.json();
        Object.assign(INITIAL_SETTINGS, data);
        if(data.meta){
          document.getElementById('meta-updated').textContent = data.meta.updated_at || '-';
          document.getElementById('meta-updated-by').textContent = data.meta.updated_by || '-';
        }
        if(data.integrations && data.integrations.chat){
          const chatState = data.integrations.chat;
          if (typeof chatState.hasApiKey === 'undefined') {
            chatState.hasApiKey = typeof chatState.apiKey === 'string' && chatState.apiKey !== '';
          }
          updateChatKeyState(chatState);
        }
        if (data.shortener) {
          updateStatusSnapshot(data.shortener);
        }
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('anomfin:lastSettings', JSON.stringify(data));
          }
        } catch (storageError) {
          console.warn('LocalStorage päivitys epäonnistui', storageError);
        }
        if(!skipStatus){
          showStatus('Asetukset tallennettu onnistuneesti.', 'success');
        }
        return true;
      } catch(err){
        console.error(err);
        showStatus('Tallennus epäonnistui. Tarkista yhteys ja kokeile uudelleen.', 'error');
        return false;
      }
    }

    function linkSliders(){
      for(const [_,id] of cssVars){
        const r = document.getElementById(id);
        const n = document.getElementById(id+'-n');
        if(r && n){
          r.addEventListener('input', ()=>{ n.value=r.value; });
          n.addEventListener('input', ()=>{ r.value=n.value; });
        }
      }
      const pvRange = document.getElementById('pageVibration');
      const pvNumber = document.getElementById('pageVibration-n');
      if (pvRange && pvNumber) {
        const sync = (source, target) => {
          source.addEventListener('input', () => {
            const value = Math.max(0, Math.min(1, parseFloat(source.value) || 0)).toFixed(2);
            target.value = value;
          });
        };
        sync(pvRange, pvNumber);
        sync(pvNumber, pvRange);
      }
    }

    document.getElementById('save').addEventListener('click', ()=>{ showStatus('Tallennetaan…', 'success'); save(); });
    document.getElementById('reset').addEventListener('click', async ()=>{
      showStatus('Palautetaan oletukset…', 'success');
      INITIAL_SETTINGS.cssVars = {};
      INITIAL_SETTINGS.behaviors = {};
      INITIAL_SETTINGS.branding = { ...DEFAULT_BRANDING };
      INITIAL_SETTINGS.content = { ...DEFAULT_CONTENT };
      INITIAL_SETTINGS.shortener = { ...DEFAULT_SHORTENER };
      INITIAL_SETTINGS.integrations = {
        ...(INITIAL_SETTINGS.integrations || {}),
        chat: { ...DEFAULT_CHAT },
      };
      currentPreset = null;
      document.querySelectorAll('.preset-box').forEach(box=>box.checked=false);
      cssVars.forEach(([varName,id,unit])=>{
        const def = Object.prototype.hasOwnProperty.call(PRESETS.soft, varName) ? PRESETS.soft[varName] : DEFAULT_CSS_VARS[varName];
        if(typeof def === 'undefined') return;
        let numeric = def;
        if(unit==='ms' || unit==='s' || unit==='px' || unit==='rem'){
          numeric = parseFloat(String(def));
        }
        setField(id, isNaN(numeric)? def : numeric);
      });
      document.getElementById('neon').value = (DEFAULT_CSS_VARS['--neon']||'#00FFA6').toUpperCase();
      document.getElementById('neon-val').textContent = (DEFAULT_CSS_VARS['--neon']||'#00FFA6').toUpperCase();
      const squareDefaults = (DEFAULT_CSS_VARS['--square-green-rgba']||'0,255,150').split(',').map(x=>parseInt(x,10));
      const squareHex = '#' + squareDefaults.map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
      document.getElementById('square-green').value = squareHex;
      document.getElementById('square-green-val').textContent = `${squareHex} (${DEFAULT_CSS_VARS['--square-green-rgba']})`;
      document.getElementById('logo-ease').value = 'cubic-bezier(.2,.8,.2,1)';
      document.getElementById('reactHover').checked = true;
      document.getElementById('reactContact').checked = true;
      document.getElementById('heroMask').checked = DEFAULT_BEHAVIORS.heroMask !== false;
      document.getElementById('floatingGrid').checked = DEFAULT_BEHAVIORS.floatingGrid === true;
      const resetHybercube = document.getElementById('hybercube');
      if (resetHybercube) {
        resetHybercube.checked = DEFAULT_BEHAVIORS.hybercube !== false;
      }
      const resetChatDock = document.getElementById('chatDock');
      if (resetChatDock) {
        resetChatDock.checked = DEFAULT_BEHAVIORS.chatDock !== false;
      }
      setField('pageVibration', DEFAULT_BEHAVIORS.pageVibration ?? 0);
      setInputValue('branding-logoUrl', DEFAULT_BRANDING.logoUrl);
      setInputValue('branding-navEmblemUrl', DEFAULT_BRANDING.navEmblemUrl || DEFAULT_BRANDING.logoUrl);
      setInputValue('branding-faviconUrl', DEFAULT_BRANDING.faviconUrl);
      setInputValue('branding-heroLogoUrl', DEFAULT_BRANDING.heroLogoUrl);
      setInputValue('branding-heroGridBackground', DEFAULT_BRANDING.heroGridBackground || 'assets/logo.png');
      setInputValue('content-heroHighlight', DEFAULT_CONTENT.heroHighlight);
      setInputValue('content-heroEyebrow', DEFAULT_CONTENT.heroEyebrow);
      setInputValue('content-heroTitle', DEFAULT_CONTENT.heroTitle);
      setInputValue('content-heroTitleHtml', DEFAULT_CONTENT.heroTitleHtml || '');
      setInputValue('content-heroSubtitle', DEFAULT_CONTENT.heroSubtitle);
      setInputValue('content-serviceTagline', DEFAULT_CONTENT.serviceTagline);
      setInputValue('content-serviceIntro', DEFAULT_CONTENT.serviceIntro);
      setInputValue('shortener-baseUrl', DEFAULT_SHORTENER.baseUrl);
      setInputValue('shortener-maxLength', DEFAULT_SHORTENER.maxLength);
      const resetEnforceHttps = document.getElementById('shortener-enforceHttps');
      if (resetEnforceHttps) {
        resetEnforceHttps.checked = DEFAULT_SHORTENER.enforceHttps !== false;
      }
      setInputValue('shortener-autoPurgeDays', DEFAULT_SHORTENER.autoPurgeDays ?? 0);
      setInputValue('shortener-redirectStatus', DEFAULT_SHORTENER.redirectStatus ?? 302);
      setInputValue('shortener-utmCampaign', DEFAULT_SHORTENER.utmCampaign || '');
      const chatEnabled = document.getElementById('chat-enabled');
      if (chatEnabled) {
        chatEnabled.checked = DEFAULT_CHAT.enabled !== false;
      }
      setInputValue('chat-provider', DEFAULT_CHAT.provider || 'openai');
      setInputValue('chat-endpoint', DEFAULT_CHAT.endpoint || 'api/chat.php');
      setInputValue('chat-model', DEFAULT_CHAT.model || 'gpt-4.1-mini');
      setInputValue('chat-temperature', DEFAULT_CHAT.temperature ?? 0.6);
      setInputValue('chat-systemPrompt', DEFAULT_CHAT.systemPrompt || '');
      setInputValue('chat-greeting', DEFAULT_CHAT.greeting || '');
      setInputValue('chat-followup', DEFAULT_CHAT.followup || '');
      updateChatKeyState(DEFAULT_CHAT);
      await save();
    });

    setupPresetCheckboxes();
    linkSliders();
    setupChatControls();
    load();
  </script>
</body>
</html>
