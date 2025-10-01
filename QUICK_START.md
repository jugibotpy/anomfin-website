# Quick Start Guide - AnomFIN PHP Backend

## 🚀 Quick Installation (5 minutes)

### 1. Prerequisites Check
```bash
# Check PHP version (need 7.4+)
php -v

# Check required extensions
php -m | grep -E "pdo|curl|json|mbstring"

# Check MySQL
mysql --version
```

### 2. Create Database
```sql
mysql -u root -p
CREATE DATABASE anomfin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'anomfin_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON anomfin_db.* TO 'anomfin_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Open Installation Page
Navigate to: `http://your-domain.com/installation.php`

Fill in:
- **Database Host**: localhost
- **Database Name**: anomfin_db
- **Database User**: anomfin_user
- **Database Password**: YourSecurePassword123!
- **Database Port**: 3306
- **AI API Key**: sk-your-openai-api-key
- **AI API URL**: https://api.openai.com/v1
- **AI Model**: gpt-3.5-turbo

Click **"Asenna ja testaa yhteys"** (Install and test connection)

### 4. Test AI Connection
Navigate to: `http://your-domain.com/ai_connect.php`

Click **"Testaa yhteyttä"** (Test connection)

## 📁 File Structure

```
anomfin-website/
├── .env.example          # Environment template
├── .env                  # Created by installation (DO NOT COMMIT)
├── connect.php           # Database connection handler
├── installation.php      # Web-based setup interface
├── ai_connect.php        # AI service handler
├── PHP_BACKEND_README.md # Full documentation
└── QUICK_START.md        # This file
```

## 🔒 Security Checklist

- [ ] .env file has 600 permissions (`chmod 600 .env`)
- [ ] .env is in .gitignore (already configured)
- [ ] Using strong database password
- [ ] AI API key is kept secret
- [ ] HTTPS enabled in production
- [ ] PHP display_errors = Off in production

## 🎯 Common Use Cases

### Test Database Connection
```php
<?php
require_once 'connect.php';
if (testDbConnection()) {
    echo "Database connected!";
}
?>
```

### Send AI Query (PHP)
```php
<?php
require_once 'ai_connect.php';
$ai = new AIConnection();
$result = $ai->sendQuery("What is cybersecurity?");
echo $result['response'];
?>
```

### Send AI Query (JavaScript)
```javascript
const response = await fetch('ai_connect.php?action=query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        csrf_token: 'get-from-session',
        message: 'What is cybersecurity?'
    })
});
const data = await response.json();
console.log(data.response);
```

## 🛠️ Troubleshooting

### "Cannot write .env file"
```bash
# Fix directory permissions
chmod 755 /var/www/html
chown -R www-data:www-data /var/www/html
```

### "Database connection failed"
```bash
# Check MySQL is running
systemctl status mysql

# Test connection manually
mysql -h localhost -u anomfin_user -p anomfin_db
```

### "AI API error"
- Verify API key is correct (starts with `sk-`)
- Check API URL is correct
- Ensure outbound HTTPS is allowed
- Verify you have API credits

### "Call to undefined function curl_init"
```bash
# Install curl extension
sudo apt-get install php-curl
sudo systemctl restart apache2  # or nginx/php-fpm
```

## 📊 Features Overview

### installation.php
✅ Web-based configuration interface  
✅ Input validation and security  
✅ Database connection testing  
✅ Automatic .env file creation  
✅ CSRF protection  
✅ Finnish language support  

### connect.php
✅ Singleton database connection  
✅ PDO with prepared statements  
✅ Environment variable management  
✅ Connection pooling  
✅ Error handling  

### ai_connect.php
✅ OpenAI API integration  
✅ Query logging to database  
✅ Web interface for testing  
✅ AJAX API endpoints  
✅ Query history retrieval  
✅ CSRF protection  
✅ Session management  

## 🔗 API Reference

### Test Connection
```
POST /ai_connect.php?action=test
Body: { "csrf_token": "..." }
```

### Send Query
```
POST /ai_connect.php?action=query
Body: { 
    "csrf_token": "...",
    "message": "Your question",
    "system_prompt": "Optional instruction"
}
```

### Get History
```
POST /ai_connect.php?action=history
Body: { "csrf_token": "..." }
```

## 📞 Support

- **Documentation**: See PHP_BACKEND_README.md for full details
- **Email**: info@anomfin.fi
- **Website**: https://anomfin.fi

## ⚡ Next Steps

1. Complete installation via `installation.php`
2. Test AI connection via `ai_connect.php`
3. Integrate into your application
4. Set up regular database backups
5. Monitor API usage and costs
6. Configure production security settings

---

**Important**: Never commit the `.env` file to version control!

© 2025 AnomFIN - All rights reserved
