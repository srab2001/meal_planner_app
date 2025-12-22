/**
 * Fitness Module - UI Wireframe Configuration
 * Defines consistent styling and layout based on wireframe specifications
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const colors = {
  // Primary Colors
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#333333',
  
  // Borders & Dividers
  border: '#CCCCCC',
  
  // Interactive Elements
  primary: '#0066CC',
  primaryHover: '#0052A3',
  primaryDisabled: '#CCCCCC',
  
  // Feedback Colors
  error: '#CC0000',
  success: '#00CC00',
  warning: '#FF9800',
  
  // Text Variants
  textSecondary: '#666666',
  textDisabled: '#999999',
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const typography = {
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: '1.3',
    fontFamily: 'sans-serif',
  },
  
  subheading: {
    fontSize: '16px',
    fontWeight: 'bold',
    lineHeight: '1.4',
    fontFamily: 'sans-serif',
  },
  
  body: {
    fontSize: '14px',
    fontWeight: 'normal',
    lineHeight: '1.5',
    fontFamily: 'sans-serif',
  },
  
  bodySmall: {
    fontSize: '12px',
    fontWeight: 'normal',
    lineHeight: '1.4',
    fontFamily: 'sans-serif',
  },
  
  label: {
    fontSize: '12px',
    fontWeight: 'normal',
    lineHeight: '1.3',
    fontFamily: 'sans-serif',
  },
};

// ============================================================================
// SPACING SYSTEM (8px base unit)
// ============================================================================
export const spacing = {
  xs: '4px',      // 0.5 units
  sm: '8px',      // 1 unit
  md: '12px',     // 1.5 units
  lg: '16px',     // 2 units
  xl: '20px',     // 2.5 units
  xxl: '24px',    // 3 units
};

// ============================================================================
// COMPONENT SIZES
// ============================================================================
export const sizes = {
  // Touch targets (minimum 44x44px)
  touchTarget: '44px',
  
  // Input/Button Heights
  inputHeight: '44px',
  buttonHeight: '44px',
  
  // Icon Sizes
  iconSmall: '16px',
  iconMedium: '24px',
  iconLarge: '32px',
  
  // Header Heights
  headerHeight: '60px',
  
  // Section Heights
  sectionBasics: '120px',
  footerHeight: '60px',
  
  // Border radius
  borderRadius: '12px',
  borderRadiusSmall: '4px',
};

// ============================================================================
// GRID SYSTEM
// ============================================================================
export const grid = {
  desktop: {
    columns: 12,
    gutter: '20px',
  },
  tablet: {
    columns: 8,
    gutter: '16px',
  },
  mobile: {
    columns: 4,
    gutter: '16px',
  },
};

// ============================================================================
// BREAKPOINTS
// ============================================================================
export const breakpoints = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
};

// ============================================================================
// SHADOWS
// ============================================================================
export const shadows = {
  none: 'none',
  small: '0 1px 3px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
  large: '0 10px 15px rgba(0, 0, 0, 0.1)',
  modal: '0 20px 25px rgba(0, 0, 0, 0.15)',
};

// ============================================================================
// TRANSITIONS
// ============================================================================
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out',
};

// ============================================================================
// FORM COMPONENT STANDARDS
// ============================================================================
export const form = {
  // Input Fields
  input: {
    height: '44px',
    padding: '0 12px',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    fontSize: '14px',
    transition: transitions.normal,
    
    focus: {
      outline: 'none',
      borderColor: colors.primary,
      boxShadow: `0 0 0 3px rgba(0, 102, 204, 0.1)`,
    },
    
    disabled: {
      backgroundColor: colors.surface,
      color: colors.textDisabled,
      cursor: 'not-allowed',
    },
    
    error: {
      borderColor: colors.error,
      backgroundColor: 'rgba(204, 0, 0, 0.05)',
    },
  },
  
  // Labels
  label: {
    fontSize: '12px',
    fontWeight: 'normal',
    color: colors.textSecondary,
    marginBottom: '8px',
    display: 'block',
  },
  
  // Buttons
  button: {
    height: '44px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: transitions.normal,
    minWidth: '100px',
    
    primary: {
      backgroundColor: colors.primary,
      color: '#FFFFFF',
      
      hover: {
        backgroundColor: colors.primaryHover,
      },
      
      disabled: {
        backgroundColor: colors.primaryDisabled,
        color: '#FFFFFF',
        cursor: 'not-allowed',
      },
    },
    
    secondary: {
      backgroundColor: '#FFFFFF',
      color: colors.text,
      border: `1px solid ${colors.border}`,
      
      hover: {
        backgroundColor: colors.surface,
      },
    },
  },
};

// ============================================================================
// CARD & CONTAINER STANDARDS
// ============================================================================
export const containers = {
  card: {
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    padding: '12px',
    boxShadow: shadows.small,
    backgroundColor: '#FFFFFF',
  },
  
  section: {
    backgroundColor: colors.surface,
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '16px',
  },
};

// ============================================================================
// MODAL STANDARDS
// ============================================================================
export const modal = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px 12px 0 0',
    boxShadow: shadows.modal,
    maxHeight: '90vh',
    zIndex: 1001,
  },
};

// ============================================================================
// RESPONSIVE HELPERS
// ============================================================================
export const media = {
  mobile: `@media (max-width: ${breakpoints.tablet})`,
  tablet: `@media (min-width: ${breakpoints.tablet}) and (max-width: ${breakpoints.desktop})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
};

// ============================================================================
// VALIDATION STATES
// ============================================================================
export const validation = {
  error: {
    color: colors.error,
    borderColor: colors.error,
    backgroundColor: 'rgba(204, 0, 0, 0.05)',
  },
  
  success: {
    color: colors.success,
    borderColor: colors.success,
    backgroundColor: 'rgba(0, 204, 0, 0.05)',
  },
  
  warning: {
    color: colors.warning,
    borderColor: colors.warning,
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
  },
};

export default {
  colors,
  typography,
  spacing,
  sizes,
  grid,
  breakpoints,
  shadows,
  transitions,
  form,
  containers,
  modal,
  media,
  validation,
};
