# Link Shortener Feature - AnomFIN

## Overview

The link shortener feature allows users to create short, memorable URLs that redirect to longer target URLs. This feature is built into the AnomFIN website and includes:

- **Frontend Form**: User-friendly form in the hero section of the homepage
- **API Endpoint**: RESTful API for creating short links via `tausta.php`
- **Redirect Handler**: Integrated into `index.php` with query parameter `?s={code}`
- **Database Storage**: Persistent storage in `short_links` table
- **JSON Fallback**: File-based storage in `data/short-links.json` if database is unavailable
- **Settings**: Configurable via admin panel in `asetukset.php`

## Architecture

The link shortener is integrated into the existing AnomFIN infrastructure:

### Core Files

1. **`index.php`** - Main entry point and redirect handler
   - Handles short link resolution via `?s={code}` query parameter
   - Calls `anomfin_resolve_short_link()` to lookup URLs
   - Shows 404 page for invalid codes
   - Serves `index.html` for normal requests

2. **`tausta.php`** - API endpoint for creating short links
   - POST endpoint accepting JSON `{url, alias?, maxLength?}`
   - Validates URL format and custom aliases
   - Generates random codes if no alias provided
   - Returns `{success, code, shortUrl}`
   - Creates `short_links` table automatically

3. **`lib/shortener.php`** - Helper functions
   - `anomfin_generate_unique_code()` - Generate random codes
   - `anomfin_code_exists()` - Check if code exists in database
   - `anomfin_load_link_store()` / `anomfin_save_link_store()` - JSON file storage
   - `anomfin_build_short_url()` - Build full short URL
   - Utility functions for purging expired links

4. **`index.html`** - Frontend with shortener form
   - Form already exists in hero section
   - Styled with existing CSS in `css/style.css`
   - JavaScript in `js/script.js` handles form submission

5. **`asetukset.php`** - Admin panel
   - Configure shortener settings
   - Set base URL, auto-purge days, enforce HTTPS, UTM campaigns
   - View statistics

## Database Schema

### `short_links` Table

The table is automatically created by `tausta.php` on first use:

```sql
CREATE TABLE IF NOT EXISTS short_links (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(16) NOT NULL,
    target_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_code (code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields:**
- `id`: Primary key, auto-increment
- `code`: Short code (1-16 characters), unique
- `target_url`: Target URL (TEXT field, no size limit)
- `created_at`: Timestamp when link was created

**Note:** Hit tracking is not implemented in the database. Future versions may add this feature.

## Installation

The link shortener is already integrated into the AnomFIN website. No additional installation is needed!

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7+ or MariaDB 10.2+ (optional - falls back to JSON storage)
- Database connection configured in `config.php` (if using database)

### Setup Steps

1. **Deploy the website files** to your web server

2. **Configure database connection** in `config.php`
   - The system uses the existing `anomfin_get_pdo()` function
   - If database is unavailable, falls back to JSON file storage

3. **Configure shortener settings** (optional)
   - Login to admin panel at `/asetukset.php`
   - Navigate to "Lyhytlinkit" (Short Links) section
   - Configure:
     - Base URL (default: `https://anomfin.fi/?s=`)
     - Auto-purge days (delete old links automatically)
     - Enforce HTTPS (require HTTPS URLs)
     - UTM campaign (add tracking parameters)

4. **Test the feature**
   - Visit your homepage
   - Use the link shortener form in the hero section
   - Create a short link and test it

### Table Creation

The `short_links` table is automatically created by `tausta.php` on first API call. No manual database setup is required!

## Usage

### Creating a Short Link

**Via Web Interface:**
1. Navigate to homepage: `https://anomfin.fi`
2. Find the "Link Shortener" form in the hero section
3. Enter the long URL (must be a valid URL)
4. Optionally enter a custom alias (alphanumeric characters)
5. Click "Luo lyhyt linkki" (Create short link)
6. Copy the generated short URL

**Via API:**
```bash
curl -X POST https://anomfin.fi/tausta.php \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very/long/url",
    "alias": "demo",
    "maxLength": 4
  }'
```

**Response:**
```json
{
  "success": true,
  "code": "demo",
  "shortUrl": "https://anomfin.fi/?s=demo"
}
```

**Request Parameters:**
- `url` (required): Target URL to shorten
- `alias` (optional): Custom code/alias (alphanumeric only)
- `maxLength` (optional): Maximum code length (1-12, default: 4)

### Using a Short Link

Simply visit: `https://anomfin.fi/?s={code}`

Example: `https://anomfin.fi/?s=demo`

The system will:
1. Look up the code in the database (or JSON file if DB unavailable)
2. Redirect to the target URL (302 temporary redirect by default)
3. Show a 404 page if the code doesn't exist

