# FocusFlow Design System

## Design Philosophy

**Focus-First Design**: Every element serves productivity without distraction
- **Minimal Aesthetic**: Clean, uncluttered interfaces
- **Cognitive Load Reduction**: Clear visual hierarchy
- **Accessibility First**: WCAG 2.1 AA compliance
- **Responsive by Default**: Mobile-first approach

## Color Palette

### Primary Colors
```css
:root {
  /* Brand Colors */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;  /* Main brand color */
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  /* Secondary Colors */
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-200: #e2e8f0;
  --secondary-300: #cbd5e1;
  --secondary-400: #94a3b8;
  --secondary-500: #64748b;
  --secondary-600: #475569;
  --secondary-700: #334155;
  --secondary-800: #1e293b;
  --secondary-900: #0f172a;

  /* Success Colors */
  --success-50: #f0fdf4;
  --success-500: #22c55e;
  --success-600: #16a34a;

  /* Warning Colors */
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;

  /* Error Colors */
  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;

  /* Info Colors */
  --info-50: #eff6ff;
  --info-500: #06b6d4;
  --info-600: #0891b2;
}
```

### Dark Mode Colors
```css
:root[data-theme="dark"] {
  --background: #0f172a;
  --surface: #1e293b;
  --surface-variant: #334155;
  --on-surface: #f8fafc;
  --on-surface-variant: #cbd5e1;
  --primary: #60a5fa;
  --on-primary: #1e3a8a;
  --border: #334155;
  --outline: #475569;
}
```

## Typography

### Font Stack
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  --font-display: 'Inter Display', sans-serif;
}
```

### Type Scale
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Typography Classes
```css
.text-headline {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
}

.text-body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
}

.text-caption {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--secondary-600);
}

.text-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  background: var(--secondary-100);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
```

## Spacing System

### Spatial Scale
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Layout Patterns
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.section {
  padding: var(--space-16) 0;
}

.card-spacing {
  padding: var(--space-6);
  gap: var(--space-4);
}

.button-spacing {
  gap: var(--space-3);
}
```

## Component System

### Button Design
```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: 0.5rem;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.btn:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Button Variants */
.btn-primary {
  background: var(--primary-500);
  color: white;
  border-color: var(--primary-500);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-600);
  border-color: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: transparent;
  color: var(--secondary-700);
  border-color: var(--secondary-300);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--secondary-50);
  border-color: var(--secondary-400);
}

.btn-ghost {
  background: transparent;
  color: var(--secondary-600);
  border: none;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--secondary-100);
  color: var(--secondary-800);
}

.btn-danger {
  background: var(--error-500);
  color: white;
  border-color: var(--error-500);
}

.btn-danger:hover:not(:disabled) {
  background: var(--error-600);
  border-color: var(--error-600);
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
}

.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
}

.btn-xl {
  padding: var(--space-5) var(--space-8);
  font-size: var(--text-lg);
}
```

### Card Component
```css
.card {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--border);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--on-surface);
  margin: 0;
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--secondary-600);
  margin: var(--space-1) 0 0 0;
}
```

### Input Components
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--background);
  color: var(--on-surface);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  transition: all 0.2s ease-in-out;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:invalid {
  border-color: var(--error-500);
}

.input:disabled {
  background: var(--surface-variant);
  color: var(--secondary-500);
  cursor: not-allowed;
}

.input-group {
  position: relative;
}

.input-group .input {
  padding-left: var(--space-10);
}

.input-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--secondary-400);
  pointer-events: none;
}

.input-error {
  border-color: var(--error-500);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-helper {
  font-size: var(--text-xs);
  color: var(--secondary-600);
  margin-top: var(--space-1);
}

.input-error-message {
  font-size: var(--text-xs);
  color: var(--error-600);
  margin-top: var(--space-1);
}
```

## Layout System

### Grid System
```css
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }

/* Responsive Grid */
@media (max-width: 768px) {
  .grid-cols-md-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .grid-cols-md-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 480px) {
  .grid-cols-sm-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
}
```

### Flexbox Utilities
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-none { flex: none; }
```

