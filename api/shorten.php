<?php
/**
 * AnomFIN Link Shortener API
 * 
 * POST endpoint to create shortened URLs
 * Returns JSON response with success status and short URL
 * 
 * @package AnomFIN
 * @version 1.0.0
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// CORS headers for local development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && (
    strpos($origin, 'localhost') !== false ||
    strpos($origin, '127.0.0.1') !== false ||
    strpos($origin, 'anomfin.fi') !== false
)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. Use POST.'
    ]);
    exit;
}

// Load database configuration
require_once dirname(__DIR__) . '/config.php';

/**
 * Send JSON error response
 */
function send_error(string $message, int $code = 400): void
{
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit;
}

/**
 * Generate random short code
 */
function generate_short_code(int $length = 4): string
{
    $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = '';
    $max = strlen($characters) - 1;
    
    for ($i = 0; $i < $length; $i++) {
        $code .= $characters[random_int(0, $max)];
    }
    
    return $code;
}

/**
 * Validate URL format
 */
function validate_url(string $url): bool
{
    // Must start with http:// or https://
    if (!preg_match('/^https?:\/\/.+/i', $url)) {
        return false;
    }
    
    // Use filter_var for additional validation
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

/**
 * Validate short code format
 */
function validate_code(string $code): bool
{
    // Only alphanumeric, 1-10 characters
    return preg_match('/^[a-zA-Z0-9]{1,10}$/', $code) === 1;
}

// Get database connection
$pdo = anomfin_get_pdo();

if (!$pdo) {
    send_error('Database connection failed', 503);
}

// Parse JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    send_error('Invalid JSON input');
}

// Validate required field: url
$url = trim($data['url'] ?? '');
if (empty($url)) {
    send_error('URL is required');
}

if (!validate_url($url)) {
    send_error('Invalid URL format. URL must start with http:// or https://');
}

// Check URL length (reasonable limit)
if (strlen($url) > 2000) {
    send_error('URL is too long (max 2000 characters)');
}

// Get optional custom code (alias)
$customCode = trim($data['code'] ?? '');
$code = '';

if (!empty($customCode)) {
    // User provided a custom code
    if (!validate_code($customCode)) {
        send_error('Invalid code format. Use only letters and numbers (1-10 characters)');
    }
    
    // Check if code already exists
    try {
        $stmt = $pdo->prepare('SELECT id FROM link_shortener WHERE code = :code LIMIT 1');
        $stmt->execute(['code' => $customCode]);
        
        if ($stmt->fetch()) {
            send_error('Code already exists. Please choose another code.');
        }
        
        $code = $customCode;
    } catch (PDOException $e) {
        error_log('Link shortener code check failed: ' . $e->getMessage());
        send_error('Database error', 500);
    }
} else {
    // Generate random code
    $maxAttempts = 10;
    $attempt = 0;
    
    try {
        while ($attempt < $maxAttempts) {
            $code = generate_short_code(4);
            
            // Check if code exists
            $stmt = $pdo->prepare('SELECT id FROM link_shortener WHERE code = :code LIMIT 1');
            $stmt->execute(['code' => $code]);
            
            if (!$stmt->fetch()) {
                // Code is unique
                break;
            }
            
            $attempt++;
        }
        
        if ($attempt >= $maxAttempts) {
            send_error('Failed to generate unique code. Please try again.', 500);
        }
    } catch (PDOException $e) {
        error_log('Link shortener code generation failed: ' . $e->getMessage());
        send_error('Database error', 500);
    }
}

// Insert into database
try {
    $stmt = $pdo->prepare('
        INSERT INTO link_shortener (code, url, created_at, hits)
        VALUES (:code, :url, NOW(), 0)
    ');
    
    $stmt->execute([
        'code' => $code,
        'url' => $url
    ]);
    
    // Build short URL
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'anomfin.fi';
    $shortUrl = "{$protocol}://{$host}/s/{$code}";
    
    // Success response
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'short_url' => $shortUrl,
        'code' => $code
    ]);
    
} catch (PDOException $e) {
    error_log('Link shortener insert failed: ' . $e->getMessage());
    send_error('Failed to create short link', 500);
}
