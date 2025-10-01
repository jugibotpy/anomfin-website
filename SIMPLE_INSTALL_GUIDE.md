# Simple Installation Guide for AnomFIN

## Super Simple 3-Step Installation

### 1️⃣ Unzip to Your Computer
Extract `final.zip` to any folder on your PC

### 2️⃣ Upload to Web Hosting
Upload all extracted files to your web hotel/hosting via FTP or file manager

### 3️⃣ Run install.php in Browser
Open: `http://your-domain.com/install.php`

Fill in:
- **Database name** (from your hosting provider)
- **Database username** (from your hosting provider) 
- **Database password** (from your hosting provider)
- **AI API key** (optional - can add later)

Click **"Asenna nyt"** (Install Now)

✅ **Done! Your site is ready.**

---

## What Happens During Installation?

The `install.php` runs **ONLY ONCE** and:

1. ✅ Auto-detects existing database connection files in the same folder
   - Looks for: `connect.php`, `connection.php`, `database.php`, etc.
   - Pre-fills form if found

2. ✅ Tests your database connection

3. ✅ Creates `.env` configuration file securely (600 permissions)

4. ✅ Creates `admin.php` page for:
   - AI control
   - Index page settings
   - System management

5. ✅ Locks itself after installation (can't run twice)

---

## After Installation

### Access Admin Panel
`http://your-domain.com/admin.php`

Default password: `admin123` (CHANGE THIS!)

From admin panel you can:
- Manage AI service
- View system settings
- Control website features

### Access Your Website
`http://your-domain.com/index.html`

### Remove install.php (Optional, for security)
After installation is complete, you can delete `install.php` from your hosting.

---

## Troubleshooting

### "Database connection failed"
- Check database name is correct
- Check username and password
- Verify database exists on your hosting

### "Cannot write .env file"
- Check folder has write permissions (755)
- Contact hosting support

### "install.php won't run again"
- This is normal - it runs only once
- If you need to reinstall, delete the `.env` file first

---

## What You Get

📄 **Static Website** (works immediately)
- Beautiful responsive design
- All animations and effects
- No setup needed for basic site

🔧 **PHP Backend** (after install.php)
- Database integration
- AI service connection
- Admin control panel
- Secure configuration

---

## Support

Need help? Contact:
- Email: info@anomfin.fi
- Website: https://anomfin.fi

---

© 2025 AnomFIN - Making installation super simple!
