# Link Shortener Feature - AnomFIN

## Overview

The link shortener feature allows users to create short, memorable URLs that redirect to longer target URLs. This feature includes:

- **Frontend Form**: User-friendly form in the hero section of the homepage
- **API Endpoint**: RESTful API for creating short links
- **Redirect Handler**: Efficient URL resolution with hit tracking
- **Database Storage**: Persistent storage of shortened links
- **Analytics**: Hit counter for tracking link usage

## Files

### New Files Created

1. **`api/shorten.php`** - API endpoint for creating short URLs
   - POST endpoint accepting JSON `{url, code?}`
   - Validates URL format and custom codes
   - Generates random codes if not provided
   - Returns `{success, short_url, code}`

2. **`redirect.php`** - Redirect handler
   - Resolves `/s/{code}` URLs to target URLs
   - Increments hit counter for analytics
   - Shows user-friendly 404 page for invalid codes
   - 302 temporary redirects

3. **`js/shortener.js`** - Frontend JavaScript
   - Form validation and submission
   - Async API calls with fetch()
   - Clipboard copy functionality
   - Status message handling

4. **`.htaccess`** - Apache configuration
   - Rewrite rule: `/s/{code}` → `redirect.php?c={code}`
   - Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
   - Compression and caching rules

### Modified Files

1. **`install.php`** - Installation script
   - Added `createDatabaseTables()` function
   - Creates `link_shortener` table during installation
   - Added `createHtaccessFile()` function
   - Automatically creates .htaccess if missing

2. **`index.html`** - Homepage
   - Added `<script src="js/shortener.js" defer></script>`
   - Form already exists in hero section (lines 90-110)

## Database Schema

### `link_shortener` Table

