/**
 * Wireframe Design System Configuration
 * Based on FITNESS_WIREFRAMES_SPECIFICATIONS.md
 *
 * Usage: import { colors, spacing, typography, sizes } from './wireframe.config';
 */

export const colors = {
  // Primary palette
  primary: '#0066CC',       // Accent blue for buttons, links
  surface: '#F5F5F5',       // Light gray backgrounds
  background: '#FFFFFF',    // White base
  text: '#333333',          // Dark gray text
  textLight: '#666666',     // Secondary text
  border: '#CCCCCC',        // Borders and dividers

  // Feedback colors
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',

  // Interaction states
  hover: '#0052A3',
  disabled: '#E0E0E0',
  focus: '#0066CC'
};

export const typography = {
  // Font family
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

  // Font sizes
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px'
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
};

export const spacing = {
  // Base unit: 8px
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px'
};

export const sizes = {
  // Component heights
  inputHeight: '44px',        // Minimum touch target
  buttonHeight: '44px',
  cardHeight: 'auto',
  headerHeight: '60px',
  footerHeight: '60px',

  // Widths
  maxContentWidth: '1200px',
  sidebarWidth: '280px',

  // Border radius
  radiusSmall: '4px',
  radiusMedium: '8px',
  radiusLarge: '12px',
  radiusFull: '9999px'
};

export const grid = {
  // Responsive breakpoints
  breakpoints: {
    mobile: '375px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  },

  // Column counts
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12
  },

  // Gutters
  gutter: '16px'
};

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 20px rgba(0, 0, 0, 0.15)',
  xl: '0 20px 40px rgba(0, 0, 0, 0.2)'
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out'
};

// Validation states
export const validation = {
  error: {
    borderColor: colors.error,
    backgroundColor: '#FEF2F2',
    textColor: colors.error
  },
  success: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
    textColor: colors.success
  },
  warning: {
    borderColor: colors.warning,
    backgroundColor: '#FFFBEB',
    textColor: '#B45309'
  }
};

// Z-index layers
export const zIndex = {
  base: 1,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700
};

export default {
  colors,
  typography,
  spacing,
  sizes,
  grid,
  shadows,
  transitions,
  validation,
  zIndex
};
