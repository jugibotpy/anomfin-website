<?php
/**
 * AnomFIN AI Connection Handler
 * 
 * This file handles AI service interactions using database connection
 * information from connect.php and AI configuration from .env
 * 
 * @package AnomFIN
 * @version 1.0.0
 */

// Start session
session_start();

// Include database connection
require_once __DIR__ . '/connect.php';

// Security: Generate CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Check if .env exists
$envExists = file_exists(__DIR__ . '/.env');
if (!$envExists) {
    header('Location: installation.php');
    exit;
}

// AI Connection Class
class AIConnection {
    private $apiKey;
    private $apiUrl;
    private $model;
    private $maxTokens;
    private $temperature;
    private $db;
    
    public function __construct() {
        $this->apiKey = getenv('AI_API_KEY');
        $this->apiUrl = getenv('AI_API_URL') ?: 'https://api.openai.com/v1';
        $this->model = getenv('AI_MODEL') ?: 'gpt-3.5-turbo';
        $this->maxTokens = (int)(getenv('AI_MAX_TOKENS') ?: 1000);
        $this->temperature = (float)(getenv('AI_TEMPERATURE') ?: 0.7);
        
        try {
            $this->db = getDbConnection();
        } catch (Exception $e) {
            error_log("Database connection failed in AI handler: " . $e->getMessage());
        }
    }
    
    /**
     * Send query to AI service
     */
    public function sendQuery($message, $systemPrompt = null) {
        if (empty($this->apiKey)) {
            throw new Exception('AI API-avain puuttuu.');
        }
        
        // Prepare messages
        $messages = [];
        if ($systemPrompt) {
            $messages[] = [
                'role' => 'system',
                'content' => $systemPrompt
            ];
        }
        $messages[] = [
            'role' => 'user',
            'content' => $message
        ];
        
        // Prepare request data
        $data = [
            'model' => $this->model,
            'messages' => $messages,
            'max_tokens' => $this->maxTokens,
            'temperature' => $this->temperature
        ];
        
        // Make API request
        $ch = curl_init($this->apiUrl . '/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('Verkkovirhe: ' . $error);
        }
        
        if ($httpCode !== 200) {
            $errorData = json_decode($response, true);
            $errorMsg = $errorData['error']['message'] ?? 'Tuntematon virhe';
            throw new Exception('AI-palvelu virhe (' . $httpCode . '): ' . $errorMsg);
        }
        
        $result = json_decode($response, true);
        if (!isset($result['choices'][0]['message']['content'])) {
            throw new Exception('Virheellinen vastaus AI-palvelusta.');
        }
        
        // Log query to database if available
        $this->logQuery($message, $result['choices'][0]['message']['content']);
        
        return [
            'success' => true,
            'response' => $result['choices'][0]['message']['content'],
            'model' => $result['model'] ?? $this->model,
            'usage' => $result['usage'] ?? []
        ];
    }
    