## API Reference

### POST /tausta.php

Create a new short link.

**Request:**
```json
{
  "url": "https://example.com/long-url",
  "alias": "demo",
  "maxLength": 4
}
```

**Request Fields:**
- `url` (required): Target URL, must be valid URL
- `alias` (optional): Custom short code, alphanumeric characters only
- `maxLength` (optional): Maximum code length (1-12, default: 4)

**Success Response (200):**
```json
{
  "success": true,
  "code": "demo",
  "shortUrl": "https://anomfin.fi/?s=demo"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message in Finnish"
}
```

**Common Errors:**
- `405`: Method not allowed (use POST)
- `400`: Invalid JSON
- `422`: Invalid URL or alias validation error
- `409`: Alias already in use

## Security

### Built-in Security Features

The shortener includes several security measures:

1. **Input Validation**
   - URL validation with `filter_var(FILTER_VALIDATE_URL)`
   - Alias sanitization with `preg_replace('/[^A-Za-z0-9]/', '', $alias)`
   - Length limits on codes (max 16 characters in database)

2. **SQL Injection Prevention**
   - All queries use PDO prepared statements
   - Named parameters (`:code`, `:url`)
   - No direct SQL string concatenation

3. **XSS Prevention**
   - Output sanitized with `htmlspecialchars()` in redirect pages
   - JSON encoding for API responses

4. **Database**
   - Unique constraint on `code` column prevents duplicates
   - Uses InnoDB engine with proper collation
   - Automatic table creation with safe schema

### Best Practices

1. **Enable HTTPS enforcement** in admin settings
2. **Set auto-purge days** to automatically delete old links
3. **Monitor the database** for suspicious or spam URLs
4. **Regular backups** of `short_links` table and `data/short-links.json`
5. **Rate limiting** - Consider adding at web server level (e.g., nginx limit_req)

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

### Short Link Returns 404

**Problem:** Short links show "Lyhytlinkkiä ei löytynyt" (Link not found)

**Solutions:**
1. Verify the code exists in the database:
   ```sql
   SELECT * FROM short_links WHERE code='xyz';
   ```
2. Check JSON fallback file: `data/short-links.json`
3. Verify the URL format is correct: `https://anomfin.fi/?s=code`
4. Codes are case-insensitive (automatically converted to lowercase)

### Database Connection Issues

**Problem:** Links don't persist after creation

**Solutions:**
1. Check `config.php` has correct database credentials
2. Verify the `anomfin_get_pdo()` function works
3. The system will automatically fall back to JSON storage if database is unavailable
4. Check `data/short-links.json` for fallback storage

### Alias Already in Use

**Problem:** Custom alias returns 409 error

**Solutions:**
1. Choose a different alias
2. Omit the `alias` parameter to get an auto-generated code

### API Returns Error

**Problem:** Form submission fails or returns error

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify `tausta.php` is accessible
3. Check PHP error logs for detailed error messages
4. Ensure JSON payload is valid

## Configuration

The shortener can be configured via the admin panel at `/asetukset.php`:

### Available Settings

1. **Base URL** (`shortener.baseUrl`)
   - Default: `https://anomfin.fi/?s=`
   - Format: Must end with `=` or `/`
   - Example: `https://anomfin.fi/?s=` or `https://short.domain.fi/`

2. **Auto-Purge Days** (`shortener.autoPurgeDays`)
   - Default: `0` (disabled)
   - Automatically delete links older than N days
   - Applies to both database and JSON storage

3. **Enforce HTTPS** (`shortener.enforceHttps`)
   - Default: `false`
   - When enabled, only HTTPS URLs are allowed

4. **UTM Campaign** (`shortener.utmCampaign`)
   - Default: empty
   - Automatically adds `utm_campaign` parameter to shortened URLs
   - Example: Set to `anomfin` to track all short link traffic

5. **Redirect Status** (`shortener.redirectStatus`)
   - Default: `302` (Temporary)
   - Options: `301`, `302`, `307`, `308`
   - Controls HTTP redirect status code

## Analytics

### View Link Statistics

Query the database for basic statistics:

```sql
-- All links
SELECT code, target_url, created_at 
FROM short_links 
ORDER BY created_at DESC;

-- Recent links
SELECT code, target_url, created_at 
FROM short_links 
ORDER BY created_at DESC 
LIMIT 20;

-- Total link count
SELECT COUNT(*) as total_links
FROM short_links;

-- Links by date
SELECT DATE(created_at) as date, COUNT(*) as count
FROM short_links 
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Note:** Hit tracking is not currently implemented. View counts would need to be added in a future version.

### Admin Panel Statistics

The admin panel (`asetukset.php`) shows:
- Total number of short links
- Database schema information
- Settings configuration

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
