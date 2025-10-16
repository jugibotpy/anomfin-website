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

$settings = load_settings($settingsFile, $defaults);
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
    $urlWithCampaign = ensure_utm_campaign($url, $utmCampaign);
    if ($urlWithCampaign !== $url) {
        $url = filter_var($urlWithCampaign, FILTER_VALIDATE_URL) ?: $url;
    }
}

if ($autoPurgeDays > 0) {
    purge_json_links($autoPurgeDays);
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
            purge_expired_db_links($pdo, $autoPurgeDays);
        }

        if ($code === null) {
            $code = generate_unique_code(function (string $candidate) use ($pdo): bool {
                $stmt = $pdo->prepare('SELECT 1 FROM short_links WHERE code = :code LIMIT 1');
                $stmt->execute(['code' => $candidate]);
                return (bool) $stmt->fetchColumn();
            }, $maxLength);
        } else {
            if (code_exists($pdo, $code)) {
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

function generate_unique_code(callable $exists, int $maxLength): string
{
    $length = max(1, min($maxLength, 8));
    $alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    $attempts = 0;

    do {
        $attempts++;
        $candidate = '';
        for ($i = 0; $i < $length; $i++) {
            $candidate .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        if (!$exists($candidate)) {
            return $candidate;
        }
    } while ($attempts < 20);

    throw new RuntimeException('Lyhennettä ei pystytty generoimaan ilman törmäyksiä');
}

function code_exists(\PDO $pdo, string $code): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM short_links WHERE code = :code LIMIT 1');
    $stmt->execute(['code' => $code]);
    return (bool) $stmt->fetchColumn();
}

function purge_expired_db_links(\PDO $pdo, int $days): void
{
    if ($days <= 0) {
        return;
    }

    $threshold = gmdate('Y-m-d H:i:s', time() - ($days * 86400));
    $stmt = $pdo->prepare('DELETE FROM short_links WHERE created_at < :threshold');
    $stmt->execute(['threshold' => $threshold]);
}

function build_short_url(string $base, string $code): string
{
    if (str_contains($base, '=') || str_ends_with($base, '/')) {
        return $base . $code;
    }

    return rtrim($base, '/') . '/' . $code;
}

function load_settings(string $file, array $defaults): array
{
    if (!is_file($file)) {
        return $defaults;
    }
    $data = json_decode((string) file_get_contents($file), true);
    if (!is_array($data)) {
        return $defaults;
    }
    return array_replace_recursive($defaults, $data);
}

function link_store_path(): string
{
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    return $dir . '/short-links.json';
}

function load_link_store(): array
{
    $file = link_store_path();
    if (!is_file($file)) {
        return [];
    }

    $data = json_decode((string) file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function save_link_store(array $links): void
{
    $file = link_store_path();
    $fp = fopen($file, 'c+');
    if ($fp === false) {
        throw new RuntimeException('Lyhennysten tallennus epäonnistui');
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($links, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function purge_json_links(int $days): void
{
    if ($days <= 0) {
        return;
    }

    $links = load_link_store();
    if ($links === []) {
        return;
    }

    $threshold = time() - ($days * 86400);
    $changed = false;
    foreach ($links as $code => $data) {
        $createdAt = isset($data['created_at']) ? strtotime((string) $data['created_at']) : 0;
        if ($createdAt > 0 && $createdAt < $threshold) {
            unset($links[$code]);
            $changed = true;
        }
    }

    if ($changed) {
        save_link_store($links);
    }
}

function ensure_utm_campaign(string $url, string $campaign): string
{
    $parts = parse_url($url);
    if ($parts === false) {
        return $url;
    }

    $query = [];
    if (!empty($parts['query'])) {
        parse_str($parts['query'], $query);
    }

    $lower = array_change_key_case($query, CASE_LOWER);
    if (array_key_exists('utm_campaign', $lower)) {
        return $url;
    }

    $query['utm_campaign'] = $campaign;
    $parts['query'] = http_build_query($query);

    return build_url_from_parts($parts);
}

function build_url_from_parts(array $parts): string
{
    $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : '';
    $user = $parts['user'] ?? '';
    $pass = isset($parts['pass']) ? ':' . $parts['pass'] : '';
    $auth = $user !== '' ? $user . $pass . '@' : '';
    $host = $parts['host'] ?? '';
    $port = isset($parts['port']) ? ':' . $parts['port'] : '';
    $path = $parts['path'] ?? '';
    $query = isset($parts['query']) && $parts['query'] !== '' ? '?' . $parts['query'] : '';
    $fragment = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';

    return $scheme . $auth . $host . $port . $path . $query . $fragment;
}
