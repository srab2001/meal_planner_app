/**
 * Coaching Services - Module exports
 * 
 * Services for the Coaching module including:
 * - ChatGPT API integration
 * - Chat history management
 * - Audit logging
 * - Program templates
 * 
 * @module coaching/services
 */

export { chatGPTService, default as ChatGPTService } from './ChatGPTService';
export { chatHistoryService, default as ChatHistoryService } from './ChatHistoryService';
export { coachingAuditService, COACHING_EVENTS, default as CoachingAuditService } from './CoachingAuditService';
export { 
  PROGRAM_TEMPLATES,
  getAllPrograms,
  getProgramById,
  getProgramsByCategory,
  initializeUserPrograms
} from './ProgramTemplates';
