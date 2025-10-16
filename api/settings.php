<?php
declare(strict_types=1);

session_start();

require_once __DIR__ . '/../lib/system.php';

$config = require __DIR__ . '/../config/admin.config.php';
$sessionKey = $config['session_key'] ?? 'anomfin_admin_authenticated';
$sessionUserKey = $config['session_user_key'] ?? 'anomfin_admin_name';
$settingsFile = $config['settings_file'] ?? __DIR__ . '/../data/settings.json';
$metricsFile = __DIR__ . '/../data/metrics.json';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$defaults = require __DIR__ . '/../config/settings-defaults.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $payload = loadSettings($settingsFile, $defaults);
    if (isset($payload['integrations']['chat']['apiKey'])) {
        $payload['integrations']['chat']['hasApiKey'] = $payload['integrations']['chat']['apiKey'] !== '';
        unset($payload['integrations']['chat']['apiKey']);
    }
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

$current = loadSettings($settingsFile, $defaults);

$sanitized = $current;
$sanitized['cssVars'] = sanitizeCssVars($input['cssVars'] ?? [], $defaults['cssVars']);

$ease = $input['ease'] ?? $sanitized['cssVars']['--logo-ease'];
if (!in_array($ease, $allowedEases, true)) {
    $ease = 'cubic-bezier(.2,.8,.2,1)';
}
$sanitized['cssVars']['--logo-ease'] = $ease;

$behaviors = $input['behaviors'] ?? [];
$previousBehaviors = $current['behaviors'] ?? $defaults['behaviors'] ?? [];
$sanitized['behaviors'] = [
    'reactHover' => array_key_exists('reactHover', $behaviors)
        ? !empty($behaviors['reactHover'])
        : (!empty($previousBehaviors['reactHover'])),
    'reactContact' => array_key_exists('reactContact', $behaviors)
        ? !empty($behaviors['reactContact'])
        : (!empty($previousBehaviors['reactContact'])),
    'heroMask' => array_key_exists('heroMask', $behaviors)
        ? !empty($behaviors['heroMask'])
        : (!array_key_exists('heroMask', $previousBehaviors) || !empty($previousBehaviors['heroMask'])),
    'floatingGrid' => array_key_exists('floatingGrid', $behaviors)
        ? !empty($behaviors['floatingGrid'])
        : (!empty($previousBehaviors['floatingGrid'])),
    'pageVibration' => sanitizeFraction($behaviors['pageVibration'] ?? $previousBehaviors['pageVibration'] ?? 0),
];

$sanitized['branding'] = sanitizeBranding(
    $input['branding'] ?? [],
    $defaults['branding'] ?? [],
    $current['branding'] ?? ($defaults['branding'] ?? [])
);

$sanitized['content'] = sanitizeContent(
    $input['content'] ?? [],
    $defaults['content'] ?? [],
    $current['content'] ?? ($defaults['content'] ?? [])
);

$sanitized['shortener'] = sanitizeShortener(
    $input['shortener'] ?? [],
    $defaults['shortener'] ?? [],
    $current['shortener'] ?? ($defaults['shortener'] ?? [])
);

$sanitized['integrations']['chat'] = sanitizeChatIntegration(
    $input['integrations']['chat'] ?? [],
    $defaults['integrations']['chat'] ?? [],
    $current['integrations']['chat'] ?? ($defaults['integrations']['chat'] ?? [])
);

$preset = $input['preset'] ?? null;
if (!in_array($preset, ['drama', 'fast', 'soft', null, ''], true)) {
    $preset = null;
}
$sanitized['preset'] = $preset ?: null;

$sanitized['meta'] = [
    'updated_at' => gmdate('c'),
    'updated_by' => $_SESSION[$sessionUserKey] ?? ($config['default_admin_name'] ?? 'AnomFIN Admin'),
];