```sql
CREATE TABLE IF NOT EXISTS link_shortener (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    url VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hits INT DEFAULT 0,
    INDEX idx_code (code),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Fields:**
- `id`: Primary key, auto-increment
- `code`: Short code (1-10 alphanumeric characters), unique
- `url`: Target URL (max 2000 characters)
- `created_at`: Timestamp when link was created
- `hits`: Number of times link has been accessed

## Installation

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7+ or MariaDB 10.2+
- Apache with mod_rewrite enabled
- Database connection configured in `config.php`

### Steps

1. **Run install.php**
   ```
   Navigate to: https://yourdomain.com/install.php
   ```
   
2. **Enter database credentials**
   - Database host (usually `localhost`)
   - Database name (e.g., `anomfinf_anomfinf`)
   - Database user (e.g., `anomfinf_anomfinf`)
   - Database password

3. **Installation will automatically:**
   - Create `.env` file with configuration
   - Create `link_shortener` table
   - Create `.htaccess` file with rewrite rules
   - Set up security configurations

4. **Remove install.php** (IMPORTANT!)
   ```bash
   rm install.php
   # or via FTP/File Manager
   ```

### Manual Installation (Alternative)

If automatic installation fails, you can manually:

1. **Create the table:**
   ```sql
   CREATE TABLE link_shortener (
       id INT AUTO_INCREMENT PRIMARY KEY,
       code VARCHAR(10) NOT NULL UNIQUE,
       url VARCHAR(2000) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       hits INT DEFAULT 0,
       INDEX idx_code (code),
       INDEX idx_created (created_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
   ```

2. **Upload .htaccess** (already included in repository)

3. **Verify config.php** has database credentials

## Usage

### Creating a Short Link

**Via Web Interface:**
1. Navigate to homepage: `https://anomfin.fi`
2. Find the "Link Shortener" form in the hero section
3. Enter the long URL (must start with `http://` or `https://`)
4. Optionally enter a custom alias (1-4 alphanumeric characters)
5. Click "Luo lyhyt linkki" (Create short link)
6. Copy the generated short URL

**Via API:**
```bash
curl -X POST https://anomfin.fi/api/shorten.php \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very/long/url",
    "code": "demo"
  }'
```

**Response:**
```json
{
  "success": true,
  "short_url": "https://anomfin.fi/s/demo",
  "code": "demo"
}
```

### Using a Short Link

Simply visit: `https://anomfin.fi/s/{code}`

Example: `https://anomfin.fi/s/demo`

The system will:
1. Look up the code in the database
2. Increment the hit counter
3. Redirect to the target URL (302 redirect)

## API Reference

### POST /api/shorten.php

Create a new short link.

**Request:**
```json
{
  "url": "https://example.com/long-url",
  "code": "optional-custom-code"
}
```

**Request Fields:**
- `url` (required): Target URL, must start with `http://` or `https://`, max 2000 characters
- `code` (optional): Custom short code, 1-10 alphanumeric characters

**Success Response (201):**
```json
{
  "success": true,
  "short_url": "https://anomfin.fi/s/abc1",
  "code": "abc1"
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Common Errors:**
- `400`: Invalid input (missing URL, invalid format, invalid code)
- `400`: Code already exists
- `405`: Method not allowed (use POST)
- `500`: Database error
- `503`: Database connection failed

## Security

### Input Validation

- **URL Validation**: Must start with `http://` or `https://` and pass `filter_var()` validation
- **Code Validation**: Only alphanumeric characters (a-z, A-Z, 0-9), 1-10 characters
- **SQL Injection Prevention**: All queries use prepared statements with PDO
- **XSS Prevention**: All user input is sanitized with `htmlspecialchars()` before output

### Security Headers

The `.htaccess` file includes:
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS filter
- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

### Best Practices

1. **Remove install.php** after installation
2. **Use HTTPS** for production (protects data in transit)
3. **Regular backups** of the database
4. **Monitor** for abuse (spam links, malicious URLs)
5. **Rate limiting** (consider implementing in production)

## Configuration

### Database Connection

The shortener uses the existing `config.php` database connection:

```php
require_once dirname(__DIR__) . '/config.php';
$pdo = anomfin_get_pdo();
```

**Environment Variables (via .env or environment):**
- `ANOMFIN_DB_HOST` - Database host (default: localhost)
- `ANOMFIN_DB_NAME` - Database name
- `ANOMFIN_DB_USER` - Database username
- `ANOMFIN_DB_PASS` - Database password
- `ANOMFIN_DB_PORT` - Database port (default: 3306)

### Apache Configuration

**Enable mod_rewrite:**
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**Verify .htaccess is allowed:**
In your Apache config or vhost:
```apache
<Directory /var/www/html>
    AllowOverride All
</Directory>
```

## Troubleshooting

### 404 Error on /s/{code}

**Problem:** Short links return 404 Not Found

**Solutions:**
1. Check if `.htaccess` exists in the web root
2. Verify mod_rewrite is enabled: `apache2ctl -M | grep rewrite`
3. Check Apache config allows `.htaccess`: `AllowOverride All`
4. Verify RewriteBase in `.htaccess` matches your setup

### Database Connection Failed

**Problem:** API returns "Database connection failed"

**Solutions:**
1. Check `config.php` has correct credentials
2. Verify database exists and is accessible
3. Check database user has permissions (SELECT, INSERT, UPDATE)
4. Test connection: `mysql -h localhost -u username -p database`

### Code Already Exists

**Problem:** Custom code is already taken

**Solutions:**
1. Choose a different custom code
2. Let the system auto-generate a random code (leave code field empty)

### Link Not Found

**Problem:** Short link shows "Linkkiä ei löytynyt" (Link not found)

**Solutions:**
1. Verify the code exists in database: `SELECT * FROM link_shortener WHERE code='xyz'`
2. Check case sensitivity (codes are case-sensitive)
3. Verify table was created during installation

## Analytics

### View Link Statistics

To view link usage statistics, query the database:

```sql
-- Most popular links
SELECT code, url, hits, created_at 
FROM link_shortener 
ORDER BY hits DESC 
LIMIT 10;

-- Recent links
SELECT code, url, hits, created_at 
FROM link_shortener 
ORDER BY created_at DESC 
LIMIT 10;

-- Total links and hits
SELECT 
    COUNT(*) as total_links,
    SUM(hits) as total_hits
FROM link_shortener;
```

### Future Enhancements

Consider adding:
- Admin panel for managing links
- Link expiration dates
- Custom domains
- QR code generation
- Click-through tracking (geographic data, referrers)
- Link editing/deletion
- Rate limiting per IP
- Analytics dashboard

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Clipboard API**: Falls back to `document.execCommand('copy')` for older browsers
- **Fetch API**: Required for API calls (polyfill available for IE11 if needed)

## License

Part of the AnomFIN website package.

## Support

For issues or questions:
- Email: info@anomfin.fi
- GitHub: [AnomFIN/anomfin-website](https://github.com/AnomFIN/anomfin-website)

---

**Last Updated:** 2025-10-20
**Version:** 1.0.0
