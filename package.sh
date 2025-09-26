#!/bin/bash

# AnomFIN Website Packaging Script
# This script creates a zip package of the website files

echo "📦 AnomFIN Website Packaging Script"
echo "=================================="

# Set variables
WEBSITE_NAME="anomfin-website"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PACKAGE_NAME="${WEBSITE_NAME}_${TIMESTAMP}.zip"

# Create a temporary directory for packaging
TEMP_DIR="/tmp/anomfin_package"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "🔧 Preparing files for packaging..."

# Copy website files to temp directory
cp -r css "$TEMP_DIR/"
cp -r js "$TEMP_DIR/"
cp -r assets "$TEMP_DIR/" 2>/dev/null || echo "📁 No assets directory found, skipping..."
cp index.html "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"

# Create deployment instructions
cat > "$TEMP_DIR/DEPLOYMENT.md" << EOL
# AnomFIN Website Deployment Instructions

## Files Included
- \`index.html\` - Main website file
- \`css/style.css\` - Stylesheet
- \`js/script.js\` - JavaScript functionality
- \`assets/\` - Images and other assets (if any)

## Deployment Steps
1. Extract all files to your web server directory
2. Ensure your web server is configured to serve static files
3. The website should be accessible via your domain

## Requirements
- Web server capable of serving static HTML files
- Modern web browser for optimal viewing

## Features
- Responsive design for mobile and desktop
- Smooth scrolling navigation
- Contact form (requires backend integration for email sending)
- Professional cybersecurity company theme

## Customization
- Edit \`index.html\` to update content
- Modify \`css/style.css\` to change styling
- Update contact information in the contact section
- Add your company logo to the assets directory

Generated on: $(date)
EOL

echo "📋 Creating deployment instructions..."

# Get the current directory
CURRENT_DIR=$(pwd)

# Create dist directory if it doesn't exist
mkdir -p "$CURRENT_DIR/dist"

# Create the zip package
cd "$TEMP_DIR"
zip -r "$CURRENT_DIR/dist/$PACKAGE_NAME" . -x "*.DS_Store" "*.git*" "node_modules/*" "*.log"

echo "✅ Package created successfully!"
echo "📦 Package location: $CURRENT_DIR/dist/$PACKAGE_NAME"
echo "📊 Package contents:"
unzip -l "$CURRENT_DIR/dist/$PACKAGE_NAME"

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "🚀 Your AnomFIN website is ready for deployment!"
echo "   Extract the zip file to your web server to go live."