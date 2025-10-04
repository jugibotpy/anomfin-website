<?php
declare(strict_types=1);

session_start();

$config = require __DIR__ . '/../config/admin.config.php';
$sessionKey = $config['session_key'] ?? 'anomfin_admin_authenticated';
$sessionUserKey = $config['session_user_key'] ?? 'anomfin_admin_name';
$settingsFile = $config['settings_file'] ?? __DIR__ . '/../data/settings.json';

header('Content-Type: application/json; charset=utf-8');

$defaults = require __DIR__ . '/../config/settings-defaults.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $payload = loadSettings($settingsFile, $defaults);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    return;
}

if (empty($_SESSION[$sessionKey])) {
    http_response_code(403);
    echo json_encode(['error' => 'Authentication required']);
    return;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    return;
}

$csrf = $input['csrf'] ?? null;
if (!$csrf || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], (string) $csrf)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid CSRF token']);
    return;
}

$allowedEases = [
    'cubic-bezier(.2,.8,.2,1)',
    'cubic-bezier(.22,.8,.2,1)',
    'ease-in-out',
    'ease-out',
    'ease-in',
    'ease',
    'linear',
];

$sanitized = $defaults;
$sanitized['cssVars'] = sanitizeCssVars($input['cssVars'] ?? [], $defaults['cssVars']);

$ease = $input['ease'] ?? $sanitized['cssVars']['--logo-ease'];
if (!in_array($ease, $allowedEases, true)) {
    $ease = 'cubic-bezier(.2,.8,.2,1)';
}
$sanitized['cssVars']['--logo-ease'] = $ease;

$behaviors = $input['behaviors'] ?? [];
$sanitized['behaviors'] = [
    'reactHover' => !empty($behaviors['reactHover']),
    'reactContact' => !empty($behaviors['reactContact']),
];

$preset = $input['preset'] ?? null;
if (!in_array($preset, ['drama', 'fast', 'soft', null, ''], true)) {
    $preset = null;
}
$sanitized['preset'] = $preset ?: null;

$sanitized['meta'] = [
    'updated_at' => gmdate('c'),
    'updated_by' => $_SESSION[$sessionUserKey] ?? ($config['default_admin_name'] ?? 'AnomFIN Admin'),
];

if (!is_dir(dirname($settingsFile))) {
    mkdir(dirname($settingsFile), 0775, true);
}

file_put_contents($settingsFile, json_encode($sanitized, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

http_response_code(200);
$payload = loadSettings($settingsFile, $defaults);
$payload['meta']['flash'] = 'Asetukset tallennettu';
echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

function loadSettings(string $file, array $defaults): array
{
    if (!file_exists($file)) {
        return $defaults;
    }

    $data = json_decode((string) file_get_contents($file), true);
    if (!is_array($data)) {
        return $defaults;
    }

    $merged = $defaults;
    if (isset($data['cssVars']) && is_array($data['cssVars'])) {
        $merged['cssVars'] = array_merge($defaults['cssVars'], $data['cssVars']);
    }
    if (isset($data['behaviors']) && is_array($data['behaviors'])) {
        $merged['behaviors'] = array_merge($defaults['behaviors'], $data['behaviors']);
    }
    if (array_key_exists('preset', $data)) {
        $merged['preset'] = $data['preset'];
    }
    if (isset($data['meta']) && is_array($data['meta'])) {
        $merged['meta'] = array_merge($defaults['meta'], $data['meta']);
    }

    return $merged;
}

function sanitizeCssVars(array $input, array $defaults): array
{
    $sanitized = $defaults;
    foreach ($defaults as $key => $defaultValue) {
        if (!array_key_exists($key, $input)) {
            continue;
        }
        $value = $input[$key];
        switch ($key) {
            case '--neon':
                $sanitized[$key] = sanitizeHexColor($value, $defaultValue);
                break;
            case '--square-green-rgba':
                $sanitized[$key] = sanitizeRgbTriplet($value, $defaultValue);
                break;
            case '--logo-ease':
                $sanitized[$key] = is_string($value) ? trim($value) : $defaultValue;
                break;
            case '--logo-initial-opacity':
            case '--logo-initial-brightness':
            case '--logo-initial-scale':
            case '--square-scale-end':
                $sanitized[$key] = sanitizeNumber($value, $defaultValue, 0, 10);
                break;
            case '--logo-arc-x':
                $sanitized[$key] = sanitizeNumber($value, $defaultValue, 0, 1);
                break;
            case '--eyebrow-size':
                $sanitized[$key] = sanitizeNumberWithUnit($value, $defaultValue, 'rem', 0.1, 5);
                break;
            case '--intro-blackout-ms':
            case '--intro-bg-fade-ms':
            case '--logo-reveal-ms':
            case '--logo-move-duration-ms':
            case '--logo-move-delay-ms':
            case '--grid-hue-duration-ms':
            case '--square-shake-duration-ms':
            case '--services-fade-delay-ms':
                $sanitized[$key] = sanitizeDuration($value, $defaultValue);
                break;
            case '--orb-float-duration-s':
            case '--grid-float-duration-s':
                $sanitized[$key] = sanitizeSeconds($value, $defaultValue);
                break;
            case '--logo-initial-blur':
            case '--square-shake-amp':
            case '--logo-arc-dy':
                $sanitized[$key] = sanitizePixel($value, $defaultValue);
                break;
            default:
                $sanitized[$key] = is_string($value) ? trim($value) : $defaultValue;
                break;
        }
    }
    return $sanitized;
}

function sanitizeNumber($value, string $default, float $min, float $max): string
{
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false) {
        $number = filter_var($default, FILTER_VALIDATE_FLOAT);
    }
    $number = max($min, min($max, (float) $number));
    return (string) $number;
}

function sanitizeDuration($value, string $default): string
{
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false) {
        $number = filter_var($default, FILTER_VALIDATE_FLOAT) ?: 0;
    }
    return sprintf('%sms', max(0, $number));
}

function sanitizeNumberWithUnit($value, string $default, string $unit, float $min, float $max): string
{
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false) {
        $number = filter_var($default, FILTER_VALIDATE_FLOAT);
    }
    $number = max($min, min($max, (float) $number));
    return rtrim(rtrim(sprintf('%.3f', $number), '0'), '.') . $unit;
}

function sanitizeSeconds($value, string $default): string
{
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false) {
        $number = filter_var($default, FILTER_VALIDATE_FLOAT) ?: 0;
    }
    return sprintf('%ss', max(0, $number));
}

function sanitizePixel($value, string $default): string
{
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false) {
        $number = filter_var($default, FILTER_VALIDATE_FLOAT) ?: 0;
    }
    return sprintf('%spx', max(0, $number));
}

function sanitizeHexColor($value, string $default): string
{
    if (is_string($value) && preg_match('/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/', trim($value))) {
        return strtoupper(trim($value));
    }
    return strtoupper($default);
}

function sanitizeRgbTriplet($value, string $default): string
{
    if (is_string($value)) {
        $parts = array_map('trim', explode(',', $value));
    } elseif (is_array($value)) {
        $parts = $value;
    } else {
        $parts = [];
    }
    if (count($parts) !== 3) {
        return $default;
    }
    $rgb = [];
    foreach ($parts as $part) {
        $number = filter_var($part, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 255]]);
        if ($number === false) {
            return $default;
        }
        $rgb[] = (string) $number;
    }
    return implode(',', $rgb);
}
