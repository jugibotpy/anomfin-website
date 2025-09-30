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
        if (preg_match('/localhost|127\.0\.0\.1/i', $content) && !isset($detectedConfig['db_host'])) {
            $detectedConfig['db_host'] = 'localhost';
        }
        break;
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
    $adminContent = file_get_contents(__DIR__ . '/admin_template.txt');
    if ($adminContent === false) {
        // If template doesn't exist, create basic admin page
        $adminContent = '<?php
/**
 * AnomFIN Admin Panel
 * AI Control and Settings Management
 */

session_start();

// Include configuration
require_once __DIR__ . \'/connect.php\';

// Simple authentication (change this password!)
$adminPassword = "admin123"; // CHANGE THIS!

if (!isset($_SESSION[\'admin_logged_in\'])) {
    if ($_SERVER[\'REQUEST_METHOD\'] === \'POST\' && isset($_POST[\'password\'])) {
        if ($_POST[\'password\'] === $adminPassword) {
            $_SESSION[\'admin_logged_in\'] = true;
        }
    }
    
    if (!isset($_SESSION[\'admin_logged_in\'])) {
        ?>
        <!DOCTYPE html>
        <html lang="fi">
        <head>
            <meta charset="UTF-8">
            <title>Admin - AnomFIN</title>
            <style>
                body { font-family: Arial; background: #0b0f1a; color: #e6eef8; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login { background: #11192a; padding: 40px; border-radius: 12px; border: 1px solid #1e2a3a; }
                input { padding: 10px; width: 100%; margin: 10px 0; background: #0b0f1a; border: 1px solid #1e2a3a; color: #e6eef8; }
                button { background: #62a1ff; color: #08111f; padding: 10px 20px; border: none; cursor: pointer; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="login">
                <h2>Admin Login</h2>
                <form method="POST">
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
            </div>
        </body>
        </html>
        <?php
        exit;
    }
}

// Admin is logged in
?>
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - AnomFIN</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --fg:#e6eef8; --bg:#0b0f1a; --card:#11192a; --border:#1e2a3a; --accent:#62a1ff; --success:#00ffa6; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--fg); font-family: Inter, sans-serif; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { margin-bottom: 30px; background: linear-gradient(135deg, var(--accent), var(--success)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
        .card h2 { color: var(--accent); margin-bottom: 16px; }
        button, a.btn { background: var(--accent); color: #08111f; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block; margin: 5px; }
        button:hover, a.btn:hover { opacity: 0.9; }
        .danger { background: #ff4444; color: white; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media(max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎛️ AnomFIN Admin Panel</h1>
        
        <div class="grid">
            <div class="card">
                <h2>AI Control</h2>
                <p style="color: #9fb3c8; margin-bottom: 16px;">Manage AI service and queries</p>
                <a href="ai_connect.php" class="btn">Open AI Interface</a>
            </div>
            
            <div class="card">
                <h2>System Settings</h2>
                <p style="color: #9fb3c8; margin-bottom: 16px;">Configuration and maintenance</p>
                <a href="test_backend.php" class="btn">System Test</a>
            </div>
        </div>
        
        <div class="card">
            <h2>Quick Actions</h2>
            <a href="index.html" class="btn">View Website</a>
            <a href="?logout=1" class="btn danger">Logout</a>
        </div>
        
        <div class="card">
            <h2>Installation Info</h2>
            <p style="color: #9fb3c8;">Database: <?php echo getenv(\'DB_NAME\') ?: \'Not configured\'; ?></p>
            <p style="color: #9fb3c8;">AI Service: <?php echo getenv(\'AI_API_KEY\') ? \'Configured\' : \'Not configured\'; ?></p>
        </div>
    </div>
</body>
</html>
<?php
if (isset($_GET[\'logout\'])) {
    session_destroy();
    header(\'Location: admin.php\');
    exit;
}
?>';
    }
    
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
