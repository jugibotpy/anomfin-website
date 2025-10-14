<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

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
$shortenerBase = $settings['shortener']['baseUrl'] ?? 'https://anomfin.fi/?s=';
$shortenerBase = rtrim($shortenerBase, '/') . (str_contains($shortenerBase, '=') ? '' : '/');

$pdo = anomfin_get_pdo();
$code = $alias !== '' ? strtolower($alias) : null;

if ($pdo instanceof \PDO) {
    try {
        $pdo->exec('CREATE TABLE IF NOT EXISTS short_links (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(16) NOT NULL UNIQUE,
            target_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

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

        $stmt = $pdo->prepare('INSERT INTO short_links (code, target_url) VALUES (:code, :url)');
        $stmt->execute([
            'code' => $code,
            'url' => $url,
        ]);

        echo json_encode([
            'success' => true,
            'code' => $code,
            'shortUrl' => build_short_url($shortenerBase, $code),
        ]);
        exit;
    } catch (Throwable $exception) {
        error_log('Shortener DB error: ' . $exception->getMessage());
    }
}

// Fallback to JSON storage
$code = $code ?? generate_unique_code(function (string $candidate): bool {
    $links = load_link_store();
    return array_key_exists($candidate, $links);
}, $maxLength);

$links = load_link_store();
if (array_key_exists($code, $links)) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Alias on jo käytössä']);
    exit;
}

$links[$code] = [
    'url' => $url,
    'created_at' => gmdate('c'),
];

save_link_store($links);

echo json_encode([
    'success' => true,
    'code' => $code,
    'shortUrl' => build_short_url($shortenerBase, $code),
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