if (!anomfin_write_json_atomic($settingsFile, $sanitized)) {
    http_response_code(500);
    echo json_encode(['error' => 'Asetuksia ei voitu tallentaa (kirjoitusoikeudet?)']);
    return;
}

$metrics = anomfin_read_json_file($metricsFile, [
    'visitors24h' => 0,
    'visitorsTotal' => 0,
    'lastSettingsSave' => null,
    'lastSettingsUser' => null,
]);

$metrics['lastSettingsSave'] = $sanitized['meta']['updated_at'];
$metrics['lastSettingsUser'] = $sanitized['meta']['updated_by'];
anomfin_write_json_atomic($metricsFile, $metrics);

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
    if (isset($data['branding']) && is_array($data['branding'])) {
        $merged['branding'] = array_merge($defaults['branding'] ?? [], $data['branding']);
    } else {
        $merged['branding'] = $defaults['branding'] ?? [];
    }
    if (isset($data['content']) && is_array($data['content'])) {
        $merged['content'] = array_merge($defaults['content'] ?? [], $data['content']);
    } else {
        $merged['content'] = $defaults['content'] ?? [];
    }
    if (isset($data['shortener']) && is_array($data['shortener'])) {
        $merged['shortener'] = array_merge($defaults['shortener'] ?? [], $data['shortener']);
    } else {
        $merged['shortener'] = $defaults['shortener'] ?? [];
    }
    if (isset($data['integrations']['chat']) && is_array($data['integrations']['chat'])) {
        $merged['integrations']['chat'] = array_merge($defaults['integrations']['chat'] ?? [], $data['integrations']['chat']);
    } else {
        $merged['integrations']['chat'] = $defaults['integrations']['chat'] ?? [];
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

function sanitizeBranding(array $input, array $defaults, array $current): array
{
    $base = array_merge($defaults, $current);

    return [
        'navEmblemUrl' => sanitizeUrlOrRelative($input['navEmblemUrl'] ?? $base['navEmblemUrl'] ?? 'assets/logotp.png', $base['navEmblemUrl'] ?? 'assets/logotp.png'),
        'logoUrl' => sanitizeUrlOrRelative($input['logoUrl'] ?? $base['logoUrl'] ?? 'assets/logotp.png', $base['logoUrl'] ?? 'assets/logotp.png'),
        'faviconUrl' => sanitizeUrlOrRelative($input['faviconUrl'] ?? $base['faviconUrl'] ?? 'assets/logotp.png', $base['faviconUrl'] ?? 'assets/logotp.png'),
        'heroLogoUrl' => sanitizeUrlOrRelative($input['heroLogoUrl'] ?? $base['heroLogoUrl'] ?? 'assets/logo.png', $base['heroLogoUrl'] ?? 'assets/logo.png'),
        'heroGridBackground' => sanitizeUrlOrRelative($input['heroGridBackground'] ?? $base['heroGridBackground'] ?? 'assets/logo.png', $base['heroGridBackground'] ?? 'assets/logo.png'),
    ];
}

function sanitizeContent(array $input, array $defaults, array $current): array
{
    $base = array_merge($defaults, $current);

    return [
        'heroHighlight' => sanitizeText($input['heroHighlight'] ?? $base['heroHighlight']),
        'heroEyebrow' => sanitizeText($input['heroEyebrow'] ?? $base['heroEyebrow']),
        'heroTitle' => sanitizeText($input['heroTitle'] ?? $base['heroTitle']),
        'heroTitleHtml' => sanitizeHeroTitle($input['heroTitleHtml'] ?? $base['heroTitleHtml'] ?? ''),
        'heroSubtitle' => sanitizeRichText($input['heroSubtitle'] ?? $base['heroSubtitle']),
        'serviceTagline' => sanitizeRichText($input['serviceTagline'] ?? $base['serviceTagline']),
        'serviceIntro' => sanitizeRichText($input['serviceIntro'] ?? $base['serviceIntro']),
    ];
}

function sanitizeShortener(array $input, array $defaults, array $current): array
{
    $base = array_merge($defaults, $current);
    $baseUrl = sanitizeUrlOrRelative($input['baseUrl'] ?? $base['baseUrl'], $base['baseUrl']);
    $maxLength = isset($input['maxLength']) ? (int) $input['maxLength'] : (int) ($base['maxLength'] ?? 4);
    $maxLength = max(1, min($maxLength, 12));
    $enforceHttps = array_key_exists('enforceHttps', $input)
        ? !empty($input['enforceHttps'])
        : !empty($base['enforceHttps']);
    $autoPurgeDays = isset($input['autoPurgeDays']) ? (int) $input['autoPurgeDays'] : (int) ($base['autoPurgeDays'] ?? 0);
    $autoPurgeDays = max(0, min($autoPurgeDays, 3650));
    $redirectCandidate = isset($input['redirectStatus']) ? (int) $input['redirectStatus'] : (int) ($base['redirectStatus'] ?? 302);
    $allowedStatuses = [301, 302, 307, 308];
    $redirectStatus = in_array($redirectCandidate, $allowedStatuses, true) ? $redirectCandidate : 302;
    $utmCampaign = sanitizeText($input['utmCampaign'] ?? ($base['utmCampaign'] ?? ''));

    return [
        'baseUrl' => $baseUrl,
        'maxLength' => $maxLength,
        'enforceHttps' => $enforceHttps,
        'autoPurgeDays' => $autoPurgeDays,
        'redirectStatus' => $redirectStatus,
        'utmCampaign' => $utmCampaign,
    ];
}

function sanitizeChatIntegration(array $input, array $defaults, array $current): array
{
    $base = array_merge($defaults, $current);

    $sanitized = [
        'enabled' => !empty($input['enabled']),
        'provider' => sanitizeText($input['provider'] ?? $base['provider']),
        'endpoint' => sanitizeUrlOrRelative($input['endpoint'] ?? $base['endpoint'], $base['endpoint']),
        'model' => sanitizeText($input['model'] ?? $base['model']),
        'temperature' => max(0.0, min((float) ($input['temperature'] ?? $base['temperature'] ?? 0.6), 2.0)),
        'systemPrompt' => sanitizeRichText($input['systemPrompt'] ?? $base['systemPrompt']),
        'greeting' => sanitizeRichText($input['greeting'] ?? $base['greeting']),
        'apiKey' => $base['apiKey'] ?? '',
        'avatarUrl' => sanitizeUrlOrRelative($input['avatarUrl'] ?? ($base['avatarUrl'] ?? 'assets/logotp.png'), $base['avatarUrl'] ?? 'assets/logotp.png'),
    ];

    if (array_key_exists('apiKey', $input)) {
        $candidate = trim((string) $input['apiKey']);
        if ($candidate === '') {
            $sanitized['apiKey'] = '';
        } elseif ($candidate !== '__KEEP__') {
            $sanitized['apiKey'] = $candidate;
        }
    }

    return $sanitized;
}

function sanitizeUrlOrRelative($value, string $fallback): string
{
    $value = trim((string) $value);
    if ($value === '') {
        return $fallback;
    }

    if (filter_var($value, FILTER_VALIDATE_URL)) {
        return $value;
    }

    if (preg_match('~^[A-Za-z0-9_./-]+$~', $value)) {
        return $value;
    }

    return $fallback;
}

function sanitizeText($value): string
{
    return trim(filter_var((string) $value, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW));
}

function sanitizeRichText($value): string
{
    $allowed = '<strong><em><b><i><span><br>';
    $text = strip_tags((string) $value, $allowed);
    return trim($text);
}

function sanitizeHeroTitle($value): string
{
    $allowed = '<strong><em><span><small><br>';
    $text = strip_tags((string) $value, $allowed);
    return trim($text);
}

function sanitizeFraction($value): float
{
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false) {
        $number = 0;
    }
    $number = max(0.0, min(1.0, (float) $number));
    return round($number, 3);
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
