<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config.php';

$config = require __DIR__ . '/../config/admin.config.php';
$defaults = require __DIR__ . '/../config/settings-defaults.php';
$settingsFile = $config['settings_file'] ?? __DIR__ . '/../data/settings.json';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Virheellinen JSON']);
    exit;
}

$message = trim((string) ($payload['message'] ?? ''));
if ($message === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Anna viesti']);
    exit;
}

$settings = load_settings($settingsFile, $defaults);
$chatConfig = $settings['integrations']['chat'] ?? [];

if (empty($chatConfig['enabled'])) {
    http_response_code(503);
    echo json_encode(['success' => false, 'error' => 'Chatbot on pois käytöstä']);
    exit;
}

$apiKey = (string) ($chatConfig['apiKey'] ?? '');
if ($apiKey === '') {
    http_response_code(503);
    echo json_encode(['success' => false, 'error' => 'OpenAI API -avain puuttuu']);
    exit;
}

$systemPrompt = trim((string) ($payload['systemPrompt'] ?? ($chatConfig['systemPrompt'] ?? '')));
$model = trim((string) ($payload['model'] ?? ($chatConfig['model'] ?? 'gpt-4.1-mini')));
$temperature = isset($payload['temperature']) ? (float) $payload['temperature'] : (float) ($chatConfig['temperature'] ?? 0.6);
$temperature = max(0.0, min($temperature, 2.0));

$history = [];
if (!empty($payload['history']) && is_array($payload['history'])) {
    foreach ($payload['history'] as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $role = $entry['role'] ?? '';
        $content = trim((string) ($entry['content'] ?? ''));
        if ($content === '' || !in_array($role, ['user', 'assistant'], true)) {
            continue;
        }
        $history[] = [
            'role' => $role,
            'content' => $content,
        ];
    }
}

$messages = [];
if ($systemPrompt !== '') {
    $messages[] = ['role' => 'system', 'content' => $systemPrompt];
}
$messages = array_merge($messages, $history);
$messages[] = ['role' => 'user', 'content' => $message];

try {
    $reply = request_openai_chat($apiKey, $model, $messages, $temperature);
    echo json_encode([
        'success' => true,
        'reply' => $reply,
    ]);
    exit;
} catch (Throwable $exception) {
    error_log('Chat API fallback triggered: ' . $exception->getMessage());
    $fallback = fallback_reply($message);
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'reply' => $fallback,
        'fallback' => true,
    ]);
    exit;
}

function request_openai_chat(string $apiKey, string $model, array $messages, float $temperature): string
{
    $endpoint = 'https://api.openai.com/v1/chat/completions';
    $payload = json_encode([
        'model' => $model,
        'messages' => $messages,
        'temperature' => $temperature,
    ], JSON_THROW_ON_ERROR);

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        throw new RuntimeException('OpenAI request failed: ' . curl_error($ch));
    }

    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('OpenAI HTTP status ' . $status . ' response: ' . $response);
    }

    $data = json_decode($response, true);
    if (!is_array($data) || empty($data['choices'][0]['message']['content'])) {
        throw new RuntimeException('OpenAI response missing content');
    }

    return trim((string) $data['choices'][0]['message']['content']);
}

function fallback_reply(string $message): string
{
    $text = mb_strtolower($message);

    if (str_contains($text, 'hinta') || str_contains($text, 'kustann') || str_contains($text, 'maksu')) {
        return "AnomFIN tarjoaa valmiit paketit ja räätälöidyn kehityksen:\n\n" .
            "• HyperLaunch-kotisivupalvelu 499 € (sis. domain, webhotelli ja ylläpito 5 vuodeksi)\n" .
            "• Protect SOC -valvonta 1 490 €/kk (4h SLA)\n" .
            "• Elite SOC + incident response 3 490 €/kk (1h SLA)\n\n" .
            "Sovellusprojektit iOS/Android/Windows alk. 999 €. Kerro budjetti niin ehdotamme mallia.";
    }

    if (str_contains($text, 'kyberturva') || str_contains($text, 'soc') || str_contains($text, 'turva')) {
        return "AnomFIN HyperFlux -tiimi valvoo ympäristöäsi 24/7:\n\n" .
            "• PhishHunterAI™ ja SMS Shield™ torjuvat huijaukset\n" .
            "• Kovennukset Microsoft 365 ja Google Workspace -ympäristöihin\n" .
            "• Incident-apuri: eristys, forensiikka, palautus\n\n" .
            "Pyydä demo niin rakennamme PoC:n viikoissa.";
    }

    if (str_contains($text, 'sovellus') || str_contains($text, 'kehity') || str_contains($text, 'app')) {
        return "Rakennamme sovelluksia kaikille alustoille yhdellä tiimillä:\n\n" .
            "• iOS + Android + web – yksi koodipohja, natiivin tuntuma\n" .
            "• Desktop (Windows, macOS, Linux) – AnomTools CI/CD ja automaattiset päivitykset\n" .
            "• Integraatiot CRM/ERP/AI-palveluihin turvallisesti\n\n" .
            "Demo on aina ilmainen. Kerro käyttötapaus niin ehdotamme etenemistä.";
    }

    if (str_contains($text, 'yhtey') || str_contains($text, 'contact') || str_contains($text, 'varaa')) {
        return "Saat meidät kiinni heti:\n\n" .
            "• info@anomfin.fi – myynti ja kartoitukset\n" .
            "• soc@anomfin.fi – 24/7 kyberturvapäivystys\n" .
            "• +358 40 123 4567 – HyperLaunch hotline\n\n" .
            "Voimme myös sopia videopalaverin 30 minuutissa.";
    }

    return "Olen HyperLaunch-assistentti. Autan sovelluksissa, kyberturvassa ja hinnoittelussa. Kysy rohkeasti – tiimimme rakentaa demot, integraatiot ja SOC-valvonnan samaan pakettiin.";
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
