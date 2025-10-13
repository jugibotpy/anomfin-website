<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$source = __DIR__ . '/data/luvut-taulukot.json';
if (!file_exists($source)) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Lähdetaulukkoa ei löydy (luvut-taulukot.json)'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode((string) file_get_contents($source), true);
if (!is_array($payload)) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Taulukon rakenne on virheellinen'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$users = array_keys($payload);
$userParam = isset($_GET['user']) ? strtoupper(trim((string) $_GET['user'])) : '';
$idParam = isset($_GET['id']) ? strtoupper(trim((string) $_GET['id'])) : '';

if ($userParam === '') {
    echo json_encode([
        'ok' => true,
        'users' => $users,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($payload[$userParam])) {
    http_response_code(404);
    echo json_encode([
        'ok' => false,
        'error' => 'Valittua käyttäjää ei löytynyt',
        'users' => $users,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($idParam === '') {
    echo json_encode([
        'ok' => true,
        'user' => $userParam,
        'codes' => $payload[$userParam],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$codes = $payload[$userParam];
$code = $codes[$idParam] ?? null;

if ($code === null) {
    http_response_code(404);
    echo json_encode([
        'ok' => false,
        'error' => 'Tunnistetta ei löytynyt taulukosta',
        'user' => $userParam,
        'id' => $idParam,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'ok' => true,
    'user' => $userParam,
    'id' => $idParam,
    'code' => $code,
], JSON_UNESCAPED_UNICODE);
