<?php
/**
 * AnomFIN Simple Installation
 * 
 * ONE-TIME setup wizard - automatically looks for existing database connection files
 * Run this once after uploading files to your web hosting
 * 
 * @package AnomFIN
 * @version 1.0.0
 */

// Start session
session_start();

// ONE-TIME CHECK: If .env exists, installation is complete
$envExists = file_exists(__DIR__ . '/.env');
$installationComplete = false;

if ($envExists && !isset($_GET['force'])) {
    $installationComplete = true;
}

// Security: Generate CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Auto-detect existing database connection files
$detectedConfig = [];
$connectionFiles = ['connect.php', 'connection.php', 'database.php', 'config.php', 'db.php'];

foreach ($connectionFiles as $file) {
    if (file_exists(__DIR__ . '/' . $file)) {
        $detectedConfig['connection_file'] = $file;
        // Try to read database config from the file
        $content = file_get_contents(__DIR__ . '/' . $file);
        
        // Look for common database patterns
        if (preg_match('/DB_HOST["\']?\s*[=:]\s*["\']?([^"\';\s]+)/i', $content, $matches)) {
            $detectedConfig['db_host'] = $matches[1];
        }
        if (preg_match('/DB_NAME["\']?\s*[=:]\s*["\']?([^"\';\s]+)/i', $content, $matches)) {
            $detectedConfig['db_name'] = $matches[1];
        }
        if (preg_match('/DB_USER["\']?\s*[=:]\s*["\']?([^"\';\s]+)/i', $content, $matches)) {
            $detectedConfig['db_user'] = $matches[1];
        }
        if (preg_match('/DB_PASSWORD["\']?\s*[=:]\s*["\']?([^"\';\s]+)/i', $content, $matches)) {
            $detectedConfig['db_password'] = $matches[1];
        }
        if (preg_match('/DB_PORT["\']?\s*[=:]\s*["\']?(\d+)/i', $content, $matches)) {
            $detectedConfig['db_port'] = (int) $matches[1];
        }
        if (preg_match('/localhost|127\.0\.0\.1/i', $content) && !isset($detectedConfig['db_host'])) {
            $detectedConfig['db_host'] = 'localhost';
        }
        break;
    }
}

/**
 * Parse simple KEY=VALUE formatted files (like .env)
 */
function anomfin_parse_env_file(string $path): array
{
    if (!is_readable($path)) {
        return [];
    }

    $result = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || strpos($trimmed, '#') === 0) {
            continue;
        }

        if (strpos($trimmed, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $trimmed, 2);
        $result[trim($key)] = trim($value);
    }

    return $result;
}

$forceInstall = isset($_GET['force']);
$existingDatabaseReady = false;
$installationSource = null;
$dbCheckStatus = null;

if ($envExists && !$forceInstall) {
    $installationComplete = true;
    $installationSource = 'env';
}

$envConfig = $envExists ? anomfin_parse_env_file(__DIR__ . '/.env') : [];

$connectionConfig = [
    'db_host' => $envConfig['DB_HOST'] ?? ($detectedConfig['db_host'] ?? null),
    'db_name' => $envConfig['DB_NAME'] ?? ($detectedConfig['db_name'] ?? null),
    'db_user' => $envConfig['DB_USER'] ?? ($detectedConfig['db_user'] ?? null),
    'db_password' => $envConfig['DB_PASSWORD'] ?? ($detectedConfig['db_password'] ?? ''),
    'db_port' => (int) ($envConfig['DB_PORT'] ?? ($detectedConfig['db_port'] ?? 3306)),
];

