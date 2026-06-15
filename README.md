# Portfolio Barbershop Website

A polished, single-page barbershop website built to demonstrate modern front-end development skills. This project is part of my portfolio and serves as a tangible example of the quality I bring to every project.

## Purpose

This site was created specifically as a **skill showcase piece** — not a commercial product. It demonstrates proficiency in:

- **HTML5 semantics** — clean, accessible markup with proper heading hierarchy, ARIA attributes, and keyboard support
- **CSS architecture** — custom properties (CSS variables), flexbox/grid layouts, responsive design breakpoints, and animation keyframes
- **JavaScript fundamentals** — DOM manipulation, event handling, intersection observers for scroll animations, and localStorage data persistence
- **UI/UX craft** — hover states, micro-interactions, form validation, modal transitions, and color system consistency

## Features

### Visual Design
- Cohesive dark/gold color palette with custom CSS variable tokens
- Responsive grid layouts that adapt from mobile to desktop
- Smooth scroll-triggered animations via Intersection Observer API
- Hover effects on cards, buttons, gallery items, and calendar days

### Interactive Components
- **Booking calendar** — month navigation, day selection, time slot generation
- **Appointment system** — full booking flow with localStorage persistence across page reloads
- **Conflict detection** — prevents double-booking time slots; shows "Booked" (red) indicators for occupied times and "FULL" badges on sold-out days
- **Smart availability** — amber warning tint for days with limited slots remaining
- **Gallery** — 6-card image grid with hover overlays and lazy loading

### Form Handling
- Three-step booking modal: time selection → customer info → confirmation
- Client-side validation with required fields and proper input types
- Confirmation screen with animated detail summary

## Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 (semantic elements) |
| Style | CSS3 (custom properties, flexbox, grid, animations) |
| Logic | Vanilla JavaScript (ES6+, no frameworks or dependencies) |
| Storage | localStorage for appointment data |

## Project Structure

```
website/
├── index.html     # Single-page HTML structure with all sections
├── styles.css     # Complete stylesheet (~140 lines of CSS variables, animations, responsive rules)
├── script.js      # Calendar logic, booking modal, localStorage persistence, scroll animations
├── assets/        # Gallery images (6 photos)
└── README.md      # This file
```

## Sections

1. **Hero** — Full-viewport intro with SVG barbershop illustration, gradient overlay, and call-to-action buttons
2. **About / Our Story** — Company history and feature highlights
3. **Services** — Six service cards with pricing and inline SVG icons
4. **Gallery** — Grid of 6 photos from the shop
5. **Book Your Visit** — Interactive calendar widget with booking modal
6. **Testimonials** — Customer review cards
7. **Footer** — Contact info, business hours, and social links

## How to Run

No build tools, servers, or dependencies required:

```bash
# Open the site directly in any browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or drag `index.html` into your browser window. The site is entirely client-side.

## What This Demonstrates

Beyond writing correct HTML, CSS, and JS, this project shows I understand:

- **User flow** — booking an appointment takes 3 clicks from the hero button to confirmation
- **Edge cases** — past dates can't be selected, Sundays are closed, double-bookings are prevented, localStorage survives refreshes
- **Accessibility** — keyboard-navigable modal (Escape to close), focus states on form inputs, semantic landmarks
- **Performance** — zero external dependencies, inline SVG illustrations, no network requests beyond fonts
- **Maintenance** — well-organized CSS with named sections, consistent class naming conventions, and commented code blocks

## License

This project is built as a portfolio showcase piece. The design concept (barbershop theme, copy text, color system) is original. Gallery images are provided by the site owner. Feel free to review the code as an example of front-end development craftsmanship.
