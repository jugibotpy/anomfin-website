<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/shortener.php';

$config = require __DIR__ . '/config/admin.config.php';
$defaults = require __DIR__ . '/config/settings-defaults.php';
$settingsFile = $config['settings_file'] ?? __DIR__ . '/data/settings.json';

$settings = anomfin_load_settings($settingsFile, $defaults);
$shortener = $settings['shortener'] ?? [];
$redirectStatus = (int) ($shortener['redirectStatus'] ?? 302);
if (!in_array($redirectStatus, [301, 302, 307, 308], true)) {
    $redirectStatus = 302;
}

if (isset($_GET['s'])) {
    $code = strtolower(trim((string) $_GET['s']));
    $code = preg_replace('/[^a-z0-9]/', '', $code);

    if ($code !== '') {
        $target = anomfin_resolve_short_link($code);
        if ($target !== null) {
            $cleanTarget = str_replace(["\r", "\n"], '', $target);
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
            header('Location: ' . $cleanTarget, true, $redirectStatus);
            $escapedTarget = htmlspecialchars($cleanTarget, ENT_QUOTES, 'UTF-8');
            echo '<!DOCTYPE html><html lang="fi"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=' . $escapedTarget . '"><title>Uudelleenohjataan…</title></head><body><p>Uudelleenohjataan kohteeseen <a href="' . $escapedTarget . '">' . $escapedTarget . '</a>.</p></body></html>';
            exit;
        }
    }

    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="fi"><head><meta charset="UTF-8"><title>Lyhytlinkkiä ei löytynyt</title><style>body{font-family:Inter,system-ui,-apple-system,sans-serif;background:#05070d;color:#e6eef8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}main{background:#0f1626;border:1px solid #1a2739;border-radius:16px;padding:32px;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,0.45);}h1{font-size:1.6rem;margin-bottom:12px;color:#62a1ff;}p{margin:0 0 16px;color:#9fb3c8;}a{color:#62a1ff;text-decoration:none;font-weight:600;}</style></head><body><main><h1>Lyhytlinkkiä ei löytynyt</h1><p>Pyytämääsi lyhytlinkkiä ei ole olemassa tai se on vanhentunut.</p><p><a href="/">Palaa etusivulle</a> · <a href="mailto:info@anomfin.fi">Ota yhteyttä AnomFIN-tiimiin</a></p></main></body></html>';
    exit;
}

$indexHtml = __DIR__ . '/index.html';
if (!is_file($indexHtml)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Etusivun tiedostoa ei löytynyt. Ota yhteyttä ylläpitoon.";
    exit;
}

header('Content-Type: text/html; charset=utf-8');
readfile($indexHtml);

function anomfin_resolve_short_link(string $code): ?string
{
    $pdo = anomfin_get_pdo();
    if ($pdo instanceof \PDO) {
        try {
            $stmt = $pdo->prepare('SELECT target_url FROM short_links WHERE code = :code LIMIT 1');
            $stmt->execute(['code' => $code]);
            $target = $stmt->fetchColumn();
            if (is_string($target) && $target !== '') {
                return $target;
            }
        } catch (\Throwable $exception) {
            error_log('Shortener resolve DB error: ' . $exception->getMessage());
        }
    }

    $links = anomfin_load_link_store();
    if (isset($links[$code]['url']) && is_string($links[$code]['url'])) {
        return $links[$code]['url'];
    }

    return null;
}

