<?php
/**
 * AnomFIN Link Shortener Redirect Handler
 * 
 * Resolves short codes to original URLs and redirects
 * Increments hit counter for analytics
 * 
 * Usage:
 *   - Via .htaccess rewrite: /s/{code}
 *   - Direct access: redirect.php?c={code}
 * 
 * @package AnomFIN
 * @version 1.0.0
 */

declare(strict_types=1);

// Load database configuration
require_once __DIR__ . '/config.php';

/**
 * Show error page
 */
function show_error(string $message, int $code = 404): void
{
    http_response_code($code);
    ?>
    <!DOCTYPE html>
    <html lang="fi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Linkkiä ei löytynyt - AnomFIN</title>
        <link rel="icon" href="assets/logotp.png" type="image/png">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
            }
            .error-container {
                text-align: center;
                max-width: 500px;
            }
            .error-code {
                font-size: 72px;
                font-weight: 700;
                background: linear-gradient(135deg, #00ffe1, #9c4dff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 20px;
            }
            h1 {
                font-size: 28px;
                margin-bottom: 15px;
                color: #fff;
            }
            p {
                font-size: 16px;
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.6;
                margin-bottom: 30px;
            }
            .btn {
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #00ffe1, #9c4dff);
                color: #0a0a0f;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(0, 255, 225, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-code"><?php echo $code; ?></div>
            <h1><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></h1>
            <p>Lyhytlinkkiä ei löytynyt tai se on vanhentunut. Tarkista osoite ja yritä uudelleen.</p>
            <a href="/" class="btn">Palaa etusivulle</a>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Get short code from query parameter or path
$code = '';

// Method 1: Query parameter (redirect.php?c=code)
if (isset($_GET['c']) && !empty($_GET['c'])) {
    $code = trim($_GET['c']);
}

// Method 2: Path info (/redirect.php/code)
if (empty($code) && isset($_SERVER['PATH_INFO']) && !empty($_SERVER['PATH_INFO'])) {
    $pathInfo = trim($_SERVER['PATH_INFO'], '/');
    if (!empty($pathInfo)) {
        $code = $pathInfo;
    }
}

// Validate code
if (empty($code)) {
    show_error('Lyhytlinkkikoodi puuttuu');
}

// Sanitize code (only alphanumeric)
if (!preg_match('/^[a-zA-Z0-9]{1,10}$/', $code)) {
    show_error('Virheellinen lyhytlinkkikoodi');
}

// Get database connection
$pdo = anomfin_get_pdo();

if (!$pdo) {
    http_response_code(503);
    show_error('Tietokantayhteys epäonnistui', 503);
}

try {
    // Fetch URL for the code
    $stmt = $pdo->prepare('SELECT id, url FROM link_shortener WHERE code = :code LIMIT 1');
    $stmt->execute(['code' => $code]);
    $row = $stmt->fetch();
    
    if (!$row) {
        show_error('Lyhytlinkkiä ei löytynyt');
    }
    
    $linkId = (int) $row['id'];
    $targetUrl = $row['url'];
    
    // Increment hit counter (fire and forget)
    try {
        $updateStmt = $pdo->prepare('UPDATE link_shortener SET hits = hits + 1 WHERE id = :id');
        $updateStmt->execute(['id' => $linkId]);
    } catch (PDOException $e) {
        // Log but don't fail the redirect
        error_log('Link shortener hit counter update failed: ' . $e->getMessage());
    }
    
    // Redirect to target URL (302 Found - temporary redirect)
    header('Location: ' . $targetUrl, true, 302);
    exit;
    
} catch (PDOException $e) {
    error_log('Link shortener redirect failed: ' . $e->getMessage());
    http_response_code(500);
    show_error('Tietokantavirhe', 500);
}