if (!$installationComplete && !$forceInstall && $connectionConfig['db_host'] && $connectionConfig['db_name'] && $connectionConfig['db_user']) {
    try {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $connectionConfig['db_host'],
            $connectionConfig['db_port'],
            $connectionConfig['db_name']
        );

        $pdo = new PDO($dsn, $connectionConfig['db_user'], $connectionConfig['db_password'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        $requiredTables = ['contact_messages', 'site_settings'];
        $missingTables = [];

        foreach ($requiredTables as $table) {
            $stmt = $pdo->prepare('SHOW TABLES LIKE :table');
            $stmt->execute(['table' => $table]);
            if ($stmt->rowCount() === 0) {
                $missingTables[] = $table;
            }
        }

        if (empty($missingTables)) {
            $existingDatabaseReady = true;
            $installationComplete = true;
            $installationSource = 'database';
            $dbCheckStatus = [
                'type' => 'success',
                'message' => 'Asennusohjelma havaitsi olemassa olevan tietokantayhteyden ja vaaditut taulut.',
            ];
        } else {
            $dbCheckStatus = [
                'type' => 'warning',
                'message' => 'Tietokantayhteys löytyi, mutta seuraavat taulut puuttuvat: ' . implode(', ', $missingTables) . '.',
            ];
        }
    } catch (PDOException $e) {
        $dbCheckStatus = [
            'type' => 'error',
            'message' => 'Tietokantayhteyden tarkistus epäonnistui: ' . $e->getMessage(),
        ];
    }
}

$errors = [];
$success = false;

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$installationComplete) {
    // Verify CSRF token
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        $errors[] = 'Virheellinen turvallisuustunniste. Yritä uudelleen.';
    } else {
        // Validate inputs
        $dbHost = filter_input(INPUT_POST, 'db_host', FILTER_SANITIZE_STRING) ?: 'localhost';
        $dbName = filter_input(INPUT_POST, 'db_name', FILTER_SANITIZE_STRING);
        $dbUser = filter_input(INPUT_POST, 'db_user', FILTER_SANITIZE_STRING);
        $dbPassword = $_POST['db_password'] ?? '';
        $dbPort = filter_input(INPUT_POST, 'db_port', FILTER_VALIDATE_INT) ?: 3306;
        $aiApiKey = filter_input(INPUT_POST, 'ai_api_key', FILTER_SANITIZE_STRING) ?: '';
        
        // Basic validation
        if (empty($dbName)) {
            $errors[] = 'Tietokannan nimi on pakollinen.';
        }
        if (empty($dbUser)) {
            $errors[] = 'Tietokannan käyttäjätunnus on pakollinen.';
        }
        
        // If no errors, test connection and save
        if (empty($errors)) {
            try {
                // Test database connection
                $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
                $testConn = new PDO($dsn, $dbUser, $dbPassword, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 5
                ]);
                
                // Connection successful, create .env file
                $envContent = "# AnomFIN Configuration - Created: " . date('Y-m-d H:i:s') . "\n\n";
                $envContent .= "# Database Configuration\n";
                $envContent .= "DB_HOST={$dbHost}\n";
                $envContent .= "DB_NAME={$dbName}\n";
                $envContent .= "DB_USER={$dbUser}\n";
                $envContent .= "DB_PASSWORD={$dbPassword}\n";
                $envContent .= "DB_PORT={$dbPort}\n";
                $envContent .= "DB_CHARSET=utf8mb4\n\n";
                
                if (!empty($aiApiKey)) {
                    $envContent .= "# AI Service Configuration\n";
                    $envContent .= "AI_API_KEY={$aiApiKey}\n";
                    $envContent .= "AI_API_URL=https://api.openai.com/v1\n";
                    $envContent .= "AI_MODEL=gpt-3.5-turbo\n";
                    $envContent .= "AI_MAX_TOKENS=1000\n";
                    $envContent .= "AI_TEMPERATURE=0.7\n\n";
                }
                
                $envContent .= "# Application Settings\n";
                $envContent .= "APP_ENV=production\n";
                $envContent .= "APP_DEBUG=false\n";
                $envContent .= "APP_URL=" . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . "\n\n";
                $envContent .= "# Security Settings\n";
                $envContent .= "SESSION_SECRET=" . bin2hex(random_bytes(32)) . "\n";
                $envContent .= "ENCRYPTION_KEY=" . bin2hex(random_bytes(32)) . "\n";
                
                // Write .env file
                if (file_put_contents(__DIR__ . '/.env', $envContent) !== false) {
                    @chmod(__DIR__ . '/.env', 0600);

                    // Create admin.php if it doesn't exist
                    if (!file_exists(__DIR__ . '/admin.php')) {
                        createAdminPage();
                    }

                    $success = true;
                    $installationComplete = true;
                    $installationSource = 'fresh';
                } else {
                    $errors[] = 'Tiedoston .env luominen epäonnistui. Tarkista kirjoitusoikeudet.';
                }

            } catch (PDOException $e) {
                $errors[] = 'Tietokantayhteys epäonnistui: ' . htmlspecialchars($e->getMessage());
            }
        }
    }
}

