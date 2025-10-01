<?php
/**
 * AnomFIN Installation Page
 * 
 * This page guides users through the initial setup process
 * and creates the .env configuration file.
 * 
 * @package AnomFIN
 * @version 1.0.0
 */

// Start session
session_start();

// Security: Generate CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Check if .env already exists (installation already completed)
$envExists = file_exists(__DIR__ . '/.env');
$installationComplete = false;
$errors = [];
$success = false;

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verify CSRF token
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        $errors[] = 'Virheellinen turvallisuustunniste. Yritä uudelleen.';
    } else {
        // Validate inputs
        $dbHost = filter_input(INPUT_POST, 'db_host', FILTER_SANITIZE_STRING);
        $dbName = filter_input(INPUT_POST, 'db_name', FILTER_SANITIZE_STRING);
        $dbUser = filter_input(INPUT_POST, 'db_user', FILTER_SANITIZE_STRING);
        $dbPassword = $_POST['db_password'] ?? '';
        $dbPort = filter_input(INPUT_POST, 'db_port', FILTER_VALIDATE_INT);
        $aiApiKey = filter_input(INPUT_POST, 'ai_api_key', FILTER_SANITIZE_STRING);
        $aiApiUrl = filter_input(INPUT_POST, 'ai_api_url', FILTER_SANITIZE_URL);
        $aiModel = filter_input(INPUT_POST, 'ai_model', FILTER_SANITIZE_STRING);
        
        // Validation
        if (empty($dbHost)) {
            $errors[] = 'Tietokannan palvelin on pakollinen.';
        }
        if (empty($dbName)) {
            $errors[] = 'Tietokannan nimi on pakollinen.';
        }
        if (empty($dbUser)) {
            $errors[] = 'Tietokannan käyttäjätunnus on pakollinen.';
        }
        if (!$dbPort || $dbPort < 1 || $dbPort > 65535) {
            $errors[] = 'Virheellinen porttinumero (1-65535).';
        }
        if (empty($aiApiKey)) {
            $errors[] = 'AI API-avain on pakollinen.';
        }
        if (empty($aiApiUrl) || !filter_var($aiApiUrl, FILTER_VALIDATE_URL)) {
            $errors[] = 'Virheellinen AI API URL-osoite.';
        }
        
        // If no errors, test connection and save
        if (empty($errors)) {
            // Test database connection
            try {
                $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
                $testConn = new PDO($dsn, $dbUser, $dbPassword, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 5
                ]);
                
                // Connection successful, create .env file
                $envContent = "# AnomFIN Configuration File\n";
                $envContent .= "# Generated: " . date('Y-m-d H:i:s') . "\n\n";
                $envContent .= "# Database Configuration\n";
                $envContent .= "DB_HOST=" . $dbHost . "\n";
                $envContent .= "DB_NAME=" . $dbName . "\n";
                $envContent .= "DB_USER=" . $dbUser . "\n";
                $envContent .= "DB_PASSWORD=" . $dbPassword . "\n";
                $envContent .= "DB_PORT=" . $dbPort . "\n";
                $envContent .= "DB_CHARSET=utf8mb4\n\n";
                $envContent .= "# AI Service Configuration\n";
                $envContent .= "AI_API_KEY=" . $aiApiKey . "\n";
                $envContent .= "AI_API_URL=" . $aiApiUrl . "\n";
                $envContent .= "AI_MODEL=" . $aiModel . "\n";
                $envContent .= "AI_MAX_TOKENS=1000\n";
                $envContent .= "AI_TEMPERATURE=0.7\n\n";
                $envContent .= "# Application Settings\n";
                $envContent .= "APP_ENV=production\n";
                $envContent .= "APP_DEBUG=false\n";
                $envContent .= "APP_URL=" . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . "\n\n";
                $envContent .= "# Security Settings\n";
                $envContent .= "SESSION_SECRET=" . bin2hex(random_bytes(32)) . "\n";
                $envContent .= "ENCRYPTION_KEY=" . bin2hex(random_bytes(32)) . "\n";
                
                // Write to .env file
                if (file_put_contents(__DIR__ . '/.env', $envContent) !== false) {
                    // Set proper permissions (read/write for owner only)
                    chmod(__DIR__ . '/.env', 0600);
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
?>
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asennus - AnomFIN</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --fg: #e6eef8;
            --bg: #0b0f1a;
            --muted: #9fb3c8;
            --card: #11192a;
            --border: #1e2a3a;
            --accent: #62a1ff;
            --success: #00ffa6;
            --error: #ff4444;
        }
        
        * {
            box-sizing: border-box;
        }
        
        html, body {
            margin: 0;
            padding: 0;
            background: var(--bg);
            color: var(--fg);
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 24px;
        }
        
        header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        h1 {
            font-size: 2.5rem;
            margin: 0 0 12px;
            background: linear-gradient(135deg, var(--accent) 0%, var(--success) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: var(--muted);
            font-size: 1.1rem;
        }
        
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
        }
        
        .card h2 {
            margin: 0 0 20px;
            font-size: 1.4rem;
            color: var(--accent);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--fg);
        }
        
        label .required {
            color: var(--error);
        }
        
        input[type="text"],
        input[type="password"],
        input[type="number"],
        input[type="url"] {
            width: 100%;
            padding: 12px;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--fg);
            font-size: 1rem;
            font-family: inherit;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: var(--accent);
        }
        
        .hint {
            color: var(--muted);
            font-size: 0.9rem;
            margin-top: 4px;
        }
        
        .alert {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .alert-error {
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid var(--error);
            color: var(--error);
        }
        
        .alert-success {
            background: rgba(0, 255, 166, 0.1);
            border: 1px solid var(--success);
            color: var(--success);
        }
        
        .alert ul {
            margin: 8px 0 0 20px;
            padding: 0;
        }
        
        button {
            background: var(--accent);
            color: #08111f;
            border: 1px solid #2d64a7;
            padding: 14px 28px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.3s;
        }
        
        button:hover {
            background: #7ab5ff;
            transform: translateY(-2px);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background: #1b2a44;
            color: #cfe3ff;
            text-decoration: none;
            display: inline-block;
            padding: 14px 28px;
            border-radius: 8px;
            border: 1px solid #2d64a7;
            transition: all 0.3s;
        }
        
        .btn-secondary:hover {
            background: #253a5a;
            transform: translateY(-2px);
        }
        
        .actions {
            display: flex;
            gap: 12px;
            margin-top: 30px;
        }
        
        .row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        
        .installation-complete {
            text-align: center;
            padding: 40px 20px;
        }
        
        .installation-complete h2 {
            color: var(--success);
            font-size: 2rem;
            margin-bottom: 20px;
        }
        
        .installation-complete .icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        @media (max-width: 600px) {
            .row {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 1.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>AnomFIN Asennus</h1>
            <p class="subtitle">Tervetuloa! Määritä sovelluksen asetukset jatkaaksesi.</p>
        </header>

        <?php if ($installationComplete): ?>
            <div class="card installation-complete">
                <div class="icon">✅</div>
                <h2>Asennus valmis!</h2>
                <p>Sovelluksen asetukset on määritetty onnistuneesti.</p>
                <p class="hint">Tiedosto .env on luotu ja tietokantayhteys testattu.</p>
                <div class="actions" style="justify-content: center; margin-top: 30px;">
                    <a href="index.html" class="btn-secondary">Siirry etusivulle</a>
                    <a href="ai_connect.php" class="btn-secondary">Testaa AI-yhteyttä</a>
                </div>
            </div>
        <?php else: ?>
            <?php if ($envExists): ?>
                <div class="alert alert-error">
                    <strong>Huomio:</strong> Asennustiedosto .env on jo olemassa. Jos haluat uudelleenasennuksen, poista .env-tiedosto ensin.
                </div>
            <?php endif; ?>

            <?php if (!empty($errors)): ?>
                <div class="alert alert-error">
                    <strong>Virheet:</strong>
                    <ul>
                        <?php foreach ($errors as $error): ?>
                            <li><?php echo htmlspecialchars($error); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <form method="POST" action="">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
                
                <div class="card">
                    <h2>Tietokanta-asetukset</h2>
                    <p class="hint">Syötä MySQL-tietokannan yhteyden tiedot.</p>
                    
                    <div class="form-group">
                        <label>
                            Palvelin <span class="required">*</span>
                        </label>
                        <input type="text" name="db_host" value="<?php echo htmlspecialchars($_POST['db_host'] ?? 'localhost'); ?>" required>
                        <p class="hint">Esim: localhost tai tietokannan IP-osoite</p>
                    </div>
                    
                    <div class="row">
                        <div class="form-group">
                            <label>
                                Tietokannan nimi <span class="required">*</span>
                            </label>
                            <input type="text" name="db_name" value="<?php echo htmlspecialchars($_POST['db_name'] ?? 'anomfin_db'); ?>" required>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                Portti <span class="required">*</span>
                            </label>
                            <input type="number" name="db_port" value="<?php echo htmlspecialchars($_POST['db_port'] ?? '3306'); ?>" min="1" max="65535" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            Käyttäjätunnus <span class="required">*</span>
                        </label>
                        <input type="text" name="db_user" value="<?php echo htmlspecialchars($_POST['db_user'] ?? 'root'); ?>" required>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            Salasana
                        </label>
                        <input type="password" name="db_password" value="<?php echo htmlspecialchars($_POST['db_password'] ?? ''); ?>">
                        <p class="hint">Jätä tyhjäksi jos ei salasanaa</p>
                    </div>
                </div>
                
                <div class="card">
                    <h2>AI-palvelun asetukset</h2>
                    <p class="hint">Syötä AI-palvelun API-tiedot (esim. OpenAI).</p>
                    
                    <div class="form-group">
                        <label>
                            API-avain <span class="required">*</span>
                        </label>
                        <input type="password" name="ai_api_key" value="<?php echo htmlspecialchars($_POST['ai_api_key'] ?? ''); ?>" required>
                        <p class="hint">OpenAI API-avain (alkaa sk-...)</p>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            API URL-osoite <span class="required">*</span>
                        </label>
                        <input type="url" name="ai_api_url" value="<?php echo htmlspecialchars($_POST['ai_api_url'] ?? 'https://api.openai.com/v1'); ?>" required>
                        <p class="hint">OpenAI: https://api.openai.com/v1</p>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            AI-malli <span class="required">*</span>
                        </label>
                        <input type="text" name="ai_model" value="<?php echo htmlspecialchars($_POST['ai_model'] ?? 'gpt-3.5-turbo'); ?>" required>
                        <p class="hint">Esim: gpt-3.5-turbo, gpt-4</p>
                    </div>
                </div>
                
                <div class="actions">
                    <button type="submit" <?php echo $envExists ? 'disabled' : ''; ?>>
                        Asenna ja testaa yhteys
                    </button>
                    <a href="index.html" class="btn-secondary">Peruuta</a>
                </div>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
