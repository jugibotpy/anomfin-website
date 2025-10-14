# AnomFIN Website - Copilot Instructions

## Repository Overview

This is the **AnomFIN website** - a professional, futuristic hacker-themed website for the Anom ecosystem (AnomFIN, AnomTools, AnomApps). The site showcases cybersecurity and application development services with a modern, neon-aesthetic design.

**Project Type**: Static website with optional PHP backend features
**Deployment**: GitHub Pages (static hosting)
**Primary Language**: Finnish (fi)

## Technology Stack

### Frontend
- **HTML5**: Semantic markup with ARIA accessibility features
- **CSS3**: Modern CSS with custom properties, animations, and responsive design
- **JavaScript (ES6+)**: Vanilla JavaScript, no frameworks
  - DOM manipulation and event handling
  - Async/await for API calls
  - Dynamic content rendering
  - Intersection Observer API for scroll effects

### Backend (Optional)
- **PHP 7.4+**: Server-side processing
- **MySQL 5.7+ / MariaDB 10.2+**: Database storage
- **PDO**: Database abstraction layer

### External Services
- **Google Fonts**: Inter font family
- **GitHub API**: Repository information fetching
- **OpenAI API**: Chat functionality (optional)

## Project Structure

```
anomfin-website/
├── index.html              # Main landing page
├── AnomCounter.html        # Counter/timer page
├── luvut.html             # Password-protected numbers page
├── bolt.html              # Additional page
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   └── script.js          # Main JavaScript functionality
├── assets/                # Images and media
│   ├── logo.png
│   ├── logotp.png
│   └── logo.svg
├── api/                   # Backend API endpoints
│   ├── settings.php
│   └── chat.php
├── config/                # Configuration files
│   ├── admin.config.php
│   └── settings-defaults.php
├── data/                  # Data storage
│   ├── settings.json
│   └── luvut-taulukot.json
├── dialer/               # Dialer functionality
│   ├── README.md
│   ├── numbers.json
│   └── dnc.json
├── asetukset.php         # Admin settings page
├── install.php           # One-time installation script
└── .github/
    ├── workflows/
    │   └── static.yml    # GitHub Pages deployment
    └── copilot-instructions.md
```

## Design Philosophy

**Visual Identity**: Professional, cinematic, futuristic
**Aesthetic**: Dark neon theme (Tesla × Anonymous × Apple)
**Color Scheme**: 
- Neon cyan/teal: `rgba(0, 255, 225, ...)`
- Purple: `rgba(156, 77, 255, ...)`
- Pink/magenta: `rgba(255, 77, 148, ...)`
- Orange accents: `rgba(255, 140, 74, ...)`

**Key Visual Elements**:
- Glass morphism and blur effects
- Dynamic glows and halos
- Matrix-style code animations
- Particle effects
- Smooth transitions and animations

## Code Style Guidelines

### HTML
- Use semantic HTML5 elements (`<nav>`, `<section>`, `<article>`, etc.)
- Include ARIA attributes for accessibility
- Add `alt` text for all images
- Use descriptive `id` and `class` names in English or Finnish consistently
- Include meta tags for SEO and social sharing
- Maintain proper indentation (4 spaces)

### CSS
- Use CSS custom properties (CSS variables) for theming
- Mobile-first responsive design approach
- Use `clamp()` for fluid typography
- Organize styles logically:
  1. CSS variables
  2. Reset/base styles
  3. Layout
  4. Components
  5. Utilities
  6. Responsive breakpoints
- Comment complex animations and effects
- Prefer `rem` and `em` units for scalability

### JavaScript
- Use modern ES6+ syntax
- Prefer `const` and `let` over `var`
- Use arrow functions where appropriate
- Use async/await for asynchronous operations
- Add comments for complex logic
- Handle errors gracefully with try/catch
- Use meaningful variable and function names
- Organize code into logical sections with comments

### PHP
- Use prepared statements (PDO) for database queries
- Validate and sanitize all user inputs
- Use proper error handling
- Follow PSR coding standards where possible
- Separate configuration from logic

## Development Workflow

### Making Changes
1. **Content**: Edit `index.html` or relevant HTML files
2. **Styling**: Modify `css/style.css`
3. **Functionality**: Update `js/script.js`
4. **Images**: Replace files in `assets/` directory
5. **Settings**: Use `asetukset.php` admin panel or edit `data/settings.json`

### Testing
- Test across modern browsers (Chrome, Firefox, Safari, Edge)
- Verify mobile responsiveness (viewport meta tag required)
- Check accessibility with screen readers
- Validate HTML and CSS
- Test with JavaScript disabled for graceful degradation
- Verify HTTPS/GitHub Pages deployment

### Deployment
- **Automatic**: Push to `main` branch triggers GitHub Actions workflow
- **Manual**: Use `workflow_dispatch` in GitHub Actions
- **Files**: All repository files deploy to GitHub Pages
- **URL**: `https://[username].github.io/anomfin-website/`

