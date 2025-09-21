# AnomFIN - Cybersecurity Website

A professional website for AnomFIN, a cutting-edge cybersecurity company providing comprehensive digital security solutions.

## Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with cybersecurity theme
- **Interactive Elements**: Smooth scrolling navigation, animated components
- **Contact Form**: Functional contact form with validation and notifications
- **Professional Sections**: Hero, Services, About, and Contact sections
- **Easy Deployment**: Simple static files ready for any web server

## Quick Start

1. **View the website**: Open `index.html` in your web browser
2. **Deploy**: Upload all files to your web server
3. **Package**: Run `./package.sh` to create a deployment zip file

## File Structure

```
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Main stylesheet
├── js/
│   └── script.js      # Interactive functionality
├── assets/            # Images and other assets (empty initially)
├── package.sh         # Packaging script for deployment
└── README.md          # This file
```

## Deployment

### Option 1: Simple Upload
1. Upload all files to your web server's public directory
2. Ensure your server can serve static HTML files
3. Access via your domain

### Option 2: Using Package Script
1. Run `./package.sh` to create a deployment package
2. Extract the generated zip file to your web server
3. Follow the included deployment instructions

## Customization

- **Content**: Edit `index.html` to update text, contact information, and services
- **Styling**: Modify `css/style.css` to change colors, fonts, and layout
- **Images**: Add company logos and images to the `assets/` directory
- **Functionality**: Extend `js/script.js` for additional interactive features

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Contact Form

The contact form includes client-side validation and provides user feedback. For production use, you'll need to integrate with a backend service to handle form submissions.

## License

© 2024 AnomFIN. All rights reserved.
