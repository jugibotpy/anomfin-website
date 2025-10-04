<?php
declare(strict_types=1);

session_start();

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
        if ($candidate !== '' && password_verify($candidate, $passwordHash)) {
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

$settings = loadSettings($settingsFile, $defaults);
$settingsJson = json_encode($settings, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
$csrfToken = $_SESSION['csrf_token'];
$adminName = $_SESSION[$sessionUserKey] ?? $defaultAdminName;

function loadSettings(string $file, array $defaults): array
{
    if (!file_exists($file)) {
        file_put_contents($file, json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $defaults;
    }
    $data = json_decode((string)file_get_contents($file), true);
    if (!is_array($data)) {
        return $defaults;
    }
    if (isset($data['cssVars']) && is_array($data['cssVars'])) {
        $data['cssVars'] = array_merge($defaults['cssVars'], $data['cssVars']);
    } else {
        $data['cssVars'] = $defaults['cssVars'];
    }
    if (isset($data['behaviors']) && is_array($data['behaviors'])) {
        $data['behaviors'] = array_merge($defaults['behaviors'], $data['behaviors']);
    } else {
        $data['behaviors'] = $defaults['behaviors'];
    }
    if (!array_key_exists('preset', $data)) {
        $data['preset'] = $defaults['preset'];
    }
    if (isset($data['meta']) && is_array($data['meta'])) {
        $data['meta'] = array_merge($defaults['meta'], $data['meta']);
    } else {
        $data['meta'] = $defaults['meta'];
    }
    return $data;
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
        <a class="btn" href="index.html" target="_blank" rel="noopener">Avaa etusivu</a>
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
      </div>
    </div>

    <div class="actions">
      <button id="save">Tallenna asetukset</button>
      <button id="reset" type="button" class="secondary">Palauta oletukset</button>
      <a class="btn" href="index.html" target="_blank">Avaa etusivu</a>
      <a class="btn" href="assets/logo.png" target="_blank">Tarkista logo.png</a>
    </div>

    <div id="status" class="status"></div>
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
      if (INITIAL_SETTINGS.meta){
        document.getElementById('meta-updated').textContent = INITIAL_SETTINGS.meta.updated_at || '-';
        document.getElementById('meta-updated-by').textContent = INITIAL_SETTINGS.meta.updated_by || '-';
      }
    }

    function showStatus(message, type='success'){
      const status = document.getElementById('status');
      status.textContent = message;
      status.className = 'status ' + type;
      if(message){
        status.style.display = 'block';
      } else {
        status.style.display = 'none';
      }
    }

    async function save(skipStatus){
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
        },
        preset: currentPreset,
        ease
      };

      try {
        const res = await fetch('api/settings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    }

    document.getElementById('save').addEventListener('click', ()=>{ showStatus('Tallennetaan…', 'success'); save(); });
    document.getElementById('reset').addEventListener('click', async ()=>{
      showStatus('Palautetaan oletukset…', 'success');
      INITIAL_SETTINGS.cssVars = {};
      INITIAL_SETTINGS.behaviors = {};
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
      await save();
    });

    setupPresetCheckboxes();
    linkSliders();
    load();
  </script>
</body>
</html>
