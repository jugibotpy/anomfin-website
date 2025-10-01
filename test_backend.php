<?php
/**
 * AnomFIN Backend Test Script
 * 
 * This script tests the installation and configuration
 * of the PHP backend components.
 * 
 * @package AnomFIN
 * @version 1.0.0
 */

// Prevent direct access on production
if (getenv('APP_ENV') === 'production' && !isset($_GET['allow_test'])) {
    die('Test script disabled in production. Add ?allow_test=1 to URL if you really need to test.');
}

$results = [];

// Test 1: Check PHP version
$phpVersion = phpversion();
$results['php_version'] = [
    'status' => version_compare($phpVersion, '7.4.0', '>='),
    'message' => "PHP Version: $phpVersion",
    'required' => 'PHP 7.4 or higher'
];

// Test 2: Check required extensions
$requiredExtensions = ['pdo', 'pdo_mysql', 'curl', 'json', 'mbstring'];
foreach ($requiredExtensions as $ext) {
    $loaded = extension_loaded($ext);
    $results["ext_$ext"] = [
        'status' => $loaded,
        'message' => "Extension '$ext': " . ($loaded ? 'Loaded' : 'Not loaded'),
        'required' => 'Required'
    ];
}

// Test 3: Check if .env exists
$envExists = file_exists(__DIR__ . '/.env');
$results['env_file'] = [
    'status' => $envExists,
    'message' => '.env file: ' . ($envExists ? 'Found' : 'Not found'),
    'required' => 'Run installation.php to create'
];

// Test 4: Check connect.php
$connectExists = file_exists(__DIR__ . '/connect.php');
$results['connect_file'] = [
    'status' => $connectExists,
    'message' => 'connect.php: ' . ($connectExists ? 'Found' : 'Not found'),
    'required' => 'Required'
];

// Test 5: Check installation.php
$installExists = file_exists(__DIR__ . '/installation.php');
$results['install_file'] = [
    'status' => $installExists,
    'message' => 'installation.php: ' . ($installExists ? 'Found' : 'Not found'),
    'required' => 'Required'
];

// Test 6: Check ai_connect.php
$aiConnectExists = file_exists(__DIR__ . '/ai_connect.php');
$results['ai_connect_file'] = [
    'status' => $aiConnectExists,
    'message' => 'ai_connect.php: ' . ($aiConnectExists ? 'Found' : 'Not found'),
    'required' => 'Required'
];

// Test 7: Test database connection (if .env exists)
if ($envExists && $connectExists) {
    try {
        require_once __DIR__ . '/connect.php';
        $dbTest = testDbConnection();
        $results['database'] = [
            'status' => $dbTest,
            'message' => 'Database connection: ' . ($dbTest ? 'Success' : 'Failed'),
            'required' => 'Required for full functionality'
        ];
    } catch (Exception $e) {
        $results['database'] = [
            'status' => false,
            'message' => 'Database connection error: ' . $e->getMessage(),
            'required' => 'Required for full functionality'
        ];
    }
}

// Test 8: Check file permissions
if ($envExists) {
    $envPerms = substr(sprintf('%o', fileperms(__DIR__ . '/.env')), -3);
    $securePerms = ($envPerms === '600');
    $results['env_permissions'] = [
        'status' => $securePerms,
        'message' => ".env permissions: $envPerms " . ($securePerms ? '(secure)' : '(insecure!)'),
        'required' => 'Should be 600 for security'
    ];
}

// Test 9: Check AI configuration
if ($envExists) {
    require_once __DIR__ . '/connect.php';
    $aiKey = getenv('AI_API_KEY');
    $aiKeyConfigured = !empty($aiKey) && $aiKey !== 'your_ai_api_key_here';
    $results['ai_config'] = [
        'status' => $aiKeyConfigured,
        'message' => 'AI API Key: ' . ($aiKeyConfigured ? 'Configured' : 'Not configured'),
        'required' => 'Required for AI features'
    ];
}

// Calculate overall status
$allPassed = true;
foreach ($results as $test) {
    if (!$test['status']) {
        $allPassed = false;
        break;
    }
}