/**
 * Create admin.php page for AI control and settings
 */
function createAdminPage() {
    $adminContent = '<?php
/**
 * AnomFIN Admin Panel
 * Viestien hallinta, AI-ohjaus ja etusivun asetukset
 */

session_start();
require_once __DIR__ . \'/connect.php\';

// Yksinkertainen autentikointi (VAIHDA SALASANA!)
$adminPassword = "admin123"; // VAIHDA TÄMÄ HETI!

// Kirjautuminen
if (!isset($_SESSION[\'admin_logged_in\'])) {
    if ($_SERVER[\'REQUEST_METHOD\'] === \'POST\' && isset($_POST[\'password\'])) {
        if ($_POST[\'password\'] === $adminPassword) {
            $_SESSION[\'admin_logged_in\'] = true;
            header(\'Location: admin.php\');
            exit;
        }
    }
    ?>
    <!DOCTYPE html>
    <html lang="fi">
    <head>
        <meta charset="UTF-8">
        <title>Kirjautuminen - AnomFIN Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>
            :root { --bg:#0b0f1a; --card:#11192a; --border:#1e2a3a; --accent:#62a1ff; --fg:#e6eef8; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Inter, sans-serif; background: var(--bg); color: var(--fg); display: flex; justify-content: center; align-items: center; height: 100vh; }
            .login { background: var(--card); padding: 40px; border-radius: 12px; border: 1px solid var(--border); min-width: 320px; }
            h2 { margin-bottom: 24px; color: var(--accent); }
            input { width: 100%; padding: 12px; margin: 10px 0; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--fg); font-size: 1rem; }
            button { width: 100%; background: var(--accent); color: #08111f; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; margin-top: 10px; }
            button:hover { opacity: 0.9; }
        </style>
    </head>
    <body>
        <div class="login">
            <h2>🔐 Admin Kirjautuminen</h2>
            <form method="POST">
                <input type="password" name="password" placeholder="Salasana" required autofocus>
                <button type="submit">Kirjaudu</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Kirjaudu ulos
if (isset($_GET[\'logout\'])) {
    session_destroy();
    header(\'Location: admin.php\');
    exit;
}

// Luo viestit-taulu jos ei ole
try {
    $db = getDbConnection();
    $db->exec("
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company VARCHAR(255),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            message TEXT NOT NULL,
            status ENUM(\'new\', \'read\', \'replied\') DEFAULT \'new\',
            admin_reply TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Luo asetukset-taulu
    $db->exec("
        CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (Exception $e) {
    // Jatka vaikka tauluja ei voida luoda
}

// Käsittele viestiin vastaaminen
if ($_SERVER[\'REQUEST_METHOD\'] === \'POST\' && isset($_POST[\'reply_message\'])) {
    $messageId = filter_input(INPUT_POST, \'message_id\', FILTER_VALIDATE_INT);
    $reply = $_POST[\'reply_text\'] ?? \'\';
    
    if ($messageId && !empty($reply)) {
        $stmt = $db->prepare("UPDATE contact_messages SET admin_reply = ?, status = \'replied\', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$reply, $messageId]);
    }
}

// Hae viestit
$messages = [];
try {
    $stmt = $db->query("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 50");
    $messages = $stmt->fetchAll();
} catch (Exception $e) {
    // Ei viestejä
}

// Hae/tallenna etusivun asetukset
$siteSettings = [
    \'site_title\' => \'AnomFIN\',
    \'site_description\' => \'Kyberturva ja sovelluskehitys\',
    \'contact_email\' => \'info@anomfin.fi\',
    \'telegram_enabled\' => \'0\'
];

if ($_SERVER[\'REQUEST_METHOD\'] === \'POST\' && isset($_POST[\'save_settings\'])) {
    foreach ([\'site_title\', \'site_description\', \'contact_email\', \'telegram_enabled\'] as $key) {
        if (isset($_POST[$key])) {
            $stmt = $db->prepare("REPLACE INTO site_settings (setting_key, setting_value) VALUES (?, ?)");
            $stmt->execute([$key, $_POST[$key]]);
            $siteSettings[$key] = $_POST[$key];
        }
    }
}

try {
    $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings");
    while ($row = $stmt->fetch()) {
        $siteSettings[$row[\'setting_key\']] = $row[\'setting_value\'];
    }
} catch (Exception $e) {
    // Käytä oletusarvoja
}
?>
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Paneeli - AnomFIN</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --fg:#e6eef8; --bg:#0b0f1a; --card:#11192a; --border:#1e2a3a; --accent:#62a1ff; --success:#00ffa6; --warning:#ffaa00; --error:#ff4444; --muted:#9fb3c8; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--fg); font-family: Inter, sans-serif; padding: 20px; line-height: 1.6; }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 { margin-bottom: 30px; font-size: 2rem; background: linear-gradient(135deg, var(--accent), var(--success)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
        .card h2 { color: var(--accent); margin-bottom: 16px; font-size: 1.3rem; }
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid var(--border); }
        .tab { padding: 12px 24px; cursor: pointer; background: none; border: none; color: var(--muted); font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; }
        .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .tab:hover { color: var(--fg); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        button, a.btn { background: var(--accent); color: #08111f; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block; margin: 5px 5px 5px 0; font-size: 0.95rem; }
        button:hover, a.btn:hover { opacity: 0.9; }
        .btn-small { padding: 6px 12px; font-size: 0.85rem; }
        .danger { background: var(--error); color: white; }
        .success { background: var(--success); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .message-item { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 12px; }
        .message-item.new { border-left: 4px solid var(--warning); }
        .message-item.replied { border-left: 4px solid var(--success); }
        .message-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .message-meta { color: var(--muted); font-size: 0.85rem; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
        .badge.new { background: var(--warning); color: #000; }
        .badge.replied { background: var(--success); color: #000; }
        .badge.read { background: var(--muted); color: #000; }
        textarea { width: 100%; padding: 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--fg); font-family: inherit; resize: vertical; min-height: 100px; }
        input[type="text"], input[type="email"] { width: 100%; padding: 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--fg); font-family: inherit; margin: 8px 0; }
        label { display: block; margin-top: 12px; font-weight: 500; }
        .form-group { margin-bottom: 16px; }
        .info-box { background: rgba(98, 161, 255, 0.1); border: 1px solid var(--accent); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .warning-box { background: rgba(255, 170, 0, 0.1); border: 1px solid var(--warning); border-radius: 8px; padding: 16px; margin-bottom: 16px; color: var(--warning); }
        .telegram-placeholder { background: rgba(98, 161, 255, 0.05); border: 2px dashed var(--accent); border-radius: 8px; padding: 32px; text-align: center; color: var(--muted); }
        @media(max-width: 768px) { .grid { grid-template-columns: 1fr; } .tabs { flex-wrap: wrap; } }
    </style>
</head>
<body>
    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h1>🎛️ AnomFIN Admin</h1>
            <a href="?logout=1" class="btn danger btn-small">Kirjaudu ulos</a>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="switchTab(\'messages\')">📧 Viestit <?php if (count(array_filter($messages, fn($m) => $m[\'status\'] === \'new\')) > 0) echo \'(\' . count(array_filter($messages, fn($m) => $m[\'status\'] === \'new\')) . \')\'; ?></button>
            <button class="tab" onclick="switchTab(\'ai\')">🤖 AI-ohjaus</button>
            <button class="tab" onclick="switchTab(\'settings\')">⚙️ Etusivun asetukset</button>
            <button class="tab" onclick="switchTab(\'telegram\')">📱 Telegram</button>
            <button class="tab" onclick="switchTab(\'system\')">🔧 Järjestelmä</button>
        </div>

        <div id="tab-messages" class="tab-content active">
            <div class="card">
                <h2>Yhteydenottolomakkeen viestit</h2>
                <?php if (empty($messages)): ?>
                    <p style="color: var(--muted);">Ei viestejä vielä. Viestit tallentuvat tähän kun joku täyttää yhteydenottolomakkeen.</p>
                <?php else: ?>
                    <?php foreach ($messages as $msg): ?>
                        <div class="message-item <?php echo $msg[\'status\']; ?>">
                            <div class="message-header">
                                <div>
                                    <strong><?php echo htmlspecialchars($msg[\'name\']); ?></strong>
                                    <?php if ($msg[\'company\']): ?>
                                        <span style="color: var(--muted);"> - <?php echo htmlspecialchars($msg[\'company\']); ?></span>
                                    <?php endif; ?>
                                    <span class="badge <?php echo $msg[\'status\']; ?>"><?php echo [\'new\'=>\'Uusi\',\'read\'=>\'Luettu\',\'replied\'=>\'Vastattu\'][$msg[\'status\']]; ?></span>
                                </div>
                                <div class="message-meta"><?php echo date(\'d.m.Y H:i\', strtotime($msg[\'created_at\'])); ?></div>
                            </div>
                            <div class="message-meta" style="margin-bottom: 8px;">
                                📧 <?php echo htmlspecialchars($msg[\'email\']); ?>
                                <?php if ($msg[\'phone\']): ?>
                                    | 📞 <?php echo htmlspecialchars($msg[\'phone\']); ?>
                                <?php endif; ?>
                            </div>
                            <p style="margin-bottom: 12px;"><strong>Viesti:</strong><br><?php echo nl2br(htmlspecialchars($msg[\'message\'])); ?></p>
                            <?php if ($msg[\'admin_reply\']): ?>
                                <div style="background: rgba(0, 255, 166, 0.1); padding: 12px; border-radius: 6px; border-left: 3px solid var(--success); margin-top: 12px;">
                                    <strong>Sinun vastauksesi:</strong><br>
                                    <?php echo nl2br(htmlspecialchars($msg[\'admin_reply\'])); ?>
                                </div>
                            <?php else: ?>
                                <form method="POST" style="margin-top: 12px;">
                                    <input type="hidden" name="message_id" value="<?php echo $msg[\'id\']; ?>">
                                    <textarea name="reply_text" placeholder="Kirjoita vastauksesi tähän..." required></textarea>
                                    <button type="submit" name="reply_message" class="success btn-small">Lähetä vastaus</button>
                                </form>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <div id="tab-ai" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h2>AI-yhteys</h2>
                    <p style="color: var(--muted); margin-bottom: 16px;">Hallitse ChatGPT/OpenAI yhteyttä</p>
                    <a href="ai_connect.php" class="btn">Avaa AI-käyttöliittymä</a>
                    <p style="color: var(--muted); font-size: 0.85rem; margin-top: 12px;">
                        AI-avain: <?php echo getenv(\'AI_API_KEY\') ? \'✓ Määritetty\' : \'✗ Ei määritetty\'; ?>
                    </p>
                </div>
                <div class="card">
                    <h2>AI-kyselyt</h2>
                    <p style="color: var(--muted); margin-bottom: 16px;">Testaa ja tarkastele AI-kyselyitä</p>
                    <a href="ai_connect.php?action=history" class="btn">Kyselyhistoria</a>
                </div>
            </div>
        </div>

        <div id="tab-settings" class="tab-content">
            <div class="card">
                <h2>Etusivun asetukset</h2>
                <form method="POST">
                    <div class="form-group">
                        <label>Sivuston otsikko</label>
                        <input type="text" name="site_title" value="<?php echo htmlspecialchars($siteSettings[\'site_title\']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Sivuston kuvaus</label>
                        <input type="text" name="site_description" value="<?php echo htmlspecialchars($siteSettings[\'site_description\']); ?>">
                    </div>
                    <div class="form-group">
                        <label>Yhteyssähköposti</label>
                        <input type="email" name="contact_email" value="<?php echo htmlspecialchars($siteSettings[\'contact_email\']); ?>" required>
                    </div>
                    <button type="submit" name="save_settings" class="success">Tallenna asetukset</button>
                </form>
            </div>
        </div>

        <div id="tab-telegram" class="tab-content">
            <div class="card">
                <h2>Telegram-integraatio</h2>
                <div class="info-box">
                    <strong>🚀 Tuleva ominaisuus!</strong><br>
                    Telegram-integraatio on kehityksessä ja julkaistaan pian.
                </div>
                <div class="telegram-placeholder">
                    <div style="font-size: 4rem; margin-bottom: 16px;">📱</div>
                    <h3 style="color: var(--fg); margin-bottom: 12px;">Telegram-ilmoitukset tulossa!</h3>
                    <p>Saat kaikki yhteydenotot suoraan Telegram-botista puhelimeesi.<br>Voit myös vastata viesteihin suoraan Telegramista.</p>
                    <p style="margin-top: 16px; color: var(--muted); font-size: 0.85rem;">Ominaisuudet: Välittömät ilmoitukset • Vastaaminen • Työaika-asetukset • Hiljaiset tunnit</p>
                </div>
            </div>
        </div>

        <div id="tab-system" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h2>Järjestelmätiedot</h2>
                    <p style="color: var(--muted);">Tietokanta: <strong style="color: var(--fg);"><?php echo getenv(\'DB_NAME\') ?: \'Ei määritetty\'; ?></strong></p>
                    <p style="color: var(--muted);">AI-palvelu: <strong style="color: var(--fg);"><?php echo getenv(\'AI_API_KEY\') ? \'Käytössä\' : \'Ei käytössä\'; ?></strong></p>
                    <p style="color: var(--muted);">PHP-versio: <strong style="color: var(--fg);"><?php echo phpversion(); ?></strong></p>
                </div>
                <div class="card">
                    <h2>Työkalut</h2>
                    <a href="test_backend.php" class="btn">Järjestelmätesti</a>
                    <a href="index.html" class="btn">Näytä etusivu</a>
                </div>
            </div>
            <div class="card">
                <h2>Turvallisuus</h2>
                <div class="warning-box">
                    <strong>⚠️ Muista vaihtaa salasana!</strong><br>
                    Oletussalasana "admin123" tulee vaihtaa heti. Muokkaa tiedostoa <code>admin.php</code> ja etsi rivi <code>$adminPassword</code>.
                </div>
            </div>
        </div>
    </div>

    <script>
        function switchTab(tabName) {
            // Piilota kaikki välilehdet
            document.querySelectorAll(\'.tab-content\').forEach(el => el.classList.remove(\'active\'));
            document.querySelectorAll(\'.tab\').forEach(el => el.classList.remove(\'active\'));
            
            // Näytä valittu välilehti
            document.getElementById(\'tab-\' + tabName).classList.add(\'active\');
            event.target.classList.add(\'active\');
        }
    </script>
</body>
</html>
<?php
?>';
    
    file_put_contents(__DIR__ . '/admin.php', $adminContent);
    @chmod(__DIR__ . '/admin.php', 0644);
}
?>
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asennus - AnomFIN</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --fg:#e6eef8; --bg:#0b0f1a; --muted:#9fb3c8; --card:#11192a; --border:#1e2a3a; --accent:#62a1ff; --success:#00ffa6; --error:#ff4444; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: Inter, system-ui, sans-serif; line-height: 1.6; }
        .container { max-width: 700px; margin: 0 auto; padding: 40px 24px; }
        h1 { text-align: center; margin: 0 0 12px; background: linear-gradient(135deg, var(--accent), var(--success)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.2rem; }
        .subtitle { color: var(--muted); text-align: center; margin-bottom: 40px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 30px; margin-bottom: 20px; }
        .card h2 { margin: 0 0 20px; font-size: 1.3rem; color: var(--accent); }
        .form-group { margin-bottom: 18px; }
        label { display: block; margin-bottom: 6px; font-weight: 500; }
        .required { color: var(--error); }
        input { width: 100%; padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--fg); font-size: 1rem; font-family: inherit; }
        input:focus { outline: none; border-color: var(--accent); }
        .hint { color: var(--muted); font-size: 0.85rem; margin-top: 4px; }
        .alert { padding: 16px; border-radius: 8px; margin-bottom: 20px; }
        .alert-error { background: rgba(255, 68, 68, 0.1); border: 1px solid var(--error); color: var(--error); }
        .alert-success { background: rgba(0, 255, 166, 0.1); border: 1px solid var(--success); color: var(--success); }
        .alert-info { background: rgba(98, 161, 255, 0.1); border: 1px solid var(--accent); color: var(--accent); }
        .alert-warning { background: rgba(255, 170, 0, 0.1); border: 1px solid var(--warning); color: var(--warning); }
        button { background: var(--accent); color: #08111f; border: none; padding: 14px 28px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; font-family: inherit; width: 100%; }
        button:hover { background: #7ab5ff; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: #1b2a44; color: #cfe3ff; text-decoration: none; display: inline-block; padding: 14px 28px; border-radius: 8px; text-align: center; margin-top: 10px; }
        .complete { text-align: center; padding: 40px 20px; }
        .complete h2 { color: var(--success); font-size: 1.8rem; margin-bottom: 20px; }
        .complete .icon { font-size: 4rem; margin-bottom: 20px; }
        .detected { background: rgba(0, 255, 166, 0.05); padding: 10px; border-radius: 6px; margin-bottom: 16px; }
        .detected strong { color: var(--success); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 AnomFIN Asennus</h1>
        <p class="subtitle">Yksinkertainen yhden kerran -asennusohjelma</p>

        <?php if ($installationComplete): ?>
            <div class="card complete">
                <div class="icon">✅</div>
                <h2>Asennus valmis!</h2>
                <p>Sovellus on asennettu ja valmis käytettäväksi.</p>
                <?php if ($installationSource === 'database' && $dbCheckStatus): ?>
                    <p class="hint" style="margin-top: 10px; color: var(--accent);">
                        <?php echo htmlspecialchars($dbCheckStatus['message'], ENT_QUOTES, 'UTF-8'); ?>
                    </p>
                <?php elseif ($installationSource === 'env'): ?>
                    <p class="hint" style="margin-top: 10px;">Nykyinen .env-konfiguraatio on käytössä.</p>
                <?php endif; ?>
                <div style="margin-top: 30px;">
                    <a href="admin.php" class="btn-secondary" style="background: var(--accent); color: #08111f; font-weight: 600;">Avaa Admin-paneeli</a>
                    <a href="index.html" class="btn-secondary">Siirry etusivulle</a>
                </div>
                <p class="hint" style="margin-top: 20px;">Voit nyt poistaa install.php tiedoston turvallisuussyistä.</p>
            </div>
        <?php else: ?>
            <?php if (!empty($detectedConfig)): ?>
                <div class="alert alert-info">
                    <strong>✓ Tietokanta-asetuksia löydetty!</strong><br>
                    <?php if (isset($detectedConfig['connection_file'])): ?>
                        Löydetty tiedosto: <code><?php echo htmlspecialchars($detectedConfig['connection_file']); ?></code><br>
                    <?php endif; ?>
                    Tiedot on esitäytetty lomakkeeseen. Tarkista ja täydennä puuttuvat tiedot.
                </div>
            <?php endif; ?>

            <?php if ($dbCheckStatus && $dbCheckStatus['type'] !== 'success'): ?>
                <?php $alertClass = $dbCheckStatus['type'] === 'warning' ? 'alert-warning' : 'alert-error'; ?>
                <div class="alert <?php echo $alertClass; ?>">
                    <?php echo htmlspecialchars($dbCheckStatus['message'], ENT_QUOTES, 'UTF-8'); ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($errors)): ?>
                <div class="alert alert-error">
                    <strong>Virheet:</strong><br>
                    <?php foreach ($errors as $error): ?>
                        • <?php echo htmlspecialchars($error); ?><br>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <form method="POST">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
                
                <div class="card">
                    <h2>📦 Tietokanta-asetukset</h2>
                    
                    <div class="form-group">
                        <label>Palvelin</label>
                        <input type="text" name="db_host" value="<?php echo htmlspecialchars($detectedConfig['db_host'] ?? 'localhost'); ?>" placeholder="localhost">
                        <p class="hint">Useimmiten: localhost</p>
                    </div>
                    
                    <div class="form-group">
                        <label>Tietokannan nimi <span class="required">*</span></label>
                        <input type="text" name="db_name" value="<?php echo htmlspecialchars($detectedConfig['db_name'] ?? ''); ?>" placeholder="anomfin_db" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Käyttäjätunnus <span class="required">*</span></label>
                        <input type="text" name="db_user" value="<?php echo htmlspecialchars($detectedConfig['db_user'] ?? ''); ?>" placeholder="root" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Salasana</label>
                        <input type="password" name="db_password" placeholder="••••••••">
                        <p class="hint">Jätä tyhjäksi jos ei salasanaa</p>
                    </div>
                    
                    <div class="form-group">
                        <label>Portti</label>
                        <input type="number" name="db_port" value="3306" placeholder="3306">
                    </div>
                </div>
                
                <div class="card">
                    <h2>🤖 AI-palvelu (valinnainen)</h2>
                    <p class="hint" style="margin-bottom: 16px;">Voit lisätä AI-asetukset myös myöhemmin admin-paneelista.</p>
                    
                    <div class="form-group">
                        <label>OpenAI API-avain</label>
                        <input type="password" name="ai_api_key" placeholder="sk-...">
                        <p class="hint">Valinnainen: Voit lisätä myöhemmin</p>
                    </div>
                </div>
                
                <button type="submit">Asenna nyt</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