## Animation & Transitions

### Motion Principles
- **Purposeful**: Every animation serves a function
- **Subtle**: Enhances without distracting
- **Consistent**: Predictable timing and easing
- **Accessible**: Respects `prefers-reduced-motion`

### Animation Tokens
```css
:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;

  /* Easing Functions */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Transitions */
  --transition-colors: color var(--duration-normal) var(--ease-out),
                       background-color var(--duration-normal) var(--ease-out),
                       border-color var(--duration-normal) var(--ease-out);

  --transition-transform: transform var(--duration-normal) var(--ease-out);

  --transition-all: all var(--duration-normal) var(--ease-out);
}
```

### Animation Classes
```css
.fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slide-up {
  animation: slideUp var(--duration-normal) var(--ease-out);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scale-in {
  animation: scaleIn var(--duration-fast) var(--ease-out);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Icon System

### Icon Library (Lucide Icons)
```css
.icon {
  width: 1.25rem;
  height: 1.25rem;
  display: inline-block;
  vertical-align: middle;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-xs { width: 0.75rem; height: 0.75rem; }
.icon-sm { width: 1rem; height: 1rem; }
.icon-md { width: 1.25rem; height: 1.25rem; }
.icon-lg { width: 1.5rem; height: 1.5rem; }
.icon-xl { width: 2rem; height: 2rem; }

.icon-primary { color: var(--primary-500); }
.icon-secondary { color: var(--secondary-500); }
.icon-success { color: var(--success-500); }
.icon-warning { color: var(--warning-500); }
.icon-error { color: var(--error-500); }
```

## Dark Mode Implementation

### Theme Toggle
```css
.theme-toggle {
  position: relative;
  width: 3rem;
  height: 1.5rem;
  background: var(--secondary-200);
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: var(--transition-colors);
}

.theme-toggle:hover {
  background: var(--secondary-300);
}

.theme-toggle-thumb {
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  border-radius: 50%;
  transition: var(--transition-transform);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .theme-toggle {
  background: var(--primary-600);
}

[data-theme="dark"] .theme-toggle-thumb {
  transform: translateX(1.5rem);
}
```

## Accessibility Guidelines

### Focus Management
```css
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-500);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 9999;
}

.skip-link:focus {
  top: 6px;
}
```

### Screen Reader Support
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Responsive Design

### Breakpoint System
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Mobile-first approach */
@media (min-width: 640px) {
  .sm\:hidden { display: none; }
  .sm\:block { display: block; }
  .sm\:flex { display: flex; }
}

@media (min-width: 768px) {
  .md\:hidden { display: none; }
  .md\:block { display: block; }
  .md\:flex { display: flex; }
}

@media (min-width: 1024px) {
  .lg\:hidden { display: none; }
  .lg\:block { display: block; }
  .lg\:flex { display: flex; }
}
```

## Component Examples

### Task Card Component
```css
.task-card {
  @apply card;
  position: relative;
  padding: var(--space-4);
}

.task-card-priority-high {
  border-left: 4px solid var(--error-500);
}

.task-card-priority-medium {
  border-left: 4px solid var(--warning-500);
}

.task-card-priority-low {
  border-left: 4px solid var(--success-500);
}

.task-card-title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--on-surface);
  margin: 0 0 var(--space-2) 0;
}

.task-card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--secondary-600);
}

.task-card-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
```

### Progress Indicator
```css
.progress {
  width: 100%;
  height: 0.5rem;
  background: var(--surface-variant);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary-500);
  border-radius: 9999px;
  transition: width var(--duration-normal) var(--ease-out);
}

.progress-sm { height: 0.25rem; }
.progress-lg { height: 0.75rem; }

.progress-success .progress-bar {
  background: var(--success-500);
}

.progress-warning .progress-bar {
  background: var(--warning-500);
}

.progress-error .progress-bar {
  background: var(--error-500);
}
```

This comprehensive design system ensures consistency, accessibility, and a focus-first user experience across all FocusFlow interfaces.