    /**
     * Log AI query to database
     */
    private function logQuery($query, $response) {
        if (!$this->db) {
            return;
        }
        
        try {
            // Create logs table if it doesn't exist
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS ai_query_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    query_text TEXT NOT NULL,
                    response_text TEXT NOT NULL,
                    model VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");
            
            // Insert log entry
            $stmt = $this->db->prepare("
                INSERT INTO ai_query_logs (query_text, response_text, model, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $query,
                $response,
                $this->model,
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
            
        } catch (Exception $e) {
            error_log("Failed to log AI query: " . $e->getMessage());
        }
    }
    
    /**
     * Get query history from database
     */
    public function getQueryHistory($limit = 10) {
        if (!$this->db) {
            return [];
        }
        
        try {
            $stmt = $this->db->prepare("
                SELECT id, query_text, response_text, model, created_at
                FROM ai_query_logs
                ORDER BY created_at DESC
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            return $stmt->fetchAll();
        } catch (Exception $e) {
            error_log("Failed to get query history: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Test AI connection
     */
    public function testConnection() {
        try {
            $result = $this->sendQuery('Vastaa vain: OK', 'Vastaa lyhyesti.');
            return [
                'success' => true,
                'message' => 'AI-yhteys toimii!',
                'details' => $result
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'AI-yhteys epäonnistui: ' . $e->getMessage()
            ];
        }
    }
}

// Handle AJAX requests
if (isset($_GET['action']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    // Verify CSRF token
    $postData = json_decode(file_get_contents('php://input'), true);
    if (!isset($postData['csrf_token']) || $postData['csrf_token'] !== $_SESSION['csrf_token']) {
        echo json_encode(['success' => false, 'message' => 'Virheellinen turvallisuustunniste.']);
        exit;
    }
    
    $ai = new AIConnection();
    
    switch ($_GET['action']) {
        case 'test':
            echo json_encode($ai->testConnection());
            break;
            
        case 'query':
            try {
                $message = $postData['message'] ?? '';
                if (empty($message)) {
                    throw new Exception('Viesti on pakollinen.');
                }
                
                $systemPrompt = $postData['system_prompt'] ?? null;
                $result = $ai->sendQuery($message, $systemPrompt);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            break;
            
        case 'history':
            $history = $ai->getQueryHistory(20);
            echo json_encode([
                'success' => true,
                'history' => $history
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Tuntematon toiminto.']);
    }
    exit;
}

// HTML Interface
?>
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-yhteys - AnomFIN</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
        }
        
        * {
            box-sizing: border-box;
        }
        
        html, body {
            margin: 0;
            padding: 0;
            background: var(--bg);
            color: var(--fg);
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 24px;
        }
        
        header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        h1 {
            font-size: 2.5rem;
            margin: 0 0 12px;
            background: linear-gradient(135deg, var(--accent) 0%, var(--success) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: var(--muted);
            font-size: 1.1rem;
        }
        
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
        }
        
        .card h2 {
            margin: 0 0 20px;
            font-size: 1.4rem;
            color: var(--accent);
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        
        .status-success {
            background: rgba(0, 255, 166, 0.1);
            color: var(--success);
            border: 1px solid var(--success);
        }
        
        .status-error {
            background: rgba(255, 68, 68, 0.1);
            color: var(--error);
            border: 1px solid var(--error);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--fg);
        }
        
        textarea {
            width: 100%;
            padding: 12px;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--fg);
            font-size: 1rem;
            font-family: inherit;
            min-height: 120px;
            resize: vertical;
        }
        
        textarea:focus {
            outline: none;
            border-color: var(--accent);
        }
        
        button {
            background: var(--accent);
            color: #08111f;
            border: 1px solid #2d64a7;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.3s;
        }
        
        button:hover:not(:disabled) {
            background: #7ab5ff;
            transform: translateY(-2px);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background: #1b2a44;
            color: #cfe3ff;
            text-decoration: none;
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid #2d64a7;
            transition: all 0.3s;
        }
        
        .btn-secondary:hover {
            background: #253a5a;
            transform: translateY(-2px);
        }
        
        .actions {
            display: flex;
            gap: 12px;
            margin-top: 20px;
        }
        
        .response-box {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
            min-height: 100px;
        }
        
        .response-box pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: var(--fg);
        }
        
        .loading {
            display: inline-block;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .history-item {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .history-item .timestamp {
            color: var(--muted);
            font-size: 0.85rem;
            margin-bottom: 8px;
        }
        
        .history-item .query {
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .history-item .response {
            color: var(--muted);
        }
        
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 1.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>AI-yhteys</h1>
            <p class="subtitle">Testaa ja käytä AI-palvelua</p>
        </header>

        <div class="grid">
            <div>
                <div class="card">
                    <h2>Yhteyden testaus</h2>
                    <p style="color: var(--muted);">Testaa, että AI-palvelu on käytettävissä.</p>
                    <div class="actions">
                        <button id="testBtn">Testaa yhteyttä</button>
                    </div>
                    <div id="testResult" style="margin-top: 20px;"></div>
                </div>

                <div class="card">
                    <h2>Lähetä kysely</h2>
                    <div class="form-group">
                        <label>Viesti AI:lle</label>
                        <textarea id="queryInput" placeholder="Kirjoita kysymyksesi tähän..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Systeemikehote (valinnainen)</label>
                        <textarea id="systemPrompt" placeholder="Esim: Vastaa lyhyesti ja selkeästi." style="min-height: 80px;"></textarea>
                    </div>
                    <div class="actions">
                        <button id="queryBtn">Lähetä kysely</button>
                    </div>
                    <div id="queryResponse" class="response-box" style="display: none;">
                        <pre id="responseText"></pre>
                    </div>
                </div>
            </div>

            <div>
                <div class="card">
                    <h2>Kyselyhistoria</h2>
                    <p style="color: var(--muted);">Viimeisimmät AI-kyselyt tietokannasta.</p>
                    <div class="actions">
                        <button id="historyBtn">Lataa historia</button>
                    </div>
                    <div id="historyContainer" style="margin-top: 20px;"></div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
            <a href="index.html" class="btn-secondary">Palaa etusivulle</a>
            <a href="installation.php" class="btn-secondary">Asennusasetukset</a>
        </div>
    </div>

    <script>
        const csrfToken = '<?php echo $_SESSION['csrf_token']; ?>';

        async function testConnection() {
            const btn = document.getElementById('testBtn');
            const result = document.getElementById('testResult');
            
            btn.disabled = true;
            result.innerHTML = '<span class="loading">Testataan yhteyttä...</span>';
            
            try {
                const response = await fetch('?action=test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ csrf_token: csrfToken })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `
                        <div class="status-badge status-success">✓ ${data.message}</div>
                        <p style="color: var(--muted); font-size: 0.9rem; margin-top: 8px;">
                            Malli: ${data.details.model || 'N/A'}
                        </p>
                    `;
                } else {
                    result.innerHTML = `
                        <div class="status-badge status-error">✗ ${data.message}</div>
                    `;
                }
            } catch (error) {
                result.innerHTML = `
                    <div class="status-badge status-error">✗ Verkkovirhe: ${error.message}</div>
                `;
            }
            
            btn.disabled = false;
        }

        async function sendQuery() {
            const btn = document.getElementById('queryBtn');
            const input = document.getElementById('queryInput');
            const systemPrompt = document.getElementById('systemPrompt');
            const responseBox = document.getElementById('queryResponse');
            const responseText = document.getElementById('responseText');
            
            if (!input.value.trim()) {
                alert('Kirjoita viesti ensin.');
                return;
            }
            
            btn.disabled = true;
            responseBox.style.display = 'block';
            responseText.textContent = 'Lähetetään kysely...';
            
            try {
                const response = await fetch('?action=query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        csrf_token: csrfToken,
                        message: input.value,
                        system_prompt: systemPrompt.value || null
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    responseText.textContent = data.response;
                } else {
                    responseText.textContent = 'Virhe: ' + data.message;
                }
            } catch (error) {
                responseText.textContent = 'Verkkovirhe: ' + error.message;
            }
            
            btn.disabled = false;
        }

        async function loadHistory() {
            const btn = document.getElementById('historyBtn');
            const container = document.getElementById('historyContainer');
            
            btn.disabled = true;
            container.innerHTML = '<span class="loading">Ladataan historiaa...</span>';
            
            try {
                const response = await fetch('?action=history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ csrf_token: csrfToken })
                });
                
                const data = await response.json();
                
                if (data.success && data.history.length > 0) {
                    container.innerHTML = data.history.map(item => `
                        <div class="history-item">
                            <div class="timestamp">${item.created_at}</div>
                            <div class="query"><strong>Kysely:</strong> ${escapeHtml(item.query_text.substring(0, 100))}${item.query_text.length > 100 ? '...' : ''}</div>
                            <div class="response"><strong>Vastaus:</strong> ${escapeHtml(item.response_text.substring(0, 150))}${item.response_text.length > 150 ? '...' : ''}</div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<p style="color: var(--muted);">Ei historiaa saatavilla.</p>';
                }
            } catch (error) {
                container.innerHTML = '<p style="color: var(--error);">Virhe ladattaessa historiaa.</p>';
            }
            
            btn.disabled = false;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Event listeners
        document.getElementById('testBtn').addEventListener('click', testConnection);
        document.getElementById('queryBtn').addEventListener('click', sendQuery);
        document.getElementById('historyBtn').addEventListener('click', loadHistory);

        // Allow Enter to send query (with Shift+Enter for new line)
        document.getElementById('queryInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuery();
            }
        });
    </script>
</body>
</html>