?>
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backend Test - AnomFIN</title>
    <style>
        :root {
            --fg: #e6eef8;
            --bg: #0b0f1a;
            --muted: #9fb3c8;
            --card: #11192a;
            --border: #1e2a3a;
            --accent: #62a1ff;
            --success: #00ffa6;
            --error: #ff4444;
            --warning: #ffaa00;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 40px 20px;
            background: var(--bg);
            color: var(--fg);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            margin-bottom: 10px;
            color: var(--accent);
        }
        
        .overall-status {
            text-align: center;
            padding: 20px;
            margin: 30px 0;
            border-radius: 12px;
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .overall-status.pass {
            background: rgba(0, 255, 166, 0.1);
            border: 2px solid var(--success);
            color: var(--success);
        }
        
        .overall-status.fail {
            background: rgba(255, 68, 68, 0.1);
            border: 2px solid var(--error);
            color: var(--error);
        }
        
        .test-item {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            gap: 16px;
        }
        
        .test-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .test-icon.pass {
            color: var(--success);
        }
        
        .test-icon.fail {
            color: var(--error);
        }
        
        .test-content {
            flex: 1;
        }
        
        .test-message {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .test-required {
            color: var(--muted);
            font-size: 0.9rem;
        }
        
        .actions {
            text-align: center;
            margin-top: 40px;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 8px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: var(--accent);
            color: #08111f;
        }
        
        .btn-primary:hover {
            background: #7ab5ff;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #1b2a44;
            color: #cfe3ff;
            border: 1px solid #2d64a7;
        }
        
        .btn-secondary:hover {
            background: #253a5a;
            transform: translateY(-2px);
        }
        
        .info-box {
            background: rgba(98, 161, 255, 0.1);
            border: 1px solid var(--accent);
            border-radius: 8px;
            padding: 16px;
            margin-top: 30px;
            color: var(--muted);
        }
        
        code {
            background: var(--bg);
            padding: 2px 6px;
            border-radius: 4px;
            color: var(--accent);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 AnomFIN Backend Test</h1>
        <p style="text-align: center; color: var(--muted);">System configuration and requirements check</p>
        
        <div class="overall-status <?php echo $allPassed ? 'pass' : 'fail'; ?>">
            <?php if ($allPassed): ?>
                ✅ All tests passed! System is ready.
            <?php else: ?>
                ⚠️ Some tests failed. Please review below.
            <?php endif; ?>
        </div>
        
        <?php foreach ($results as $key => $result): ?>
            <div class="test-item">
                <div class="test-icon <?php echo $result['status'] ? 'pass' : 'fail'; ?>">
                    <?php echo $result['status'] ? '✓' : '✗'; ?>
                </div>
                <div class="test-content">
                    <div class="test-message"><?php echo htmlspecialchars($result['message']); ?></div>
                    <div class="test-required"><?php echo htmlspecialchars($result['required']); ?></div>
                </div>
            </div>
        <?php endforeach; ?>
        
        <?php if (!$envExists): ?>
            <div class="info-box">
                <strong>⚡ Next Step:</strong> Run the installation wizard to create your configuration file.
                <br>Navigate to <code>installation.php</code> to get started.
            </div>
        <?php endif; ?>
        
        <div class="actions">
            <?php if (!$envExists): ?>
                <a href="installation.php" class="btn btn-primary">Run Installation</a>
            <?php else: ?>
                <a href="ai_connect.php" class="btn btn-primary">Test AI Connection</a>
            <?php endif; ?>
            <a href="index.html" class="btn btn-secondary">Back to Home</a>
            <a href="?<?php echo http_build_query(array_merge($_GET, ['refresh' => time()])); ?>" class="btn btn-secondary">Refresh Tests</a>
        </div>
        
        <div class="info-box" style="margin-top: 40px;">
            <strong>📚 Documentation:</strong>
            <ul style="margin: 10px 0;">
                <li><code>PHP_BACKEND_README.md</code> - Full documentation</li>
                <li><code>QUICK_START.md</code> - Quick start guide</li>
            </ul>
        </div>
    </div>
</body>
</html>
