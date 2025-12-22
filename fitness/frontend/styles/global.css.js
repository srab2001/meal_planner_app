/**
 * Fitness Module - Global Styles
 * Implements wireframe specifications across all components
 */

import config from './wireframe.config';

const {
  colors,
  typography,
  spacing,
  sizes,
  transitions,
  form,
  containers,
  media,
} = config;

// ============================================================================
// RESET & BASE STYLES
// ============================================================================
const baseStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: ${colors.background};
    color: ${colors.text};
    line-height: 1.5;
    font-size: 14px;
    overflow-x: hidden;
  }

  /* Remove default focus styles - we'll add custom ones */
  button:focus,
  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
`;

// ============================================================================
// TYPOGRAPHY
// ============================================================================
const typographyStyles = `
  h1 {
    font-size: 24px;
    font-weight: bold;
    line-height: 1.3;
    margin-bottom: ${spacing.lg};
  }

  h2 {
    font-size: 20px;
    font-weight: bold;
    line-height: 1.3;
    margin-bottom: ${spacing.md};
  }

  h3 {
    font-size: 16px;
    font-weight: bold;
    line-height: 1.4;
    margin-bottom: ${spacing.md};
  }

  p {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: ${spacing.md};
  }

  small {
    font-size: 12px;
    color: ${colors.textSecondary};
  }

  label {
    font-size: 12px;
    color: ${colors.textSecondary};
    display: block;
    margin-bottom: ${spacing.sm};
  }
`;

// ============================================================================
// FORM ELEMENTS
// ============================================================================
const formStyles = `
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="number"],
  input[type="date"],
  input[type="time"],
  textarea,
  select {
    width: 100%;
    height: ${form.input.height};
    padding: ${form.input.padding};
    border: ${form.input.border};
    border-radius: ${form.input.borderRadius};
    font-size: ${form.input.fontSize};
    font-family: inherit;
    transition: ${form.input.transition};
    background-color: ${colors.background};
    color: ${colors.text};
  }

  textarea {
    height: auto;
    min-height: 100px;
    padding: ${spacing.md};
    resize: vertical;
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: ${colors.primary};
    box-shadow: ${form.input.focus.boxShadow};
  }

  input:disabled,
  textarea:disabled,
  select:disabled {
    background-color: ${colors.surface};
    color: ${colors.textDisabled};
    cursor: not-allowed;
  }

  input.error,
  textarea.error,
  select.error {
    border-color: ${colors.error};
    background-color: rgba(204, 0, 0, 0.05);
  }

  input::placeholder,
  textarea::placeholder {
    color: ${colors.textSecondary};
  }

  /* Select dropdown arrow styling */
  select {
    appearance: none;
    background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e');
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 20px;
    padding-right: 36px;
  }
`;

// ============================================================================
// BUTTONS
// ============================================================================
const buttonStyles = `
  button,
  .btn {
    height: ${form.button.height};
    border-radius: ${form.button.borderRadius};
    border: none;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: ${form.button.primary.hover};
    min-width: 100px;
    padding: 0 ${spacing.lg};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${spacing.sm};
  }

  .btn-primary,
  button:not(.btn-secondary) {
    background-color: ${colors.primary};
    color: #FFFFFF;
  }

  .btn-primary:hover,
  button:not(.btn-secondary):hover {
    background-color: ${colors.primaryHover};
  }

  .btn-primary:disabled,
  button:not(.btn-secondary):disabled {
    background-color: ${colors.primaryDisabled};
    color: #FFFFFF;
    cursor: not-allowed;
  }

  .btn-secondary {
    background-color: #FFFFFF;
    color: ${colors.text};
    border: 1px solid ${colors.border};
  }

  .btn-secondary:hover {
    background-color: ${colors.surface};
  }

  .btn-secondary:disabled {
    background-color: ${colors.surface};
    color: ${colors.textDisabled};
    border-color: ${colors.border};
    cursor: not-allowed;
  }

  /* Icon buttons */
  button.icon-btn {
    width: ${sizes.touchTarget};
    height: ${sizes.touchTarget};
    padding: 0;
    min-width: unset;
    border-radius: 50%;
    background-color: transparent;
    color: ${colors.primary};
  }

  button.icon-btn:hover {
    background-color: ${colors.surface};
  }

  /* Full-width button */
  .btn-full {
    width: 100%;
  }

  /* Small button */
  .btn-small {
    height: 36px;
    font-size: 12px;
    min-width: 60px;
  }
`;

// ============================================================================
// CARDS & CONTAINERS
// ============================================================================
const containerStyles = `
  .card {
    border-radius: ${containers.card.borderRadius};
    border: ${containers.card.border};
    padding: ${containers.card.padding};
    box-shadow: ${containers.card.boxShadow};
    background-color: ${containers.card.backgroundColor};
    margin-bottom: ${spacing.lg};
  }

  .section {
    background-color: ${containers.section.backgroundColor};
    padding: ${containers.section.padding};
    border-radius: ${containers.section.borderRadius};
    margin-bottom: ${containers.section.marginBottom};
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${spacing.lg};
  }

  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: ${colors.text};
  }

  /* Divider */
  hr,
  .divider {
    border: none;
    border-top: 1px solid ${colors.border};
    margin: ${spacing.lg} 0;
  }
