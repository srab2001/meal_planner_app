/**
 * Admin Module - Entry Point
 * 
 * Exports admin components for use in the main app:
 * - AdminCoachPanel: AI Coach question management
 * - UserManagementPanel: User and invitation management
 * - AdminSwitchboard: Admin panel navigation hub
 * - UsersAdmin: User management page
 */

// AI Coach Admin Components
export { default as AdminCoachPanel } from './components/AdminCoachPanel';
export { default as QuestionList } from './components/QuestionList';
export { default as QuestionForm } from './components/QuestionForm';
export { default as QuestionPreview } from './components/QuestionPreview';

// User Management Components
export { default as UserManagementPanel } from './components/UserManagementPanel';
export { default as UserTable } from './components/UserTable';
export { default as InviteForm } from './components/InviteForm';

// Admin Pages (for routing)
export { default as AdminSwitchboard } from './pages/AdminSwitchboard';
export { default as UsersAdmin } from './pages/UsersAdmin';