## Key Features to Maintain

### 1. Intro Animation
- Logo animation on page load
- Configurable timing via settings
- Accessibility: `aria-hidden="true"` on decorative elements

### 2. Navigation
- Responsive mobile menu
- Smooth scrolling to sections
- Active section highlighting
- Logo halo/glow effects

### 3. Scroll Effects
- Intersection Observer for reveal animations
- Scroll companion with contextual messages
- Parallax and transform effects

### 4. Applications Section
- Dynamic portfolio gallery
- GitHub API integration for repository data
- Filtering and display of projects
- External link handling

### 5. Contact Form
- Form validation
- Async submission
- Success/error feedback
- Optional database storage

### 6. Password Protection (luvut.html)
- Client-side password verification
- Maximum attempt limiting
- ID transformation logic
- Finnish language support

## Security Considerations

### Client-Side
- Validate all user inputs
- Sanitize data before display to prevent XSS
- Use HTTPS for all external resources
- Implement Content Security Policy headers where possible

### Server-Side (PHP)
- Use prepared statements for all database queries
- Validate and sanitize inputs server-side
- Implement rate limiting for sensitive endpoints
- Store credentials securely (not in code)
- Use environment variables for sensitive configuration
- Delete `install.php` after installation

### API Keys
- Never commit API keys to repository
- Use environment variables or secure configuration
- Rotate keys regularly
- Limit API key permissions

## Performance Optimization

- **Images**: Use appropriate formats (WebP where supported)
- **Loading**: Implement lazy loading for images
- **Fonts**: Use `preconnect` and `font-display: swap`
- **CSS**: Minimize and optimize
- **JavaScript**: Defer non-critical scripts
- **Caching**: Leverage browser caching with proper headers

## Accessibility Guidelines

- Maintain semantic HTML structure
- Include ARIA labels and roles
- Provide skip links for keyboard navigation
- Ensure sufficient color contrast
- Support keyboard navigation
- Test with screen readers
- Provide alternative text for images
- Use proper heading hierarchy

## Finnish Language Support

- All user-facing content in Finnish
- Support for Finnish characters (Å, Ä, Ö)
- Use `lang="fi"` attribute in HTML
- Consider localization for error messages
- Date and number formatting in Finnish style

## Common Tasks

### Adding a New Section
1. Add HTML structure in `index.html`
2. Add navigation link in `.nav-menu`
3. Style in `css/style.css`
4. Add scroll reveal initialization if needed
5. Test responsiveness

### Adding a New Portfolio Item
1. Update `PORTFOLIO_BASE` array in `js/script.js`
2. Include: title, category, status, summary, stats, tags, link
3. Optionally specify `repo` for GitHub integration

### Modifying Color Scheme
1. Update CSS custom properties in `css/style.css`
2. Search for color values in animations
3. Update logo/image assets if needed
4. Test contrast and accessibility

### Updating Settings
1. Use admin panel at `asetukset.php`
2. Or directly edit `data/settings.json`
3. Or modify defaults in `config/settings-defaults.php`

## Best Practices for AI Coding Agents

### When Working on This Repository:
- **Preserve the visual aesthetic**: Maintain the dark neon hacker theme
- **Keep it responsive**: Test changes on mobile viewports
- **Maintain accessibility**: Don't remove ARIA attributes or alt text
- **Use existing patterns**: Follow established code structure and naming
- **Test thoroughly**: Changes should work across browsers
- **Document changes**: Add comments for complex logic
- **Security first**: Never expose sensitive data or create vulnerabilities
- **Minimize dependencies**: Prefer vanilla JavaScript over libraries
- **Finnish language**: Keep all user-facing text in Finnish

### Task Prioritization:
1. Security vulnerabilities: Fix immediately
2. Broken functionality: High priority
3. Accessibility issues: High priority
4. Visual/UX improvements: Medium priority
5. Code refactoring: Low priority (only if improves maintainability)

### Code Review Checklist:
- [ ] Does it maintain the visual aesthetic?
- [ ] Is it responsive (mobile, tablet, desktop)?
- [ ] Are accessibility features preserved?
- [ ] Is it secure (no XSS, SQL injection, etc.)?
- [ ] Does it follow the existing code style?
- [ ] Is it properly commented?
- [ ] Does it work without JavaScript (where appropriate)?
- [ ] Are Finnish language strings preserved?
- [ ] Does it perform well?

## References

- **Repository**: https://github.com/AnomFIN/anomfin-website
- **Website**: https://anomfin.fi
- **Documentation**: See README.md for deployment instructions
- **GitHub Pages**: Automatic deployment via Actions

## Notes

- This is a production website package (clean release)
- Development files and tests are not included in this repository
- The site is designed to work as static HTML or with PHP backend
- Database features are optional and require proper setup
- Always test changes locally before committing to main branch

---

**Last Updated**: 2025-10-14
**Maintained by**: AnomFIN Team
