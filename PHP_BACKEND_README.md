# AnomFIN PHP Backend - Installation & AI Connection

This directory contains PHP backend files for AnomFIN website's database and AI service integration.

## Files Overview

### Core Files

- **`.env.example`** - Template for environment configuration file
- **`connect.php`** - Database connection handler using PDO and singleton pattern
- **`installation.php`** - Web-based installation interface for initial setup
- **`ai_connect.php`** - AI service connection handler with query management

## Installation Guide

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher (or MariaDB 10.2+)
- PHP extensions:
  - `pdo`
  - `pdo_mysql`
  - `curl`
  - `json`
  - `mbstring`
- Web server (Apache, Nginx, etc.)
- OpenAI API key or compatible AI service

### Step 1: Initial Setup

1. **Copy files to your web server:**
   ```bash
   # Copy PHP files to your web root
   cp *.php /var/www/html/
   cp .env.example /var/www/html/
   ```

2. **Set proper file permissions:**
   ```bash
   chmod 644 *.php
   chmod 600 .env.example
   chown www-data:www-data *.php .env.example
   ```

### Step 2: Database Setup

1. **Create MySQL database:**
   ```sql
   CREATE DATABASE anomfin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'anomfin_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON anomfin_db.* TO 'anomfin_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Step 3: Run Installation

1. **Open installation page in browser:**
   ```
   https://yourdomain.com/installation.php
   ```

2. **Fill in the configuration form:**
   - Database host (usually `localhost`)
   - Database name (e.g., `anomfin_db`)
   - Database username
   - Database password
   - Database port (default: `3306`)
   - AI API Key (from OpenAI or compatible service)
   - AI API URL (default: `https://api.openai.com/v1`)
   - AI Model (e.g., `gpt-3.5-turbo`, `gpt-4`)

3. **Submit the form**
   - The system will test the database connection
   - If successful, `.env` file will be created automatically
   - Installation page will confirm success

### Step 4: Verify Installation

1. **Check that `.env` was created:**
   ```bash
   ls -la .env
   # Should show: -rw------- (600 permissions)
   ```

2. **Test AI connection:**
   ```
   https://yourdomain.com/ai_connect.php
   ```

## Security Features

### Database Connection (`connect.php`)

- ✅ Singleton pattern prevents multiple connections
- ✅ PDO with prepared statements (SQL injection protection)
- ✅ Environment variable isolation
- ✅ Error logging instead of exposing errors
- ✅ Proper connection cleanup

### Installation Page (`installation.php`)

- ✅ CSRF token protection
- ✅ Input validation and sanitization
- ✅ Database connection testing before saving
- ✅ Secure file permissions (600 for .env)
- ✅ Prevents reinstallation if .env exists
- ✅ Password fields with proper handling
- ✅ XSS protection via htmlspecialchars

### AI Connection (`ai_connect.php`)

- ✅ CSRF token for all AJAX requests
- ✅ Session-based authentication
- ✅ API key stored securely in .env
- ✅ Query logging to database
- ✅ IP address and user agent tracking
- ✅ Error handling without exposing sensitive data
- ✅ Timeout protection (30 seconds)
- ✅ SQL injection protection with prepared statements

## Environment Variables

The `.env` file contains the following configuration:

```env
# Database Configuration
DB_HOST=localhost           # MySQL server host
DB_NAME=anomfin_db         # Database name
DB_USER=root               # Database username
DB_PASSWORD=               # Database password
DB_PORT=3306              # MySQL port
DB_CHARSET=utf8mb4        # Character set

# AI Service Configuration
AI_API_KEY=sk-...         # OpenAI API key
AI_API_URL=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo    # AI model to use
AI_MAX_TOKENS=1000        # Max response length
AI_TEMPERATURE=0.7        # Response creativity (0-1)

# Application Settings
APP_ENV=production        # Environment (production/development)
APP_DEBUG=false          # Debug mode
APP_URL=https://anomfin.fi

# Security Settings
SESSION_SECRET=...        # Session encryption key
ENCRYPTION_KEY=...        # Data encryption key
```

## Usage Examples

### Database Connection

```php
<?php
require_once 'connect.php';

// Get database connection
$db = getDbConnection();

// Execute query
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([1]);
$user = $stmt->fetch();
?>
```

### AI Service

```php
<?php
require_once 'ai_connect.php';

// Create AI connection
$ai = new AIConnection();

// Send query
$result = $ai->sendQuery(
    "What is cybersecurity?",
    "You are a helpful cybersecurity expert."
);

echo $result['response'];
?>
```

### AJAX Query Example

```javascript
// Test AI connection
const response = await fetch('ai_connect.php?action=test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        csrf_token: 'your_csrf_token'
    })
});

const data = await response.json();
console.log(data);
```

## Database Schema

The AI connection handler automatically creates the following table:

```sql
CREATE TABLE ai_query_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## API Endpoints

### `ai_connect.php`

**Test Connection**
```
POST /ai_connect.php?action=test
Body: { "csrf_token": "..." }
Response: { "success": true, "message": "...", "details": {...} }
```

**Send Query**
```
POST /ai_connect.php?action=query
Body: { 
    "csrf_token": "...",
    "message": "Your question",
    "system_prompt": "Optional system instruction"
}
Response: { "success": true, "response": "AI response", "model": "...", "usage": {...} }
```

**Get History**
```
POST /ai_connect.php?action=history
Body: { "csrf_token": "..." }
Response: { "success": true, "history": [...] }
```

## Troubleshooting

### Installation Issues

**Problem:** "Cannot write .env file"
- **Solution:** Check directory permissions: `chmod 755 /var/www/html`

**Problem:** "Database connection failed"
- **Solution:** Verify MySQL is running: `systemctl status mysql`
- **Solution:** Check credentials and ensure database exists

### AI Connection Issues

**Problem:** "AI API key missing"
- **Solution:** Run installation.php again or manually edit .env

**Problem:** "Network timeout"
- **Solution:** Check firewall allows outbound HTTPS
- **Solution:** Verify AI API URL is correct

**Problem:** "Query logging fails"
- **Solution:** Ensure database user has CREATE TABLE privilege
- **Solution:** Check disk space for database

### Common PHP Errors

**Problem:** "Call to undefined function curl_init"
- **Solution:** Install PHP curl: `apt-get install php-curl`

**Problem:** "PDO extension not found"
- **Solution:** Install PHP PDO: `apt-get install php-mysql`

## Security Best Practices

1. **Never commit .env file to version control**
   - Already configured in .gitignore
   - Use .env.example as template

2. **Use strong database passwords**
   - Minimum 16 characters
   - Mix of letters, numbers, symbols

3. **Restrict .env file permissions**
   - Always keep at 600 (owner read/write only)
   - Verify: `ls -la .env`

4. **Keep API keys secure**
   - Never expose in client-side code
   - Rotate keys regularly
   - Monitor API usage

5. **Enable HTTPS in production**
   - Use Let's Encrypt for free SSL
   - Configure web server for HTTPS

6. **Regular backups**
   - Database backups daily
   - Configuration backups weekly

## Development vs Production

### Development Settings
```env
APP_ENV=development
APP_DEBUG=true
```

### Production Settings
```env
APP_ENV=production
APP_DEBUG=false
```

## Support

For issues or questions:
- Email: info@anomfin.fi
- Website: https://anomfin.fi

## License

© 2025 AnomFIN - All rights reserved
