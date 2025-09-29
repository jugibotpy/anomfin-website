# Animation Features Documentation

## Matrix Logo-Rectangle Interaction

### Overview
The website features an interactive animation system where the navigation logo can trigger a matrix-style animation effect when it intersects with the hero section's green rectangle.

### How It Works

#### 1. Intersection Detection
- The system continuously monitors the position of the navigation logo (`.nav-logo img`) and the hero grid rectangle (`.hero-grid`)
- Uses `requestAnimationFrame` for smooth, performance-optimized collision detection
- Detects when the bounding rectangles of these elements overlap

#### 2. Visual Activation
When intersection is detected:
- The green rectangle gets the `.rectangle-activated` class
- Applies visual effects: enhanced glow, border color change, scaling, and brightness increase
- Animation duration: 0.6s with smooth easing

#### 3. Matrix Animation
After a 300ms delay:
- Launches a spectacular matrix-tracking animation from the rectangle's center
- Creates 20 particle streams radiating outward in all directions
- Each stream has 8 trailing particles with varying opacity
- Particles have randomized speeds (2-5 seconds) and lengths (150-450px)
- Uses hardware-accelerated CSS animations with `will-change` properties

### Technical Implementation

#### CSS Classes
- `.rectangle-activated`: Visual activation state for the green rectangle
- `.matrix-animation-container`: Full-screen container for the matrix effect
- `.matrix-stream`: Individual particle stream elements
- `.matrix-particle`: Trailing particle elements

#### JavaScript Functions
- `initLogoRectangleInteraction()`: Sets up intersection detection
- `activateRectangle()`: Triggers the activation sequence
- `launchMatrixAnimation(element)`: Creates the matrix particle effect
- `createMatrixStream(x, y, index)`: Generates individual particle streams

#### Performance Optimizations
- Uses `requestAnimationFrame` for smooth animation loops
- Hardware acceleration with `transform` and `opacity` animations
- Automatic cleanup after 4 seconds to prevent memory leaks
- Prevents multiple simultaneous animations with `matrixAnimationActive` flag

### Customization

#### CSS Variables
The animation can be customized via CSS custom properties:
```css
:root {
    --trail-dx: 200px;    /* Stream travel distance X */
    --trail-dy: 200px;    /* Stream travel distance Y */
    --particle-dx: 160px; /* Particle travel distance X */
    --particle-dy: 160px; /* Particle travel distance Y */
}
```

#### Animation Timing
- Matrix stream count: 20 (configurable in `launchMatrixAnimation`)
- Particle count per stream: 8 (configurable in `createMatrixStream`)
- Animation delays: 50ms between streams, 25ms between particles
- Total duration: 4 seconds

## GitHub Applications Section

### Overview
Dynamically displays GitHub repositories from the AnomFIN organization with elegant cards and fallback data support.

### Features

#### Repository Display
- Shows 5 featured repositories with descriptions, technologies, and GitHub links
- Responsive grid layout that adapts to different screen sizes
- Language-based icons for visual identification
- Technology tags with project topics

#### Data Sources
1. **Primary**: GitHub REST API (`https://api.github.com/repos/{owner}/{repo}`)
2. **Fallback**: Static data for offline/blocked scenarios

#### Repositories Included
- `AnomFIN/anomfin-website`: Company website
- `AnomFIN/hrk`: Human Resource Kit
- `AnomFIN/jugitube`: Video platform
- `AnomFIN/iPeili`: Smart mirror IoT application
- `AnomFIN/lexai`: AI legal text analysis tool

### Technical Implementation

#### JavaScript Functions
- `initApplicationsSection()`: Initializes the applications display
- `fetchGitHubRepos()`: Attempts to fetch live data from GitHub API
- `displayApplications(repos)`: Renders repository cards
- `createApplicationCard(repo)`: Generates individual card HTML
- `getRepoIcon(language)`: Returns emoji icons for programming languages

#### Styling
- Glass-morphism design with backdrop blur effects
- Hover animations with elevation and glow effects
- Responsive grid with automatic column sizing
- Color-coded technology tags
- Loading spinner and error state handling

#### Error Handling
- Graceful degradation when GitHub API is unavailable
- Automatic fallback to curated static data
- User-friendly loading states and error messages
- Console warnings for debugging API issues

### Integration Notes

#### Navigation
- Added "Sovellukset" (Applications) link to main navigation
- Integrated with scroll companion system
- Added to section titles and navigation mappings

#### Accessibility
- Proper ARIA labels and semantic HTML structure
- Keyboard navigation support
- Screen reader friendly descriptions
- Focus management for interactive elements

#### Performance
- Lazy loading approach with fallback data
- Minimal DOM manipulation
- CSS-only hover effects where possible
- Efficient memory cleanup

This implementation provides a robust, interactive experience that showcases both technical capabilities and project portfolio while maintaining excellent performance and accessibility standards.