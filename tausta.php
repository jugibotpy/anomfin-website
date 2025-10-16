<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/shortener.php';

$config = require __DIR__ . '/config/admin.config.php';
$defaults = require __DIR__ . '/config/settings-defaults.php';
$settingsFile = $config['settings_file'] ?? __DIR__ . '/data/settings.json';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Virheellinen JSON']);
    exit;
}

$url = isset($input['url']) ? filter_var($input['url'], FILTER_VALIDATE_URL) : false;
if ($url === false) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Anna kelvollinen URL-osoite']);
    exit;
}

$maxLength = isset($input['maxLength']) ? (int) $input['maxLength'] : 4;
$maxLength = max(1, min($maxLength, 12));

$alias = isset($input['alias']) ? preg_replace('/[^A-Za-z0-9]/', '', (string) $input['alias']) : '';
if ($alias !== '' && strlen($alias) > $maxLength) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => "Alias saa sisältää enintään {$maxLength} merkkiä"]);
    exit;
}

$settings = anomfin_load_settings($settingsFile, $defaults);
$shortenerConfig = $settings['shortener'] ?? [];
$shortenerBase = $shortenerConfig['baseUrl'] ?? 'https://anomfin.fi/?s=';
$shortenerBase = rtrim($shortenerBase, '/') . (str_contains($shortenerBase, '=') ? '' : '/');
$enforceHttps = !empty($shortenerConfig['enforceHttps']);
$autoPurgeDays = isset($shortenerConfig['autoPurgeDays']) ? max(0, (int) $shortenerConfig['autoPurgeDays']) : 0;
$utmCampaign = isset($shortenerConfig['utmCampaign']) ? trim((string) $shortenerConfig['utmCampaign']) : '';

if ($enforceHttps && strcasecmp((string) parse_url($url, PHP_URL_SCHEME), 'https') !== 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Lyhentäjä hyväksyy vain HTTPS-osoitteet.']);
    exit;
}

if ($utmCampaign !== '') {
    $urlWithCampaign = anomfin_ensure_utm_campaign($url, $utmCampaign);
    if ($urlWithCampaign !== $url) {
        $url = filter_var($urlWithCampaign, FILTER_VALIDATE_URL) ?: $url;
    }
}

if ($autoPurgeDays > 0) {
    anomfin_purge_json_links($autoPurgeDays);
}

$pdo = anomfin_get_pdo();
$requestedCode = $alias !== '' ? strtolower($alias) : null;
$finalCode = $requestedCode;

if ($pdo instanceof \PDO) {
    try {
        $pdo->exec('CREATE TABLE IF NOT EXISTS short_links (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(16) NOT NULL,
            target_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_code (code),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

        if ($autoPurgeDays > 0) {
            anomfin_purge_expired_db_links($pdo, $autoPurgeDays);
        }

        if ($requestedCode !== null) {
            if (anomfin_code_exists($pdo, $requestedCode)) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'Alias on jo käytössä']);
                exit;
            }
        }

        $attempts = $requestedCode === null ? 6 : 1;
        for ($i = 0; $i < $attempts; $i++) {
            if ($finalCode === null) {
                $finalCode = anomfin_generate_unique_code(
                    function (string $candidate) use ($pdo): bool {
                        return anomfin_code_exists($pdo, $candidate);
                    },
                    $maxLength
                );
            }

            try {
                $stmt = $pdo->prepare('INSERT INTO short_links (code, target_url) VALUES (:code, :url)');
                $stmt->execute([
                    'code' => $finalCode,
                    'url' => $url,
                ]);

                echo json_encode([
                    'success' => true,
                    'code' => $finalCode,
                    'shortUrl' => anomfin_build_short_url($shortenerBase, $finalCode),
                ]);
                exit;
            } catch (\Throwable $insertException) {
                if (!anomfin_is_duplicate_code_error($insertException)) {
                    throw $insertException;
                }

                if ($requestedCode !== null) {
                    http_response_code(409);
                    echo json_encode(['success' => false, 'error' => 'Alias on jo käytössä']);
                    exit;
                }

                $finalCode = null;
            }
        }

    } catch (Throwable $exception) {
        error_log('Shortener DB error: ' . $exception->getMessage());
    }
}

// Fallback to JSON storage
$fallbackCode = $finalCode ?? $requestedCode;
$links = anomfin_load_link_store();

if ($fallbackCode === null) {
    $fallbackCode = anomfin_generate_unique_code(function (string $candidate) use ($links): bool {
        return array_key_exists($candidate, $links);
    }, $maxLength);
}
if (array_key_exists($fallbackCode, $links)) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Alias on jo käytössä']);
    exit;
}

$links[$fallbackCode] = [
    'url' => $url,
    'created_at' => gmdate('c'),
];

anomfin_save_link_store($links);

echo json_encode([
    'success' => true,
    'code' => $fallbackCode,
    'shortUrl' => anomfin_build_short_url($shortenerBase, $fallbackCode),
]);