`;

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================
const layoutStyles = `
  .container {
    max-width: 1440px;
    margin: 0 auto;
    padding: ${spacing.lg};
  }

  .row {
    display: flex;
    gap: ${spacing.lg};
    margin-bottom: ${spacing.lg};
  }

  .col {
    flex: 1;
  }

  .flex {
    display: flex;
    gap: ${spacing.lg};
  }

  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${spacing.lg};
  }

  .flex-start {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: ${spacing.lg};
  }

  .flex-end {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: ${spacing.lg};
  }

  .flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: ${spacing.lg};
  }

  .grid {
    display: grid;
    gap: ${spacing.lg};
  }

  .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  /* Spacing utilities */
  .mt-sm { margin-top: ${spacing.sm}; }
  .mt-md { margin-top: ${spacing.md}; }
  .mt-lg { margin-top: ${spacing.lg}; }
  .mt-xl { margin-top: ${spacing.xl}; }

  .mb-sm { margin-bottom: ${spacing.sm}; }
  .mb-md { margin-bottom: ${spacing.md}; }
  .mb-lg { margin-bottom: ${spacing.lg}; }
  .mb-xl { margin-bottom: ${spacing.xl}; }

  .p-sm { padding: ${spacing.sm}; }
  .p-md { padding: ${spacing.md}; }
  .p-lg { padding: ${spacing.lg}; }
  .p-xl { padding: ${spacing.xl}; }

  .gap-sm { gap: ${spacing.sm}; }
  .gap-md { gap: ${spacing.md}; }
  .gap-lg { gap: ${spacing.lg}; }
  .gap-xl { gap: ${spacing.xl}; }
`;

// ============================================================================
// HEADER & FOOTER
// ============================================================================
const structuralStyles = `
  .header {
    height: ${sizes.headerHeight};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 ${spacing.lg};
    background-color: ${colors.background};
    border-bottom: 1px solid ${colors.border};
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-title {
    font-size: 18px;
    font-weight: bold;
    color: ${colors.text};
    text-align: center;
    flex: 1;
  }

  .footer {
    height: ${sizes.footerHeight};
    display: flex;
    gap: ${spacing.lg};
    align-items: center;
    padding: ${spacing.lg};
    background-color: ${colors.background};
    border-top: 1px solid ${colors.border};
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  .footer button {
    flex: 1;
  }

  /* Add padding to body to account for fixed footer */
  body.has-footer {
    padding-bottom: ${sizes.footerHeight};
  }
`;

// ============================================================================
// VALIDATION & FEEDBACK
// ============================================================================
const feedbackStyles = `
  .error-message {
    color: ${colors.error};
    font-size: 12px;
    margin-top: ${spacing.sm};
    display: flex;
    align-items: center;
    gap: ${spacing.sm};
  }

  .success-message {
    color: ${colors.success};
    font-size: 12px;
    margin-top: ${spacing.sm};
  }

  .warning-message {
    color: ${colors.warning};
    font-size: 12px;
    margin-top: ${spacing.sm};
  }

  .error-banner {
    background-color: rgba(204, 0, 0, 0.05);
    border-left: 3px solid ${colors.error};
    padding: ${spacing.md};
    margin-bottom: ${spacing.lg};
    border-radius: ${sizes.borderRadiusSmall};
    color: ${colors.error};
  }

  .success-banner {
    background-color: rgba(0, 204, 0, 0.05);
    border-left: 3px solid ${colors.success};
    padding: ${spacing.md};
    margin-bottom: ${spacing.lg};
    border-radius: ${sizes.borderRadiusSmall};
    color: ${colors.success};
  }

  .info-banner {
    background-color: rgba(0, 102, 204, 0.05);
    border-left: 3px solid ${colors.primary};
    padding: ${spacing.md};
    margin-bottom: ${spacing.lg};
    border-radius: ${sizes.borderRadiusSmall};
    color: ${colors.primary};
  }
`;

// ============================================================================
// RESPONSIVE
// ============================================================================
const responsiveStyles = `
  ${media.mobile} {
    .container {
      padding: ${spacing.md};
    }

    .header {
      padding: 0 ${spacing.md};
    }

    .footer {
      padding: ${spacing.md};
    }

    .grid-2,
    .grid-3 {
      grid-template-columns: 1fr;
    }

    .hide-mobile {
      display: none;
    }
  }

  ${media.desktop} {
    .hide-desktop {
      display: none;
    }
  }
`;

// ============================================================================
// EXPORT GLOBAL STYLES
// ============================================================================
export const globalStyles = `
  ${baseStyles}
  ${typographyStyles}
  ${formStyles}
  ${buttonStyles}
  ${containerStyles}
  ${layoutStyles}
  ${structuralStyles}
  ${feedbackStyles}
  ${responsiveStyles}
`;

export default globalStyles;
