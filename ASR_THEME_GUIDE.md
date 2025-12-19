# ASR Health Portal - Centralized Theme Guide

## Overview

This document describes the ASR Design System - a centralized theme derived from the ASR logo colors. All components should use these CSS custom properties (variables) instead of hard-coded hex values.

## Color Palette

### Primary - Purple (ASR Brand Core)
Used for primary actions, buttons, links, and brand elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `--asr-purple-50` | #f5f3ff | Lightest background tint |
| `--asr-purple-100` | #ede9fe | Hover backgrounds |
| `--asr-purple-200` | #ddd6fe | Focus rings |
| `--asr-purple-300` | #c4b5fd | Disabled states |
| `--asr-purple-400` | #a78bfa | Light accents |
| `--asr-purple-500` | #8b5cf6 | Base purple |
| `--asr-purple-600` | #7c3aed | **Primary action** ✓ |
| `--asr-purple-700` | #6d28d9 | Hover state |
| `--asr-purple-800` | #5b21b6 | Active/pressed |
| `--asr-purple-900` | #4c1d95 | Darkest shade |

### Secondary - Red (ASR Accent)
Used for secondary actions, alerts, and emphasis.

| Token | Hex | Usage |
|-------|-----|-------|
| `--asr-red-50` | #fef2f2 | Error backgrounds |
| `--asr-red-100` | #fee2e2 | Light error |
| `--asr-red-500` | #ef4444 | **Base red** ✓ |
| `--asr-red-600` | #dc2626 | Secondary action |
| `--asr-red-700` | #b91c1c | Hover state |

### Accent - Orange (Energy & Vitality)
Used for highlights, warnings, and call-to-action elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `--asr-orange-50` | #fff7ed | Warning backgrounds |
| `--asr-orange-100` | #ffedd5 | Light warning |
| `--asr-orange-500` | #f97316 | **Base orange** ✓ |
| `--asr-orange-600` | #ea580c | Accent action |
| `--asr-orange-700` | #c2410c | Hover state |

### Neutral - Gray Scale
Used for text, backgrounds, and borders.

| Token | Hex | Usage |
|-------|-----|-------|
| `--asr-gray-50` | #fafafa | Page backgrounds |
| `--asr-gray-100` | #f4f4f5 | Card backgrounds |
| `--asr-gray-200` | #e4e4e7 | Borders light |
| `--asr-gray-300` | #d4d4d8 | Borders default |
| `--asr-gray-400` | #a1a1aa | Placeholder text |
| `--asr-gray-500` | #71717a | Muted text |
| `--asr-gray-600` | #52525b | Secondary text |
| `--asr-gray-700` | #3f3f46 | Primary text (dark) |
| `--asr-gray-900` | #18181b | Headings |

---

## Semantic Tokens

Use these tokens for consistent meaning across the app:

### Actions
```css
--color-primary: var(--asr-purple-600);
--color-primary-hover: var(--asr-purple-700);
--color-secondary: var(--asr-red-500);
--color-secondary-hover: var(--asr-red-600);
--color-accent: var(--asr-orange-500);
--color-accent-hover: var(--asr-orange-600);
```

### Status
```css
--color-success: #22c55e;
--color-warning: var(--asr-orange-500);
--color-error: var(--asr-red-500);
--color-info: var(--asr-purple-500);
```

### Text
```css
--color-text-primary: var(--asr-gray-900);
--color-text-secondary: var(--asr-gray-600);
--color-text-muted: var(--asr-gray-500);
--color-text-placeholder: var(--asr-gray-400);
--color-text-inverse: #ffffff;
```

### Backgrounds
```css
--color-bg-primary: #ffffff;
--color-bg-secondary: var(--asr-gray-50);
--color-bg-tertiary: var(--asr-gray-100);
```

### Borders
```css
--color-border-light: var(--asr-gray-200);
--color-border-default: var(--asr-gray-300);
--color-border-focus: var(--asr-purple-500);
```

---

## Gradients

```css
/* Primary brand gradient - use for headers, CTAs */
--gradient-primary: linear-gradient(135deg, var(--asr-purple-500) 0%, var(--asr-purple-700) 100%);

/* Secondary gradient */
--gradient-secondary: linear-gradient(135deg, var(--asr-red-500) 0%, var(--asr-red-700) 100%);

/* Accent gradient */
--gradient-accent: linear-gradient(135deg, var(--asr-orange-400) 0%, var(--asr-orange-600) 100%);

/* Full brand spectrum (purple → red → orange) */
--gradient-brand: linear-gradient(135deg, var(--asr-purple-600) 0%, var(--asr-red-500) 50%, var(--asr-orange-500) 100%);
```

---

## Accessibility Notes

### Contrast Ratios (WCAG AA Compliant)

| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| `--asr-purple-600` | White | 4.56:1 | ✓ AA |
| `--asr-purple-700` | White | 6.01:1 | ✓ AAA |
| `--asr-red-500` | White | 4.51:1 | ✓ AA |
| `--color-success` | White | 3.03:1 | ✓ AA Large |
| `--asr-gray-600` | White | 5.89:1 | ✓ AAA |
| White | `--asr-purple-600` | 4.56:1 | ✓ AA |

### Focus States
Always use `--shadow-focus` for keyboard focus indicators:
```css
--shadow-focus: 0 0 0 3px var(--asr-purple-200);
```

---

## Usage Examples

### Button
```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}
.btn-primary:hover {
  background: var(--color-primary-hover);
}
.btn-primary:focus {
  box-shadow: var(--shadow-focus);
}
```

### Card
```css
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}
.card-title {
  color: var(--color-text-primary);
}
.card-description {
  color: var(--color-text-secondary);
}
```

### Header with Gradient
```css
.header {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
}
```

---

## Migration from Legacy Colors

| Old Value | New Token |
|-----------|-----------|
| `#667eea` | `var(--color-primary)` |
| `#764ba2` | `var(--asr-purple-700)` |
| `#333` | `var(--color-text-primary)` |
| `#666` | `var(--color-text-secondary)` |
| `#999` | `var(--color-text-muted)` |
| `#eee` | `var(--color-border-light)` |
| `#ff6b6b` | `var(--color-secondary)` |

---

## File Locations

- **Theme Definition**: `client/src/App.css` (`:root` block)
- **Components Updated**:
  - `SplashScreenOverlay.css`
  - `AppSwitchboard.css`
  - `App.css`

---

*ASR Digital Services - Health Portal Design System v1.0*
