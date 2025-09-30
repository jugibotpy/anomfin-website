#!/bin/bash

# AnomFIN Website Final Package Creator
# Creates final.zip with all necessary files for installation

echo "📦 Creating final.zip package for AnomFIN Website"
echo "=================================================="

# Create a temporary directory for packaging
TEMP_DIR="/tmp/anomfin_final"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "🔧 Copying website files..."

# Copy main website files
cp index.html "$TEMP_DIR/"
cp -r css "$TEMP_DIR/"
cp -r js "$TEMP_DIR/"
cp -r assets "$TEMP_DIR/"

echo "📝 Creating installation documentation..."

# Create comprehensive INSTALL.md
cat > "$TEMP_DIR/INSTALL.md" << 'EOL'
# AnomFIN Website - Installation Guide

## Package Contents

This package includes:
- `index.html` - Main website HTML file
- `css/` - Stylesheets directory
  - `style.css` - Main stylesheet with all visual effects
- `js/` - JavaScript directory
  - `script.js` - Main JavaScript with animations and interactions
- `assets/` - Images and resources
  - `logo.png` - Company logo (used for cyclops mask effect)
  - `logo.svg` - SVG version of logo
  - `image2vector.svg` - Navigation logo

## System Requirements

- Web server capable of serving static HTML files (Apache, Nginx, or any HTTP server)
- Modern web browser (Chrome, Firefox, Safari, Edge - latest versions)
- No database or backend required for basic functionality
- Optional: Email backend for contact form integration

## Installation Steps

### Option 1: Simple Extraction (Recommended)

1. Extract all files from final.zip to your web server's document root
   ```bash
   unzip final.zip -d /var/www/html/
   ```

2. Ensure proper file permissions
   ```bash
   chmod -R 755 /var/www/html/
   ```

3. Access your website via web browser
   - Local: http://localhost/
   - Production: https://yourdomain.com/

### Option 2: Development Server

For testing locally:

1. Extract files to a directory
2. Start a local server:
   ```bash
   # Python 3
   python3 -m http.server 8080
   
   # Node.js
   npx http-server -p 8080
   
   # PHP
   php -S localhost:8080
   ```
3. Open http://localhost:8080 in your browser

## Features Included

### Interactive Animations
- **Left-edge floating green box**: Smoothly floats along the left edge with cyclops eye transparency effect using logo.png mask
- **Matrix digital rain**: Animated matrix effect on the right floating grid with scroll synchronization
- **Intro animation**: Logo animation sequence on page load
- **Scroll companion**: Interactive floating grid that follows scroll position
- **Parallax effects**: Smooth parallax scrolling throughout the page

### Responsive Design
- Mobile-first approach
- Breakpoints for tablets and desktops
- Touch-optimized navigation

### Performance Optimizations
- Reduced motion support for accessibility
- Hardware-accelerated animations
- Lazy loading for animations
- Efficient memory management

## Customization

### Update Content
Edit `index.html` to change:
- Company name and contact information
- Service descriptions
- Pricing information
- Links and navigation items

### Modify Styling
Edit `css/style.css` to customize:
- Colors (search for color values like `#00ffa6`, `#00d4ff`)
- Font sizes and families
- Layout spacing
- Animation speeds

### Adjust Animations
Edit `js/script.js` to configure:
- Animation timing and speeds
- Matrix effect characters and density
- Floating box movement patterns
- Scroll synchronization behavior

## Configuration Variables

In `js/script.js`, you can adjust these parameters:

### Left-edge Box Animation
```javascript
const noiseX = noise(time) * 25;  // X movement amplitude (default: 25)
const noiseY = noise(time + 100) * 40;  // Y movement amplitude (default: 40)
const slowWave = Math.sin(time * 0.5) * 15;  // Slow wave amplitude (default: 15)
```

### Matrix Animation
```javascript
const fontSize = 12;  // Matrix character size
const chars = 'ANOMFIN010110100101CYBERSEC01101HYPERFLUX010101';  // Characters used
setInterval(drawMatrix, 50);  // Animation frame rate (50ms = ~20fps)
```

## Contact Form Setup (Optional)

The contact form is ready for backend integration:

1. Choose an email service (e.g., SendGrid, Mailgun, AWS SES)
2. Create an API endpoint to handle form submissions
3. Update the form action in `index.html` or handle with JavaScript in `script.js`
4. Add proper validation and spam protection

Example with FormSpree:
```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST" class="contact-form">
```

## Troubleshooting

### Animations not working
- Ensure JavaScript is enabled in the browser
- Check browser console for errors (F12 → Console)
- Verify all files are properly uploaded

### Layout issues
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- Check that CSS file path is correct
- Verify web server is serving CSS files with correct MIME type

### Images not loading
- Verify assets directory is properly uploaded
- Check file permissions (should be readable)
- Ensure paths are relative (no absolute paths)

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Tips

1. Enable gzip compression on your web server
2. Set appropriate cache headers for static assets
3. Use a CDN for faster global delivery
4. Consider enabling HTTP/2

## Security Recommendations

1. Serve site over HTTPS
2. Set appropriate security headers
3. Keep contact form protected from spam
4. Regular backups of website files

## Support

For questions or issues:
- Email: info@anomfin.fi
- SOC Support: soc@anomfin.fi
- Phone: +358 40 123 4567

## Credits

© 2025 AnomFIN - Built with AnomTools Team
All rights reserved.

---

Generated: $(date)
Package version: final.zip
EOL

# Create README for the package
cat > "$TEMP_DIR/README.txt" << 'EOL'
========================================
  AnomFIN Website - Final Package
========================================

Thank you for choosing AnomFIN!

This package contains everything you need to deploy the AnomFIN website.

QUICK START:
1. Extract all files to your web server directory
2. Read INSTALL.md for detailed instructions
3. Access your website via browser

For support, contact: info@anomfin.fi

Visit us at: https://anomfin.fi

© 2025 AnomFIN - Cybersecurity & Application Development
EOL

# Get the current directory
CURRENT_DIR=$(pwd)

# Create the final.zip package in the root directory
echo "📦 Creating final.zip..."
cd "$TEMP_DIR"
zip -r "$CURRENT_DIR/final.zip" . -x "*.DS_Store" "*.git*" "__MACOSX/*"

echo ""
echo "✅ Package created successfully!"
echo "📦 Package location: $CURRENT_DIR/final.zip"
echo ""
echo "📊 Package contents:"
unzip -l "$CURRENT_DIR/final.zip"

# Calculate package size
PACKAGE_SIZE=$(du -h "$CURRENT_DIR/final.zip" | cut -f1)
echo ""
echo "📏 Package size: $PACKAGE_SIZE"

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "🚀 final.zip is ready for deployment!"
echo "   Share this file with your deployment team or upload to your server."
